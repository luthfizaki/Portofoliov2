import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionGuard } from "../auth/session.guard";
import { CmsPreviewReadOnlyInterceptor } from "../security/cms-preview-read-only.interceptor";
import { CreateTestimonialDto, TestimonialFieldsDto } from "./dto/testimonial.dto";
import { TestimonialsService } from "./testimonials.service";

@Controller("admin/testimonials")
@UseGuards(SessionGuard, RolesGuard, CmsPreviewReadOnlyInterceptor)
export class TestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  list() {
    return this.testimonials.list();
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  create(@Body() dto: CreateTestimonialDto) {
    return this.testimonials.create(dto);
  }

  @Patch(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  update(@Param("id") id: string, @Body() dto: TestimonialFieldsDto) {
    return this.testimonials.update(id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  remove(@Param("id") id: string) {
    return this.testimonials.remove(id);
  }
}
