import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { ExperiencesService } from "../experiences/experiences.service";
import { SkillsService } from "../skills/skills.service";
import { TestimonialsService } from "../testimonials/testimonials.service";

const MAX_LIMIT = 50;
const MAX_FEATURED_PROJECTS = 3;

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
    const requestedLimit = Math.min(this.positiveInteger(limitValue, 12), MAX_LIMIT);
    const isFeaturedQuery = featuredValue === "true";
    const isArchiveQuery = featuredValue === "false";
    const limit = isFeaturedQuery
      ? Math.min(requestedLimit, MAX_FEATURED_PROJECTS)
      : requestedLimit;
    const where: Prisma.ProjectWhereInput = {
      visibility: "PUBLIC",
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { lte: new Date() },
      ...(isFeaturedQuery ? { featured: true } : {}),
      ...(isArchiveQuery ? { featured: false } : {}),
    };
    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { publishedAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          coverMedia: { select: { url: true, altText: true } },
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
          metrics: { orderBy: { sortOrder: "asc" } },
          blocks: {
            where: { isVisible: true, type: { in: ["flagship", "archive", "HERO"] } },
            orderBy: { sortOrder: "asc" },
            select: { type: true, title: true, content: true, sortOrder: true, layoutVariant: true },
          },
        },
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
      where: { slug, visibility: "PUBLIC", status: "PUBLISHED", deletedAt: null, publishedAt: { lte: new Date() } },
      include: {
        coverMedia: { select: { url: true, altText: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        metrics: { orderBy: { sortOrder: "asc" } },
        blocks: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!project) throw new NotFoundException({ success: false, code: "NOT_FOUND", message: "Project was not found." });
    return { success: true, data: this.toPublicProject(project) };
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
    id: string; title: string; slug: string; excerpt: string | null; description: string | null; client: string | null; industry: string | null; year: number | null; role: string | null; duration: string | null; platform: string | null; services: string[]; tools: string[]; featured: boolean; sortOrder: number; coverMedia: { url: string; altText: string | null } | null; categories: Array<{ category: { name: string; slug: string } }>; tags?: Array<{ tag: { name: string; slug: string } }>; metrics?: Array<{ value: string; label: string; note: string | null; sortOrder: number }>; blocks?: Array<{ type: string; title: string | null; content: Prisma.JsonValue; sortOrder: number; layoutVariant: string | null }>;
  }) {
    return {
      id: project.id, title: project.title, slug: project.slug, excerpt: project.excerpt, description: project.description,
      client: project.client, industry: project.industry, year: project.year, role: project.role,
      duration: project.duration, platform: project.platform, services: project.services, tools: project.tools,
      featured: project.featured, sortOrder: project.sortOrder, coverUrl: project.coverMedia?.url ?? null, coverAlt: project.coverMedia?.altText ?? null,
      categories: project.categories.map((item) => ({ name: item.category.name, slug: item.category.slug })),
      tags: project.tags?.map((item) => ({ name: item.tag.name, slug: item.tag.slug })) ?? [],
      metrics: project.metrics?.map((metric) => ({ value: metric.value, label: metric.label, note: metric.note, sortOrder: metric.sortOrder })) ?? [],
      blocks: project.blocks?.map((block) => ({ type: block.type, title: block.title, content: block.content, sortOrder: block.sortOrder, layoutVariant: block.layoutVariant })) ?? [],
    };
  }

  private positiveInteger(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
