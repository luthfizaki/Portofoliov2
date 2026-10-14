import { basename, extname } from "node:path";
import { inflateSync } from "node:zlib";

export const MAX_MEDIA_FILE_SIZE = 10 * 1024 * 1024;
const MAX_DECODED_IMAGE_BYTES = 100 * 1024 * 1024;

type SupportedMedia = {
  mimeType: string;
  extensions: readonly string[];
};

export const SUPPORTED_MEDIA = [
  { mimeType: "image/jpeg", extensions: [".jpg", ".jpeg"] },
  { mimeType: "image/png", extensions: [".png"] },
  { mimeType: "image/webp", extensions: [".webp"] },
  // These formats are still used by the page editor's asset fields.
  { mimeType: "application/pdf", extensions: [".pdf"] },
  { mimeType: "video/mp4", extensions: [".mp4"] },
] as const satisfies readonly SupportedMedia[];

export type UploadedMediaFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export class InvalidMediaUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMediaUploadError";
  }
}

function supportedMediaForMime(mimeType: string) {
  return SUPPORTED_MEDIA.find((media) => media.mimeType === mimeType);
}

export function isSupportedMediaMimeType(mimeType: string | undefined) {
  return Boolean(mimeType && supportedMediaForMime(mimeType.toLowerCase()));
}

function invalidStructure(format: string): never {
  throw new InvalidMediaUploadError(`The ${format} file structure is invalid.`);
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function validatePng(buffer: Buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < signature.length || !buffer.subarray(0, signature.length).equals(signature)) {
    invalidStructure("PNG");
  }

  let offset = signature.length;
  let sawHeader = false;
  let sawImageData = false;
  let sawEnd = false;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlaceMethod = 0;
  let hasPalette = false;
  const compressedImageData: Buffer[] = [];

  while (offset < buffer.length) {
    if (offset + 12 > buffer.length) invalidStructure("PNG");
    const length = buffer.readUInt32BE(offset);
    const typeStart = offset + 4;
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + 4;
    if (dataEnd < dataStart || chunkEnd > buffer.length) invalidStructure("PNG");

    const type = buffer.toString("ascii", typeStart, typeStart + 4);
    const data = buffer.subarray(dataStart, dataEnd);
    const expectedCrc = buffer.readUInt32BE(dataEnd);
    const actualCrc = crc32(Buffer.concat([buffer.subarray(typeStart, typeStart + 4), data]));
    if (actualCrc !== expectedCrc) invalidStructure("PNG");

    if (!sawHeader && type !== "IHDR") invalidStructure("PNG");
    if (type === "IHDR") {
      if (sawHeader || data.length !== 13) invalidStructure("PNG");
      sawHeader = true;
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (width === 0 || height === 0 || data[10] !== 0 || data[11] !== 0) invalidStructure("PNG");
      interlaceMethod = data[12];
      if (interlaceMethod !== 0) invalidStructure("PNG");
      const validDepths: Record<number, readonly number[]> = {
        0: [1, 2, 4, 8, 16],
        2: [8, 16],
        3: [1, 2, 4, 8],
        4: [8, 16],
        6: [8, 16],
      };
      if (!validDepths[colorType]?.includes(bitDepth)) invalidStructure("PNG");
    } else if (type === "PLTE") {
      if (data.length === 0 || data.length % 3 !== 0) invalidStructure("PNG");
      hasPalette = true;
    } else if (type === "IDAT") {
      if (!sawHeader || sawEnd) invalidStructure("PNG");
      sawImageData = true;
      compressedImageData.push(data);
    } else if (type === "IEND") {
      if (data.length !== 0 || !sawImageData) invalidStructure("PNG");
      sawEnd = true;
      offset = chunkEnd;
      break;
    }

    offset = chunkEnd;
  }

  if (!sawHeader || !sawImageData || !sawEnd || offset !== buffer.length) invalidStructure("PNG");
  if (colorType === 3 && !hasPalette) invalidStructure("PNG");

  const channels = colorType === 0 ? 1 : colorType === 2 ? 3 : colorType === 3 ? 1 : colorType === 4 ? 2 : 4;
  const rowBytes = Math.ceil((width * channels * bitDepth) / 8);
  const expectedDecodedLength = (rowBytes + 1) * height;
  if (!Number.isSafeInteger(expectedDecodedLength) || expectedDecodedLength > MAX_DECODED_IMAGE_BYTES) {
    invalidStructure("PNG");
  }
  let decompressed: Buffer;
  try {
    decompressed = inflateSync(Buffer.concat(compressedImageData), {
      maxOutputLength: MAX_DECODED_IMAGE_BYTES,
    });
  } catch {
    invalidStructure("PNG");
  }
  if (decompressed.length !== expectedDecodedLength) invalidStructure("PNG");
}

