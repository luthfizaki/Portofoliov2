import { Injectable } from "@nestjs/common";
import { MediaType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { PrismaService } from "../database/prisma.service";

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async store(file: UploadedFile) {
    const extension = extname(file.originalname).toLowerCase() || this.extensionFromMime(file.mimetype);
    const filename = `id_${randomUUID().replaceAll("-", "").slice(0, 12)}${extension}`;
    const uploadsPath = join(process.cwd(), "..", "public", "uploads");
    await mkdir(uploadsPath, { recursive: true });
    await writeFile(join(uploadsPath, filename), file.buffer);

    const url = `/uploads/${filename}`;
    const asset = await this.prisma.mediaAsset.create({
      data: {
        type: this.mediaType(file.mimetype),
        filename,
        originalName: file.originalname,
        url,
        storageKey: `public/uploads/${filename}`,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    return { success: true, message: "File uploaded.", data: asset };
  }

  private mediaType(mimeType: string) {
    if (mimeType.startsWith("image/")) return MediaType.IMAGE;
    if (mimeType.startsWith("video/")) return MediaType.VIDEO;
    if (mimeType === "application/pdf" || mimeType.includes("document")) return MediaType.DOCUMENT;
    return MediaType.OTHER;
  }

  private extensionFromMime(mimeType: string) {
    if (mimeType === "image/webp") return ".webp";
    if (mimeType === "image/png") return ".png";
    if (mimeType === "image/jpeg") return ".jpg";
    if (mimeType === "image/svg+xml") return ".svg";
    if (mimeType === "application/pdf") return ".pdf";
    return "";
  }
}
