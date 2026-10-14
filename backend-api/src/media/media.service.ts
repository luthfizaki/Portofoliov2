import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { MediaType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PrismaService } from "../database/prisma.service";
import { InvalidMediaUploadError, type UploadedMediaFile, validateMediaUpload } from "./media-validation";

class DisabledRealtimeTransport {
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;
  readonly readyState = this.CLOSED;
  readonly url = "";
  readonly protocol = "";
  onopen: ((this: unknown, ev: Event) => unknown) | null = null;
  onmessage: ((this: unknown, ev: MessageEvent) => unknown) | null = null;
  onclose: ((this: unknown, ev: CloseEvent) => unknown) | null = null;
  onerror: ((this: unknown, ev: Event) => unknown) | null = null;

  constructor() {
    throw new Error("Realtime is disabled for MediaService.");
  }

  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
}

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
      realtime: {
        transport: DisabledRealtimeTransport,
      },
    });

    this.bucket = bucket;
  }

  async store(file: UploadedMediaFile) {
    let validated: ReturnType<typeof validateMediaUpload>;
    try {
      validated = validateMediaUpload(file);
    } catch (error) {
      if (error instanceof InvalidMediaUploadError) {
        throw new BadRequestException({
          success: false,
          code: "INVALID_MEDIA_UPLOAD",
          message: error.message,
        });
      }
      throw error;
    }

    const filename = `id_${randomUUID().replaceAll("-", "").slice(0, 12)}${validated.extension}`;

    const storageKey = `uploads/${filename}`;

    const { error: uploadError } = await this.supabase.storage
      .from(this.bucket)
      .upload(storageKey, file.buffer, {
        contentType: validated.mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new InternalServerErrorException("Failed to upload file to storage.");
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(storageKey);

    try {
      const asset = await this.prisma.mediaAsset.create({
        data: {
          type: this.mediaType(validated.mimeType),
          filename,
          originalName: validated.originalName,
          url: publicUrl,
          storageKey: `${this.bucket}/${storageKey}`,
          mimeType: validated.mimeType,
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

}
