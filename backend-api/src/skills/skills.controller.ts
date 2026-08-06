import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { CreateSkillDto, SkillFieldsDto } from "./dto/skill.dto";
import { SkillsService } from "./skills.service";

@Controller("admin/skills")
@UseGuards(SessionGuard)
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  list() {
    return this.skills.list();
  }

  @Post()
  create(@Body() dto: CreateSkillDto) {
    return this.skills.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: SkillFieldsDto) {
    return this.skills.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.skills.remove(id);
  }
}
