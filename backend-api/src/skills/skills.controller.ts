import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionGuard } from "../auth/session.guard";
import { CmsPreviewReadOnlyInterceptor } from "../security/cms-preview-read-only.interceptor";
import { CreateSkillDto, SkillFieldsDto } from "./dto/skill.dto";
import { SkillsService } from "./skills.service";

@Controller("admin/skills")
@UseGuards(SessionGuard, RolesGuard, CmsPreviewReadOnlyInterceptor)
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  list() {
    return this.skills.list();
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  create(@Body() dto: CreateSkillDto) {
    return this.skills.create(dto);
  }

  @Patch(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  update(@Param("id") id: string, @Body() dto: SkillFieldsDto) {
    return this.skills.update(id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  remove(@Param("id") id: string) {
    return this.skills.remove(id);
  }
}
