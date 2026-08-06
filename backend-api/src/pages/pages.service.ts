import { Injectable, NotFoundException } from "@nestjs/common";
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
    const section = await this.prisma.pageSection.findUnique({ where: { id }, select: { id: true } });
    if (!section) throw this.notFound("Section was not found.");
    const updated = await this.prisma.pageSection.update({ where: { id }, data: { content: content as Prisma.InputJsonValue } });
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
