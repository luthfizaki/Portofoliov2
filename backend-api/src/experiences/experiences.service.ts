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

const defaultRows: CreateExperienceDto[] = [
  {
    year: "2023 — PRESENT",
    role: "UI/UX DESIGNER",
    company: "PT. SELERIS MEDITEKNO INTERNASIONAL",
    contribution: "Designing health intelligence, underwriting, insurance, and enterprise experiences across mobile and web.",
    tags: ["PRODUCT DESIGN", "DESIGN SYSTEM", "UAT SUPPORT"],
    featured: true,
    status: "PUBLISHED",
    sortOrder: 0,
  },
  {
    year: "2022",
    role: "UI DESIGNER & QA INTERN",
    company: "PT. TRI NINDYA UTAMA",
    contribution: "Created digital interfaces, supported product testing, and collaborated with developers during implementation.",
    tags: ["UI DESIGN", "QA TESTING", "COLLABORATION"],
    status: "PUBLISHED",
    sortOrder: 1,
  },
  {
    year: "2021 — PRESENT",
    role: "FREELANCE UI/UX DESIGNER",
    company: "SELECTED CLIENT PROJECTS",
    contribution: "Helping clients turn business ideas into clear, usable digital products and responsive web experiences.",
    tags: ["WEB DESIGN", "PROTOTYPING", "CLIENT WORK"],
    status: "PUBLISHED",
    sortOrder: 2,
  },
  {
    year: "2018",
    role: "FRONT-END DEVELOPER",
    company: "PT. AZIMUTH SOLUTION",
    contribution: "Early professional experience focused on frontend development and web interface implementation.",
    tags: ["FRONT-END DEVELOPMENT", "WEB INTERFACE"],
    status: "PUBLISHED",
    sortOrder: 3,
  },
];

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    await this.ensureSeeded();
    const rows = await this.prisma.experience.findMany({ orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }] });
    return { success: true, data: rows, meta: { total: rows.length, published: rows.filter((row) => row.status === "PUBLISHED").length } };
  }

  async publicContent() {
    await this.ensureSeeded();
    return { success: true, data: await this.buildContent() };
  }

  async create(dto: CreateExperienceDto) {
    await this.ensureSeeded();
    const created = await this.prisma.experience.create({ data: this.toData(dto) });
    await this.syncHomepageSection();
    return { success: true, message: "Experience created.", data: created };
  }

  async update(id: string, dto: ExperienceFieldsDto) {
    await this.ensureExists(id);
    const updated = await this.prisma.experience.update({ where: { id }, data: this.toData(dto) });
    await this.syncHomepageSection();
    return { success: true, message: "Experience updated.", data: updated };
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.experience.update({ where: { id }, data: { status: "ARCHIVED" } });
    await this.syncHomepageSection();
    return { success: true, message: "Experience archived.", data: null };
  }

  async syncHomepageSection() {
    const content = await this.buildContent();
    const page = await this.prisma.page.upsert({
      where: { slug: "home" },
      update: { status: "PUBLISHED", isHomepage: true, publishedAt: new Date() },
      create: { name: "Homepage", slug: "home", status: "PUBLISHED", isHomepage: true, publishedAt: new Date() },
    });
    const existing = await this.prisma.pageSection.findFirst({ where: { pageId: page.id, type: "experience" }, select: { id: true } });
    if (existing) {
      await this.prisma.pageSection.update({ where: { id: existing.id }, data: { name: "Experience", content: content as Prisma.InputJsonValue, isVisible: true } });
      return;
    }
    await this.prisma.pageSection.create({
      data: { pageId: page.id, type: "experience", name: "Experience", content: content as Prisma.InputJsonValue, sortOrder: 2, isVisible: true },
    });
  }

  private async buildContent() {
    const rows = await this.prisma.experience.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
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

  private async ensureSeeded() {
    const count = await this.prisma.experience.count();
    if (count > 0) return;
    await this.prisma.experience.createMany({ data: defaultRows.map((row) => this.toData(row)) });
    await this.syncHomepageSection();
  }

  private async ensureExists(id: string) {
    const row = await this.prisma.experience.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new NotFoundException({ success: false, code: "NOT_FOUND", message: "Experience was not found." });
  }
}
