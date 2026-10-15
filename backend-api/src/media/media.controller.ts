import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionGuard } from "../auth/session.guard";
import { CmsPreviewReadOnlyInterceptor } from "../security/cms-preview-read-only.interceptor";
import { isSupportedMediaMimeType, MAX_MEDIA_FILE_SIZE, type UploadedMediaFile } from "./media-validation";
import { MediaService } from "./media.service";
import { UpdateMediaMetadataDto } from "./dto/update-media-metadata.dto";

@Controller("admin/media")
@UseGuards(SessionGuard, RolesGuard, CmsPreviewReadOnlyInterceptor)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  list(@Query("page") page?: string, @Query("limit") limit?: string, @Query("type") type?: string, @Query("q") q?: string) {
    return this.media.list({ page, limit, type, q });
  }

  @Patch(":id/metadata")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  updateMetadata(@Param("id") id: string, @Body() dto: UpdateMediaMetadataDto) {
    return this.media.updateMetadata(id, dto);
  }

  @Post("upload")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  @UseInterceptors(FileInterceptor("file", {
    limits: { fileSize: MAX_MEDIA_FILE_SIZE },
    fileFilter: (_request, file, callback) => {
      if (isSupportedMediaMimeType(file.mimetype)) {
        callback(null, true);
        return;
      }
      callback(new BadRequestException({
        success: false,
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "This file type is not supported.",
      }), false);
    },
  }))
  upload(@UploadedFile() file: UploadedMediaFile | undefined) {
    if (!file) {
      throw new BadRequestException({
        success: false,
        code: "MEDIA_FILE_REQUIRED",
        message: "A file is required.",
      });
    }
    return this.media.store(file);
  }
}
