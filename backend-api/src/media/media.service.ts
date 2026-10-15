import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { MediaType, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PrismaService } from "../database/prisma.service";
import { InvalidMediaUploadError, type UploadedMediaFile, validateMediaUpload } from "./media-validation";
import { assertCmsContentWritesAllowed } from "../security/cms-write-guard";
import { UpdateMediaMetadataDto } from "./dto/update-media-metadata.dto";

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
    assertCmsContentWritesAllowed();
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


  async list(query: { page?: string; limit?: string; type?: string; q?: string }) {
    const page = this.positiveInteger(query.page, 1);
    const limit = Math.min(this.positiveInteger(query.limit, 24), 100);
    const requestedType = query.type?.trim().toUpperCase();
    if (requestedType && !Object.values(MediaType).includes(requestedType as MediaType)) {
      throw new BadRequestException({ success: false, code: "INVALID_MEDIA_TYPE", message: "The requested media type is not supported." });
    }
    const search = query.q?.trim().slice(0, 120);
    const where: Prisma.MediaAssetWhereInput = {
      deletedAt: null,
      ...(requestedType ? { type: requestedType as MediaType } : {}),
      ...(search ? { OR: [
        { originalName: { contains: search, mode: "insensitive" } },
        { filename: { contains: search, mode: "insensitive" } },
        { altText: { contains: search, mode: "insensitive" } },
        { caption: { contains: search, mode: "insensitive" } },
      ] } : {}),
    };
    const select = {
      id: true, type: true, filename: true, originalName: true, url: true, mimeType: true,
      size: true, width: true, height: true, duration: true, altText: true, caption: true,
      createdAt: true, updatedAt: true,
    } as const;
    const [items, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" }, select }),
      this.prisma.mediaAsset.count({ where }),
    ]);
    return { success: true, data: items, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  }

  async updateMetadata(id: string, dto: UpdateMediaMetadataDto) {
    assertCmsContentWritesAllowed();
    if (dto.altText === undefined && dto.caption === undefined) {
      throw new BadRequestException({ success: false, code: "EMPTY_MEDIA_UPDATE", message: "At least one metadata field must be supplied." });
    }
    const existing = await this.prisma.mediaAsset.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException({ success: false, code: "MEDIA_NOT_FOUND", message: "Media asset was not found." });
    }
    const data: Prisma.MediaAssetUpdateInput = {};
    if (dto.altText !== undefined) data.altText = this.normalizeMetadataText(dto.altText);
    if (dto.caption !== undefined) data.caption = this.normalizeMetadataText(dto.caption);
    const asset = await this.prisma.mediaAsset.update({
      where: { id },
      data,
      select: {
        id: true, type: true, filename: true, originalName: true, url: true, mimeType: true,
        size: true, width: true, height: true, duration: true, altText: true, caption: true,
        createdAt: true, updatedAt: true,
      },
    });
    return { success: true, message: "Media metadata saved.", data: asset };
  }

  private normalizeMetadataText(value: string | null) {
    if (value === null) return null;
    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }

  private positiveInteger(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100000) : fallback;
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
