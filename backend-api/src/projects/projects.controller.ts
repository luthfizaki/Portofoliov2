import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionGuard } from "../auth/session.guard";
import { CmsPreviewReadOnlyInterceptor } from "../security/cms-preview-read-only.interceptor";
import { CreateProjectDto, ProjectFieldsDto, ReplaceProjectBlocksDto } from "./dto/project.dto";
import { ProjectsService } from "./projects.service";

@Controller("admin/projects")
@UseGuards(SessionGuard, RolesGuard, CmsPreviewReadOnlyInterceptor)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  list(@Query("limit") limit?: string) {
    return this.projects.list(limit);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }

  @Get("archived")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  listArchived(@Query("limit") limit?: string) {
    return this.projects.listArchived(limit);
  }

  @Get(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  get(@Param("id") id: string) {
    return this.projects.get(id);
  }

  @Patch(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  update(@Param("id") id: string, @Body() dto: ProjectFieldsDto) {
    return this.projects.update(id, dto);
  }

  @Patch(":id/blocks")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  replaceBlocks(@Param("id") id: string, @Body() dto: ReplaceProjectBlocksDto) {
    return this.projects.replaceBlocks(id, dto.blocks);
  }

  @Post(":id/publish")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  publish(@Param("id") id: string) {
    return this.projects.publish(id);
  }

  @Post(":id/unpublish")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  unpublish(@Param("id") id: string) {
    return this.projects.unpublish(id);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  remove(@Param("id") id: string) {
    return this.projects.remove(id);
  }

  @Post(":id/restore")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  restore(@Param("id") id: string) {
    return this.projects.restore(id);
  }
}
