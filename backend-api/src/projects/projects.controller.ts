import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { CreateProjectDto, ProjectFieldsDto, ReplaceProjectBlocksDto } from "./dto/project.dto";
import { ProjectsService } from "./projects.service";

@Controller("admin/projects")
@UseGuards(SessionGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@Query("limit") limit?: string) {
    return this.projects.list(limit);
  }

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.projects.get(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: ProjectFieldsDto) {
    return this.projects.update(id, dto);
  }

  @Patch(":id/blocks")
  replaceBlocks(@Param("id") id: string, @Body() dto: ReplaceProjectBlocksDto) {
    return this.projects.replaceBlocks(id, dto.blocks);
  }

  @Post(":id/publish")
  publish(@Param("id") id: string) {
    return this.projects.publish(id);
  }

  @Post(":id/unpublish")
  unpublish(@Param("id") id: string) {
    return this.projects.unpublish(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.projects.remove(id);
  }

  @Post(":id/restore")
  restore(@Param("id") id: string) {
    return this.projects.restore(id);
  }
}
