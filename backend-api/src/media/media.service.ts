import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { MediaType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PrismaService } from "../database/prisma.service";

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class MediaService {
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor(private readonly prisma: PrismaService) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "portfolio-media";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.",
      );
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.bucket = bucket;
  }

  async store(file: UploadedFile) {
    const extension =
      extname(file.originalname).toLowerCase() ||
      this.extensionFromMime(file.mimetype);

    const filename = `id_${randomUUID().replaceAll("-", "").slice(0, 12)}${extension}`;

    const storageKey = `uploads/${filename}`;

    const { error: uploadError } = await this.supabase.storage
      .from(this.bucket)
      .upload(storageKey, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new InternalServerErrorException(
        `Failed to upload file to storage: ${uploadError.message}`,
      );
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(storageKey);

    try {
      const asset = await this.prisma.mediaAsset.create({
        data: {
          type: this.mediaType(file.mimetype),
          filename,
          originalName: file.originalname,
          url: publicUrl,
          storageKey: `${this.bucket}/${storageKey}`,
          mimeType: file.mimetype,
          size: file.size,
        },
      });

      return {
        success: true,
        message: "File uploaded.",
        data: asset,
      };
    } catch (error) {
      // If database creation fails after storage upload,
      // remove the uploaded file to avoid orphaned storage files.
      await this.supabase.storage
        .from(this.bucket)
        .remove([storageKey]);

      throw error;
    }
  }

  private mediaType(mimeType: string) {
    if (mimeType.startsWith("image/")) return MediaType.IMAGE;
    if (mimeType.startsWith("video/")) return MediaType.VIDEO;

    if (
      mimeType === "application/pdf" ||
      mimeType.includes("document")
    ) {
      return MediaType.DOCUMENT;
    }

    return MediaType.OTHER;
  }

  private extensionFromMime(mimeType: string) {
    if (mimeType === "image/webp") return ".webp";
    if (mimeType === "image/png") return ".png";
    if (mimeType === "image/jpeg") return ".jpg";
    if (mimeType === "image/svg+xml") return ".svg";
    if (mimeType === "video/mp4") return ".mp4";
    if (mimeType === "application/pdf") return ".pdf";

    return "";
  }
}