function validateJpeg(buffer: Buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) invalidStructure("JPEG");

  let offset = 2;
  let sawFrame = false;
  let sawScan = false;
  let sawEnd = false;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) invalidStructure("JPEG");
    while (buffer[offset] === 0xff) offset += 1;
    if (offset >= buffer.length) invalidStructure("JPEG");
    const marker = buffer[offset++];
    if (marker === 0x00) invalidStructure("JPEG");
    if (marker === 0xd9 || marker === 0xda) {
      if (marker === 0xd9 || sawScan) invalidStructure("JPEG");
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) invalidStructure("JPEG");
    if (offset + 2 > buffer.length) invalidStructure("JPEG");
    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) invalidStructure("JPEG");

    const isFrameMarker =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isFrameMarker) {
      if (sawFrame || segmentLength < 8) invalidStructure("JPEG");
      const precision = buffer[offset + 2];
      const height = buffer.readUInt16BE(offset + 3);
      const width = buffer.readUInt16BE(offset + 5);
      const components = buffer[offset + 7];
      if (precision !== 8 || width === 0 || height === 0 || ![1, 3, 4].includes(components) || segmentLength !== 8 + components * 3) {
        invalidStructure("JPEG");
      }
      sawFrame = true;
    }

    offset += segmentLength;
    if (marker !== 0xda) continue;
    if (!sawFrame || segmentLength < 8) invalidStructure("JPEG");
    sawScan = true;

    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      let markerOffset = offset;
      while (buffer[markerOffset] === 0xff) markerOffset += 1;
      if (markerOffset >= buffer.length) invalidStructure("JPEG");
      const scanMarker = buffer[markerOffset];
      if (scanMarker === 0x00 || (scanMarker >= 0xd0 && scanMarker <= 0xd7)) {
        offset = markerOffset + 1;
        continue;
      }
      if (scanMarker !== 0xd9) invalidStructure("JPEG");
      offset = markerOffset + 1;
      sawEnd = true;
      break;
    }
    break;
  }

  if (!sawFrame || !sawScan || !sawEnd || offset !== buffer.length) invalidStructure("JPEG");
}

function validateWebp(buffer: Buffer) {
  if (buffer.length < 20 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    invalidStructure("WebP");
  }
  if (buffer.readUInt32LE(4) !== buffer.length - 8) invalidStructure("WebP");

  let offset = 12;
  let sawImage = false;
  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) invalidStructure("WebP");
    const type = buffer.toString("ascii", offset, offset + 4);
    const length = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const paddedEnd = dataEnd + (length % 2);
    if (dataEnd < dataStart || paddedEnd > buffer.length) invalidStructure("WebP");
    const data = buffer.subarray(dataStart, dataEnd);

    if (type === "VP8 ") {
      if (data.length < 10 || (data[3] !== 0x9d || data[4] !== 0x01 || data[5] !== 0x2a)) invalidStructure("WebP");
      if ((data.readUInt16LE(6) & 0x3fff) === 0 || (data.readUInt16LE(8) & 0x3fff) === 0) invalidStructure("WebP");
      sawImage = true;
    } else if (type === "VP8L") {
      if (data.length < 5 || data[0] !== 0x2f) invalidStructure("WebP");
      const width = 1 + (data[1] | ((data[2] & 0x3f) << 8));
      const height = 1 + ((data[2] >> 6) | (data[3] << 2) | ((data[4] & 0x0f) << 10));
      if (width === 0 || height === 0) invalidStructure("WebP");
      sawImage = true;
    } else if (type === "VP8X") {
      if (data.length !== 10) invalidStructure("WebP");
      const width = 1 + data[4] + (data[5] << 8) + (data[6] << 16);
      const height = 1 + data[7] + (data[8] << 8) + (data[9] << 16);
      if (width === 0 || height === 0) invalidStructure("WebP");
    }

    offset = paddedEnd;
  }
  if (!sawImage || offset !== buffer.length) invalidStructure("WebP");
}

