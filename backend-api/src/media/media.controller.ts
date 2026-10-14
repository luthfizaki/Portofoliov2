import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionGuard } from "../auth/session.guard";
import { isSupportedMediaMimeType, MAX_MEDIA_FILE_SIZE, type UploadedMediaFile } from "./media-validation";
import { MediaService } from "./media.service";

@Controller("admin/media")
@UseGuards(SessionGuard, RolesGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

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
