import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException } from "@nestjs/common";
import {
  InvalidMediaUploadError,
  MAX_MEDIA_FILE_SIZE,
  validateMediaUpload,
} from "./media-validation";
import { MediaService } from "./media.service";

function file(originalname: string, mimetype: string, buffer: Buffer) {
  return { originalname, mimetype, buffer, size: buffer.length };
}

// Generated 1x1 raster fixtures; these contain complete container structure,
// not only a format prefix.
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==", "base64");
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x00, 0xff, 0xd9]);
const webp = Buffer.from("UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoBAAEAAUAmJaACdLoB+AADsAD+8ut//NgVzXPv9//S4P0uD9Lg/9KQAAA=", "base64");

function box(type: string, payload: Buffer) {
  const result = Buffer.alloc(8 + payload.length);
  result.writeUInt32BE(result.length, 0);
  result.write(type, 4, 4, "ascii");
  payload.copy(result, 8);
  return result;
}

// A structurally valid ISO-BMFF container fixture. Codec-level playback is
// intentionally outside this dependency-free validator's scope.
const mp4 = Buffer.concat([
  box("ftyp", Buffer.from("isom\x00\x00\x02\x00isom", "latin1")),
  box("moov", Buffer.alloc(0)),
  box("mdat", Buffer.from([0x00])),
]);

function validPdf() {
  const header = "%PDF-1.4\n";
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n",
  ];
  let body = header;
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body, "latin1"));
    body += object;
  }
  const xrefOffset = Buffer.byteLength(body, "latin1");
  body += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  body += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}

const pdf = validPdf();

test("accepted raster image formats require matching signatures and extensions", () => {
  assert.equal(validateMediaUpload(file("cover.png", "image/png", png)).mimeType, "image/png");
  assert.equal(validateMediaUpload(file("cover.jpg", "image/jpeg", jpeg)).extension, ".jpg");
  assert.equal(validateMediaUpload(file("cover.webp", "image/webp", webp)).extension, ".webp");
});

test("existing page-editor PDF and MP4 formats remain supported", () => {
  assert.equal(validateMediaUpload(file("brief.pdf", "application/pdf", pdf)).mimeType, "application/pdf");
  assert.equal(validateMediaUpload(file("demo.mp4", "video/mp4", mp4)).mimeType, "video/mp4");
});

test("truncated and malformed structured media are rejected", () => {
  assert.throws(() => validateMediaUpload(file("cover.png", "image/png", png.subarray(0, 8))), /structure is invalid/);
  assert.throws(() => validateMediaUpload(file("cover.jpg", "image/jpeg", jpeg.subarray(0, jpeg.length - 2))), /structure is invalid/);
  assert.throws(() => validateMediaUpload(file("cover.webp", "image/webp", webp.subarray(0, webp.length - 1))), /structure is invalid/);
  assert.throws(() => validateMediaUpload(file("brief.pdf", "application/pdf", Buffer.from("%PDF-1.7\n%%EOF\n"))), /structure is invalid/);
  assert.throws(() => validateMediaUpload(file("demo.mp4", "video/mp4", mp4.subarray(0, mp4.length - 1))), /structure is invalid/);
});

test("PNG signature alone is not a valid image", () => {
  const signatureOnly = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.throws(() => validateMediaUpload(file("signature.png", "image/png", signatureOnly)), InvalidMediaUploadError);
});

test("unsupported types and active SVG uploads are rejected", () => {
  assert.throws(
    () => validateMediaUpload(file("script.html", "text/html", Buffer.from("<script>"))),
    InvalidMediaUploadError,
  );
  assert.throws(
    () => validateMediaUpload(file("logo.svg", "image/svg+xml", Buffer.from("<svg></svg>"))),
    InvalidMediaUploadError,
  );
});

test("extension and declared MIME mismatches are rejected", () => {
  assert.throws(
    () => validateMediaUpload(file("cover.jpg", "image/png", png)),
    /extension does not match/,
  );
  assert.throws(
    () => validateMediaUpload(file("cover.png", "image/png", jpeg)),
    /structure is invalid|content does not match/,
  );
});

test("empty, inconsistent, and oversize uploads are rejected", () => {
  assert.throws(() => validateMediaUpload(file("empty.png", "image/png", Buffer.alloc(0))), /empty/);
  assert.throws(
    () => validateMediaUpload({ ...file("cover.png", "image/png", png), size: png.length + 1 }),
    /metadata is invalid/,
  );
  assert.throws(
    () => validateMediaUpload(file("large.png", "image/png", Buffer.alloc(MAX_MEDIA_FILE_SIZE + 1))),
    /too large/,
  );
});

test("storage identity is independent from a path-like original filename", () => {
  const result = validateMediaUpload(file("../../cover.png", "image/png", png));
  assert.equal(result.originalName, "cover.png");
});

test("invalid content is rejected before the storage upload function is reached", async () => {
  let uploadCalled = false;
  const service = Object.create(MediaService.prototype) as {
    supabase: { storage: { from: () => { upload: () => Promise<void> } } };
    bucket: string;
  };
  service.bucket = "test-bucket";
  service.supabase = {
    storage: {
      from: () => ({
        upload: async () => {
          uploadCalled = true;
        },
      }),
    },
  };

  await assert.rejects(
    () => MediaService.prototype.store.call(service as never, file("invalid.png", "image/png", Buffer.from("not-an-image"))),
    (error: unknown) => error instanceof BadRequestException && (error.getResponse() as { code?: string }).code === "INVALID_MEDIA_UPLOAD",
  );
  assert.equal(uploadCalled, false);
});
