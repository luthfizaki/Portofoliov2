import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { UpdatePageSectionDto, UpdatePageSectionVisibilityDto } from "./dto/update-page-section.dto";
import { PagesService } from "./pages.service";

@Controller("admin/pages")
@UseGuards(SessionGuard)
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  @Get()
  list() { return this.pages.list(); }

  @Get(":id")
  get(@Param("id") id: string) { return this.pages.get(id); }

  @Patch("sections/:sectionId")
  updateSection(@Param("sectionId") sectionId: string, @Body() dto: UpdatePageSectionDto) { return this.pages.updateSection(sectionId, dto.content); }

  @Patch("sections/:sectionId/visibility")
  updateSectionVisibility(@Param("sectionId") sectionId: string, @Body() dto: UpdatePageSectionVisibilityDto) { return this.pages.updateSectionVisibility(sectionId, dto.isVisible); }

  @Post(":id/publish")
  publish(@Param("id") id: string) { return this.pages.publish(id); }
}
