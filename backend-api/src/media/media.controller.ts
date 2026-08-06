import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SessionGuard } from "../auth/session.guard";
import { MediaService } from "./media.service";

type UploadedMediaFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Controller("admin/media")
@UseGuards(SessionGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }))
  upload(@UploadedFile() file: UploadedMediaFile) {
    return this.media.store(file);
  }
}
