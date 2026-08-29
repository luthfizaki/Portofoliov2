import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const pages = await this.prisma.page.findMany({ where: { deletedAt: null }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, slug: true, status: true, isHomepage: true, updatedAt: true } });
    return { success: true, data: pages };
  }

  async get(id: string) {
    const page = await this.prisma.page.findFirst({ where: { id, deletedAt: null }, include: { sections: { orderBy: { sortOrder: "asc" } } } });
    if (!page) throw this.notFound();
    return { success: true, data: page };
  }

  async updateSection(id: string, content: Record<string, unknown>) {
    const section = await this.prisma.pageSection.findUnique({ where: { id }, select: { id: true, type: true, content: true } });
    if (!section) throw this.notFound("Section was not found.");
    const protectedKey = protectedLegacyEntityArrayKey(section.type);
    let nextContent = content;

    if (protectedKey) {
      const existingContent = isJsonObject(section.content) ? section.content : {};
      const hasIncomingValue = Object.prototype.hasOwnProperty.call(content, protectedKey);
      const hasExistingValue = Object.prototype.hasOwnProperty.call(existingContent, protectedKey);

      if (hasIncomingValue && !jsonEqual(content[protectedKey], existingContent[protectedKey])) {
        throw new BadRequestException({
          success: false,
          code: "PROTECTED_LEGACY_FIELD",
          message: `${section.type}.${protectedKey} is managed by its canonical API and cannot be modified through Pages.`,
        });
      }

      if (!hasIncomingValue && hasExistingValue) {
        nextContent = { ...content, [protectedKey]: existingContent[protectedKey] };
      }
    }

    const updated = await this.prisma.pageSection.update({ where: { id }, data: { content: nextContent as Prisma.InputJsonValue } });
    return { success: true, message: "Page section updated.", data: updated };
  }

  async updateSectionVisibility(id: string, isVisible: boolean) {
    const section = await this.prisma.pageSection.findUnique({ where: { id }, select: { id: true } });
    if (!section) throw this.notFound("Section was not found.");
    const updated = await this.prisma.pageSection.update({ where: { id }, data: { isVisible } });
    return { success: true, message: `Page section ${isVisible ? "shown" : "hidden"}.`, data: updated };
  }

  async publish(id: string) {
    const page = await this.prisma.page.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!page) throw this.notFound();
    const published = await this.prisma.page.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: new Date(), scheduledAt: null } });
    return { success: true, message: "Page published.", data: published };
  }

  private notFound(message = "Page was not found.") {
    return new NotFoundException({ success: false, code: "NOT_FOUND", message });
  }
}

const protectedLegacyEntityArrayKey = (sectionType: string) => ({
  experience: "rows",
  "flagship-products": "projects",
  "project-archive": "projects",
  "collaboration-testimonials": "testimonials",
}[normalizeSectionType(sectionType)]);

function normalizeSectionType(sectionType: string) {
  const normalized = sectionType.trim().toLowerCase().replaceAll("_", "-");
  return normalized === "testimonials" ? "collaboration-testimonials" : normalized;
}

function isJsonObject(value: Prisma.JsonValue | null): value is Prisma.JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function jsonEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((item, index) => jsonEqual(item, right[index]));
  }
  if (left && right && typeof left === "object" && typeof right === "object") {
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const leftKeys = Object.keys(leftRecord);
    const rightKeys = Object.keys(rightRecord);
    return leftKeys.length === rightKeys.length
      && leftKeys.every((key) => Object.prototype.hasOwnProperty.call(rightRecord, key) && jsonEqual(leftRecord[key], rightRecord[key]));
  }
  return false;
}
