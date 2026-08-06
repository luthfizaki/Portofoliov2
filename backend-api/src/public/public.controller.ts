import { Controller, Get, Param, Query } from "@nestjs/common";
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
