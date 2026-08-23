import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProjectVisibility } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CreateProjectDto, ProjectBlockDto, ProjectFieldsDto } from "./dto/project.dto";

const MAX_LIMIT = 100;
const MAX_PUBLIC_FEATURED_PROJECTS = 3;

type FeaturedProjectState = {
  featured: boolean;
  visibility: ProjectVisibility;
  status: string;
  deletedAt: Date | null;
  publishedAt: Date | null;
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(limitValue?: string) {
    const parsed = Number.parseInt(limitValue ?? "50", 10);
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), MAX_LIMIT) : 50;
    const where = { deletedAt: null };
    const [projects, total, projectStatuses] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        take: limit,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          industry: true,
          status: true,
          updatedAt: true,
          categories: { select: { category: { select: { name: true } } }, take: 1 },
        },
      }),
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({ where, select: { status: true } }),
    ]);
    const statusCounts = projectStatuses.reduce<Record<string, number>>((counts, project) => {
      counts[project.status] = (counts[project.status] ?? 0) + 1;
      return counts;
    }, {});

    return {
      success: true,
      data: projects.map((project) => ({
        id: project.id,
        title: project.title,
        slug: project.slug,
        type: project.categories[0]?.category.name ?? project.industry ?? "Uncategorized",
        status: project.status,
        updatedAt: project.updatedAt,
      })),
      meta: {
        total,
        limit,
        statusCounts,
      },
    };
  }

  async get(id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: { blocks: { orderBy: { sortOrder: "asc" } }, categories: { include: { category: true } } },
    });
    if (!project) throw this.notFound();
    return { success: true, data: project };
  }

  async create(dto: CreateProjectDto) {
    const slug = await this.availableSlug(dto.slug || dto.title);
    const data = { ...this.toProjectData(dto), title: dto.title.trim(), slug };
    const project = await this.prisma.$transaction(async (transaction) => {
      await this.ensureFeaturedCapacity(transaction, {
        featured: data.featured ?? false,
        visibility: data.visibility ?? ProjectVisibility.PUBLIC,
        status: data.status ?? "DRAFT",
        deletedAt: null,
        publishedAt: null,
      });
      return transaction.project.create({ data });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return { success: true, message: "Project created.", data: project };
  }

  async update(id: string, dto: ProjectFieldsDto) {
    const data = this.toProjectData(dto);
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.slug !== undefined) data.slug = await this.availableSlug(dto.slug, id);
    const project = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.project.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          featured: true,
          visibility: true,
          status: true,
          deletedAt: true,
          publishedAt: true,
        },
      });
      if (!current) throw this.notFound();

      await this.ensureFeaturedCapacity(transaction, {
        featured: data.featured ?? current.featured,
        visibility: data.visibility ?? current.visibility,
        status: data.status ?? current.status,
        deletedAt: current.deletedAt,
        publishedAt: current.publishedAt,
      }, current.id);

      return transaction.project.update({ where: { id }, data });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return { success: true, message: "Project updated.", data: project };
  }

  async replaceBlocks(id: string, blocks: ProjectBlockDto[]) {
    await this.ensureExists(id);
    const updated = await this.prisma.$transaction(async (transaction) => {
      await transaction.projectBlock.deleteMany({ where: { projectId: id } });
      if (blocks.length) {
        await transaction.projectBlock.createMany({
          data: blocks.map((block, index) => ({
            projectId: id,
            type: block.type,
            title: block.title ?? null,
            content: block.content as Prisma.InputJsonValue,
            sortOrder: block.sortOrder ?? index,
            isVisible: block.isVisible ?? true,
            layoutVariant: block.layoutVariant ?? null,
          })),
        });
      }
      return transaction.project.findUnique({
        where: { id },
        include: { blocks: { orderBy: { sortOrder: "asc" } }, categories: { include: { category: true } } },
      });
    });
    return { success: true, message: "Project detail blocks saved.", data: updated };
  }

  async publish(id: string) {
    const publishedAt = new Date();
    const project = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.project.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, featured: true, visibility: true, status: true, deletedAt: true, publishedAt: true },
      });
      if (!current) throw this.notFound();

      await this.ensureFeaturedCapacity(transaction, {
        ...current,
        status: "PUBLISHED",
        publishedAt,
      }, current.id);

      return transaction.project.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt, scheduledAt: null },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return { success: true, message: "Project published.", data: project };
  }

  async unpublish(id: string) {
    await this.ensureExists(id);
    const project = await this.prisma.project.update({ where: { id }, data: { status: "DRAFT", publishedAt: null, scheduledAt: null } });
    return { success: true, message: "Project moved to draft.", data: project };
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true, message: "Project archived.", data: null };
  }

  async restore(id: string) {
    const restored = await this.prisma.$transaction(async (transaction) => {
      const project = await transaction.project.findUnique({ where: { id } });
      if (!project || !project.deletedAt) throw this.notFound();

      await this.ensureFeaturedCapacity(transaction, {
        ...project,
        deletedAt: null,
      }, project.id);

      return transaction.project.update({ where: { id }, data: { deletedAt: null } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return { success: true, message: "Project restored.", data: restored };
  }

  private toProjectData(dto: ProjectFieldsDto): Prisma.ProjectUncheckedCreateInput {
    const data: Prisma.ProjectUncheckedCreateInput = {} as Prisma.ProjectUncheckedCreateInput;
    const fields: Array<keyof ProjectFieldsDto> = ["excerpt", "description", "client", "industry", "year", "role", "duration", "platform", "services", "tools", "featured", "nda", "status", "sortOrder"];
    for (const field of fields) {
      const value = dto[field];
      if (value !== undefined) Object.assign(data, { [field]: value });
    }
    if (dto.visibility !== undefined) data.visibility = dto.visibility as ProjectVisibility;
    return data;
  }

  private async ensureFeaturedCapacity(
    transaction: Prisma.TransactionClient,
    candidate: FeaturedProjectState,
    currentId?: string,
  ) {
    if (!this.isPublicFeatured(candidate)) return;

    const activeFeaturedCount = await transaction.project.count({
      where: {
        featured: true,
        visibility: ProjectVisibility.PUBLIC,
        status: "PUBLISHED",
        deletedAt: null,
        publishedAt: { lte: new Date() },
        ...(currentId ? { id: { not: currentId } } : {}),
      },
    });

    if (activeFeaturedCount >= MAX_PUBLIC_FEATURED_PROJECTS) {
      throw new ConflictException({
        success: false,
        code: "FEATURED_PROJECT_LIMIT",
        message: "A maximum of 3 published public featured projects is allowed.",
      });
    }
  }

  private isPublicFeatured(project: FeaturedProjectState) {
    return project.featured
      && project.visibility === ProjectVisibility.PUBLIC
      && project.status === "PUBLISHED"
      && project.deletedAt === null
      && project.publishedAt !== null
      && project.publishedAt <= new Date();
  }

  private async ensureExists(id: string) {
    const project = await this.prisma.project.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!project) throw this.notFound();
  }

  private async availableSlug(value: string, currentId?: string) {
    const slug = this.slugify(value);
    if (!slug) throw new ConflictException({ success: false, code: "INVALID_SLUG", message: "Project slug is invalid." });
    const existing = await this.prisma.project.findUnique({ where: { slug }, select: { id: true } });
    if (existing && existing.id !== currentId) throw new ConflictException({ success: false, code: "SLUG_EXISTS", message: "Project slug already exists." });
    return slug;
  }

  private slugify(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  private notFound() {
    return new NotFoundException({ success: false, code: "NOT_FOUND", message: "Project was not found." });
  }
}
