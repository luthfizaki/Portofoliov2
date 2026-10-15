import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { assertCmsContentWritesAllowed } from "../security/cms-write-guard";
import { UpdateSeoMetadataDto } from "./dto/update-seo-metadata.dto";

type SeoEntityType = "page" | "project";
type SeoValues = {
  title: string | null;
  description: string | null;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  noIndex: boolean;
  noFollow: boolean;
};

@Injectable()
export class SeoService {
  constructor(private readonly prisma: PrismaService) {}

  async list(queryValue?: string) {
    const query = queryValue?.trim().slice(0, 120);
    const pageWhere: Prisma.PageWhereInput = {
      deletedAt: null,
      ...(query ? { OR: [
        { name: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
      ] } : {}),
    };
    const projectWhere: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(query ? { OR: [
        { title: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
      ] } : {}),
    };
    const [pages, projects] = await Promise.all([
      this.prisma.page.findMany({
        where: pageWhere,
        orderBy: { updatedAt: "desc" },
        take: 100,
        select: { id: true, name: true, slug: true, status: true, updatedAt: true, seo: true },
      }),
      this.prisma.project.findMany({
        where: projectWhere,
        orderBy: { updatedAt: "desc" },
        take: 100,
        select: { id: true, title: true, slug: true, status: true, visibility: true, updatedAt: true, seo: true },
      }),
    ]);

    const data = [
      ...pages.map((page) => ({
        entityType: "page" as const,
        id: page.id,
        name: page.name,
        slug: page.slug,
        status: page.status,
        updatedAt: page.updatedAt,
        seo: this.serialize(page.seo),
      })),
      ...projects.map((project) => ({
        entityType: "project" as const,
        id: project.id,
        name: project.title,
        slug: project.slug,
        status: project.status,
        visibility: project.visibility,
        updatedAt: project.updatedAt,
        seo: this.serialize(project.seo),
      })),
    ].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());

    return {
      success: true,
      data,
      meta: { total: data.length, pages: pages.length, projects: projects.length },
    };
  }

  async update(entityTypeValue: string, id: string, dto: UpdateSeoMetadataDto) {
    assertCmsContentWritesAllowed();
    if (entityTypeValue !== "page" && entityTypeValue !== "project") {
      throw new BadRequestException({
        success: false,
        code: "INVALID_SEO_ENTITY",
        message: "SEO metadata can only be attached to a page or project.",
      });
    }
    const entityType = entityTypeValue as SeoEntityType;
    if (!Object.values(dto).some((value) => value !== undefined)) {
      throw new BadRequestException({
        success: false,
        code: "EMPTY_SEO_UPDATE",
        message: "At least one SEO field must be supplied.",
      });
    }

    const values: {
      title?: string | null;
      description?: string | null;
      canonical?: string | null;
      ogTitle?: string | null;
      ogDescription?: string | null;
      ogImageUrl?: string | null;
      noIndex?: boolean;
      noFollow?: boolean;
    } = {};
    if (dto.title !== undefined) values.title = this.normalizeText(dto.title, "title", 70);
    if (dto.description !== undefined) values.description = this.normalizeText(dto.description, "description", 320);
    if (dto.canonical !== undefined) values.canonical = this.normalizeUrl(dto.canonical, "canonical");
    if (dto.ogTitle !== undefined) values.ogTitle = this.normalizeText(dto.ogTitle, "ogTitle", 70);
    if (dto.ogDescription !== undefined) values.ogDescription = this.normalizeText(dto.ogDescription, "ogDescription", 320);
    if (dto.ogImageUrl !== undefined) values.ogImageUrl = this.normalizeUrl(dto.ogImageUrl, "ogImageUrl");
    if (dto.noIndex !== undefined) values.noIndex = dto.noIndex;
    if (dto.noFollow !== undefined) values.noFollow = dto.noFollow;

    let saved;
    if (entityType === "page") {
      const parent = await this.prisma.page.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
      if (!parent) throw this.notFound();
      saved = await this.prisma.seoMetadata.upsert({
        where: { pageId: id },
        create: { pageId: id, ...values },
        update: values,
      });
    } else {
      const parent = await this.prisma.project.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
      if (!parent) throw this.notFound();
      saved = await this.prisma.seoMetadata.upsert({
        where: { projectId: id },
        create: { projectId: id, ...values },
        update: values,
      });
    }

    return { success: true, message: "SEO metadata saved.", data: { entityType, id, seo: this.serialize(saved) } };
  }

  private serialize(record: SeoValues | null | undefined): SeoValues | null {
    if (!record) return null;
    return {
      title: record.title,
      description: record.description,
      canonical: record.canonical,
      ogTitle: record.ogTitle,
      ogDescription: record.ogDescription,
      ogImageUrl: record.ogImageUrl,
      noIndex: record.noIndex,
      noFollow: record.noFollow,
    };
  }

  private normalizeText(value: string | null, field: string, maxLength: number): string | null {
    if (value === null) return null;
    const normalized = value.trim();
    if (!normalized) return null;
    if (normalized.length > maxLength) {
      throw new BadRequestException({ success: false, code: "SEO_FIELD_TOO_LONG", message: field + " exceeds the allowed length." });
    }
    return normalized;
  }

  private normalizeUrl(value: string | null, field: string): string | null {
    const normalized = this.normalizeText(value, field, 2048);
    if (normalized === null) return null;
    if (normalized === undefined) return null;
    try {
      const parsed = new URL(normalized);
      if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || !parsed.hostname) throw new Error("Unsupported URL protocol.");
      return parsed.toString();
    } catch {
      throw new BadRequestException({
        success: false,
        code: "INVALID_SEO_URL",
        message: field + " must be an absolute HTTP or HTTPS URL, or left blank.",
      });
    }
  }

  private notFound() {
    return new NotFoundException({
      success: false,
      code: "SEO_ENTITY_NOT_FOUND",
      message: "The page or project was not found.",
    });
  }
}
