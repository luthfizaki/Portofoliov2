import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionGuard } from "../auth/session.guard";
import { UpdateSeoMetadataDto } from "./dto/update-seo-metadata.dto";
import { SeoService } from "./seo.service";

@Controller("admin/seo")
@UseGuards(SessionGuard, RolesGuard)
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  list(@Query("q") query?: string) {
    return this.seo.list(query);
  }

  @Patch(":entityType/:id")
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  update(@Param("entityType") entityType: string, @Param("id") id: string, @Body() dto: UpdateSeoMetadataDto) {
    return this.seo.update(entityType, id, dto);
  }
}
