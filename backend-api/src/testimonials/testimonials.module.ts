import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../database/prisma.module";
import { TestimonialsController } from "./testimonials.controller";
import { TestimonialsService } from "./testimonials.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TestimonialsController],
  providers: [TestimonialsService],
  exports: [TestimonialsService],
})
export class TestimonialsModule {}