function validatePdf(buffer: Buffer) {
  const text = buffer.toString("latin1");
  if (!/^%PDF-(?:1\.[0-7]|2\.0)\r?\n/.test(text)) invalidStructure("PDF");
  const eofIndex = text.lastIndexOf("%%EOF");
  if (eofIndex < 0 || text.slice(eofIndex + 5).trim() !== "") invalidStructure("PDF");
  const startXrefIndex = text.lastIndexOf("startxref", eofIndex);
  if (startXrefIndex < 0) invalidStructure("PDF");
  const xrefMatch = text.slice(startXrefIndex + "startxref".length).match(/^\s*(\d+)/);
  if (!xrefMatch || Number(xrefMatch[1]) >= buffer.length) invalidStructure("PDF");
  if (!text.includes("trailer") && !text.includes("/Type /XRef")) invalidStructure("PDF");
  if (!text.includes("obj") || !text.includes("endobj")) invalidStructure("PDF");
  if (/\/(?:JavaScript|JS|Launch|OpenAction|AA)\b/.test(text)) invalidStructure("PDF");
}

function validateMp4(buffer: Buffer) {
  let offset = 0;
  let sawFileType = false;
  let sawMediaData = false;
  let sawMovie = false;

  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) invalidStructure("MP4");
    const boxStart = offset;
    const size32 = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (boxStart === 0 && type !== "ftyp") invalidStructure("MP4");
    offset += 8;
    let boxSize = size32;
    if (size32 === 1) {
      if (offset + 8 > buffer.length) invalidStructure("MP4");
      const high = buffer.readUInt32BE(offset);
      const low = buffer.readUInt32BE(offset + 4);
      if (high > 0x1fffff) invalidStructure("MP4");
      boxSize = high * 0x100000000 + low;
      offset += 8;
    } else if (size32 === 0) {
      boxSize = buffer.length - boxStart;
    }
    const headerSize = offset - boxStart;
    if (boxSize < headerSize || boxStart + boxSize > buffer.length) invalidStructure("MP4");

    const payload = buffer.subarray(offset, boxStart + boxSize);
    if (type === "ftyp") {
      if (payload.length < 8 || !/^[\x20-\x7e]{4}$/.test(payload.toString("ascii", 0, 4))) invalidStructure("MP4");
      sawFileType = true;
    } else if (type === "mdat") {
      sawMediaData = true;
    } else if (type === "moov" || type === "moof") {
      sawMovie = true;
    }
    offset = boxStart + boxSize;
  }

  if (!sawFileType || !sawMediaData || !sawMovie || offset !== buffer.length) invalidStructure("MP4");
}

function validateContent(mimeType: string, buffer: Buffer) {
  switch (mimeType) {
    case "image/jpeg":
      validateJpeg(buffer);
      return;
    case "image/png":
      validatePng(buffer);
      return;
    case "image/webp":
      validateWebp(buffer);
      return;
    case "application/pdf":
      validatePdf(buffer);
      return;
    case "video/mp4":
      validateMp4(buffer);
      return;
    default:
      invalidStructure("media");
  }
}

export function safeOriginalName(originalName: string) {
  const normalized = originalName.replaceAll("\\", "/");
  return basename(normalized);
}

export function validateMediaUpload(file: UploadedMediaFile) {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    throw new InvalidMediaUploadError("A valid file is required.");
  }
  if (file.buffer.length === 0 || file.size <= 0) {
    throw new InvalidMediaUploadError("The uploaded file is empty.");
  }
  if (file.buffer.length !== file.size) {
    throw new InvalidMediaUploadError("The uploaded file metadata is invalid.");
  }
  if (file.size > MAX_MEDIA_FILE_SIZE) {
    throw new InvalidMediaUploadError("The uploaded file is too large.");
  }

  const mimeType = file.mimetype.trim().toLowerCase();
  const supported = supportedMediaForMime(mimeType);
  if (!supported) {
    throw new InvalidMediaUploadError("This file type is not supported.");
  }

  const originalName = safeOriginalName(file.originalname);
  const extension = extname(originalName).toLowerCase();
  if (!supported.extensions.some((supportedExtension) => supportedExtension === extension)) {
    throw new InvalidMediaUploadError("The file extension does not match its content type.");
  }
  try {
    validateContent(mimeType, file.buffer);
  } catch (error) {
    if (error instanceof InvalidMediaUploadError) throw error;
    throw new InvalidMediaUploadError("The file content does not match its declared type.");
  }

  return { mimeType, extension, originalName };
}
