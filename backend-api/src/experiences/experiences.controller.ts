import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionGuard } from "../auth/session.guard";
import { CmsPreviewReadOnlyInterceptor } from "../security/cms-preview-read-only.interceptor";
import { CreateExperienceDto, ExperienceFieldsDto } from "./dto/experience.dto";
import { ExperiencesService } from "./experiences.service";

@Controller("admin/experiences")
@UseGuards(SessionGuard, RolesGuard, CmsPreviewReadOnlyInterceptor)
export class ExperiencesController {
  constructor(private readonly experiences: ExperiencesService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  list() {
    return this.experiences.list();
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  create(@Body() dto: CreateExperienceDto) {
    return this.experiences.create(dto);
  }

  @Patch(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  update(@Param("id") id: string, @Body() dto: ExperienceFieldsDto) {
    return this.experiences.update(id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  remove(@Param("id") id: string) {
    return this.experiences.remove(id);
  }
}
