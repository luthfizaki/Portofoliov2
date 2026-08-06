import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { CreateExperienceDto, ExperienceFieldsDto } from "./dto/experience.dto";
import { ExperiencesService } from "./experiences.service";

@Controller("admin/experiences")
@UseGuards(SessionGuard)
export class ExperiencesController {
  constructor(private readonly experiences: ExperiencesService) {}

  @Get()
  list() {
    return this.experiences.list();
  }

  @Post()
  create(@Body() dto: CreateExperienceDto) {
    return this.experiences.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: ExperienceFieldsDto) {
    return this.experiences.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.experiences.remove(id);
  }
}
