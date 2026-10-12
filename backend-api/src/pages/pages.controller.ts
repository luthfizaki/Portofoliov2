import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionGuard } from "../auth/session.guard";
import { UpdatePageSectionDto, UpdatePageSectionVisibilityDto } from "./dto/update-page-section.dto";
import { PagesService } from "./pages.service";

@Controller("admin/pages")
@UseGuards(SessionGuard, RolesGuard)
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  list() { return this.pages.list(); }

  @Get(":id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  get(@Param("id") id: string) { return this.pages.get(id); }

  @Patch("sections/:sectionId")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  updateSection(@Param("sectionId") sectionId: string, @Body() dto: UpdatePageSectionDto) { return this.pages.updateSection(sectionId, dto.content); }

  @Patch("sections/:sectionId/visibility")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  updateSectionVisibility(@Param("sectionId") sectionId: string, @Body() dto: UpdatePageSectionVisibilityDto) { return this.pages.updateSectionVisibility(sectionId, dto.isVisible); }

  @Post(":id/publish")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  publish(@Param("id") id: string) { return this.pages.publish(id); }
}
