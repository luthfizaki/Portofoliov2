import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ProjectAccessDto } from "./project-access.dto";
import { PublicService } from "./public.service";

@Controller("public")
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get("pages/:slug")
  page(@Param("slug") slug: string) {
    return this.publicService.page(slug);
  }

  @Get("projects")
  projects(@Query("page") page?: string, @Query("limit") limit?: string, @Query("featured") featured?: string) {
    return this.publicService.projects(page, limit, featured);
  }

  @Get("projects/:slug")
  project(@Param("slug") slug: string) {
    return this.publicService.project(slug);
  }

  @Post("projects/:slug/access")
  accessProtectedProject(@Param("slug") slug: string, @Body() dto: ProjectAccessDto) {
    return this.publicService.accessProtectedProject(slug, dto.password);
  }

  @Get("experiences")
  experiences() {
    return this.publicService.experiences();
  }

  @Get("skills")
  skills() {
    return this.publicService.skills();
  }

  @Get("testimonials")
  testimonials() {
    return this.publicService.testimonials();
  }
}
