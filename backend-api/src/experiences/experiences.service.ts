import { Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CreateExperienceDto, ExperienceFieldsDto } from "./dto/experience.dto";

const sectionMeta = {
  sectionNumber: "02",
  sectionLabel: "EXPERIENCE",
  headlineLines: ["A CAREER BUILT", "THROUGH PRACTICE."],
  intro: "A timeline of experiences across product design, enterprise systems, health-tech, insurance, and digital innovation.",
  selectedLabel: "SELECTED EXPERIENCE",
  selectedRange: "2018 — PRESENT",
  footerNote: "CAREER ARCHIVE  —  SELECTED ROLES FROM 2018 TO PRESENT",
};

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.experience.findMany({
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }, { id: "asc" }],
    });
    return { success: true, data: rows, meta: { total: rows.length, published: rows.filter((row) => row.status === "PUBLISHED").length } };
  }

  async publicContent() {
    return { success: true, data: await this.buildContent() };
  }

  async create(dto: CreateExperienceDto) {
    const created = await this.prisma.experience.create({ data: this.toData(dto) });
    return { success: true, message: "Experience created.", data: created };
  }

  async update(id: string, dto: ExperienceFieldsDto) {
    await this.ensureExists(id);
    const updated = await this.prisma.experience.update({ where: { id }, data: this.toData(dto) });
    return { success: true, message: "Experience updated.", data: updated };
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.experience.update({ where: { id }, data: { status: "ARCHIVED" } });
    return { success: true, message: "Experience archived.", data: null };
  }

  private async buildContent() {
    const rows = await this.prisma.experience.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }, { id: "asc" }],
      select: { year: true, role: true, company: true, contribution: true, tags: true, featured: true },
    });
    return { ...sectionMeta, rows };
  }

  private toData(dto: ExperienceFieldsDto): Prisma.ExperienceUncheckedCreateInput {
    const data: Prisma.ExperienceUncheckedCreateInput = {} as Prisma.ExperienceUncheckedCreateInput;
    if (dto.year !== undefined) data.year = dto.year.trim();
    if (dto.role !== undefined) data.role = dto.role.trim();
    if (dto.company !== undefined) data.company = dto.company.trim();
    if (dto.contribution !== undefined) data.contribution = dto.contribution.trim();
    if (dto.tags !== undefined) data.tags = dto.tags.map((tag) => tag.trim()).filter(Boolean);
    if (dto.featured !== undefined) data.featured = dto.featured;
    if (dto.status !== undefined) data.status = dto.status as ContentStatus;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    return data;
  }

  private async ensureExists(id: string) {
    const row = await this.prisma.experience.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new NotFoundException({ success: false, code: "NOT_FOUND", message: "Experience was not found." });
  }
}
