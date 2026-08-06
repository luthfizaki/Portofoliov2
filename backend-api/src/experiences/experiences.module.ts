import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../database/prisma.module";
import { ExperiencesController } from "./experiences.controller";
import { ExperiencesService } from "./experiences.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ExperiencesController],
  providers: [ExperiencesService],
  exports: [ExperiencesService],
})
export class ExperiencesModule {}
