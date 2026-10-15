import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../database/prisma.module";
import { SeoController } from "./seo.controller";
import { SeoService } from "./seo.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SeoController],
  providers: [SeoService],
})
export class SeoModule {}
