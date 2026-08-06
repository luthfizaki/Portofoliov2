import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { ExperiencesService } from "../experiences/experiences.service";
import { SkillsService } from "../skills/skills.service";
import { TestimonialsService } from "../testimonials/testimonials.service";

const MAX_LIMIT = 50;

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly experiencesService: ExperiencesService,
    private readonly skillsService: SkillsService,
    private readonly testimonialsService: TestimonialsService,
  ) {}

  async page(slug: string) {
    const page = await this.prisma.page.findFirst({
      where: { slug, status: "PUBLISHED", deletedAt: null, publishedAt: { lte: new Date() } },
      include: { sections: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
    });
    if (!page) throw new NotFoundException({ success: false, code: "NOT_FOUND", message: "Page was not found." });
    return {
      success: true,
      data: {
        name: page.name,
        slug: page.slug,
        sections: page.sections.map((section) => ({ type: section.type, content: section.content })),
      },
    };
  }

  async projects(pageValue?: string, limitValue?: string, featuredValue?: string) {
    const page = this.positiveInteger(pageValue, 1);
    const limit = Math.min(this.positiveInteger(limitValue, 12), MAX_LIMIT);
    const where: Prisma.ProjectWhereInput = {
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { lte: new Date() },
      ...(featuredValue === "true" ? { featured: true } : {}),
    };
    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { publishedAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: { coverMedia: { select: { url: true, altText: true } }, categories: { include: { category: true } } },
      }),
      this.prisma.project.count({ where }),
    ]);
    return {
      success: true,
      data: projects.map((project) => this.toPublicProject(project)),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async project(slug: string) {
    const project = await this.prisma.project.findFirst({
      where: { slug, status: "PUBLISHED", deletedAt: null, publishedAt: { lte: new Date() } },
      include: {
        coverMedia: { select: { url: true, altText: true } },
        categories: { include: { category: true } },
        blocks: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!project) throw new NotFoundException({ success: false, code: "NOT_FOUND", message: "Project was not found." });
    return { success: true, data: { ...this.toPublicProject(project), blocks: project.blocks } };
  }

  async experiences() {
    return this.experiencesService.publicContent();
  }

  async skills() {
    return this.skillsService.publicContent();
  }

  async testimonials() {
    return this.testimonialsService.publicContent();
  }

  private toPublicProject(project: {
    id: string; title: string; slug: string; excerpt: string | null; client: string | null; industry: string | null; year: number | null; role: string | null; duration: string | null; platform: string | null; services: string[]; tools: string[]; featured: boolean; coverMedia: { url: string; altText: string | null } | null; categories: Array<{ category: { name: string } }>;
  }) {
    return {
      id: project.id, title: project.title, slug: project.slug, excerpt: project.excerpt,
      client: project.client, industry: project.industry, year: project.year, role: project.role,
      duration: project.duration, platform: project.platform, services: project.services, tools: project.tools,
      featured: project.featured, coverUrl: project.coverMedia?.url ?? null, coverAlt: project.coverMedia?.altText ?? null,
      categories: project.categories.map((item) => item.category.name),
    };
  }

  private positiveInteger(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
