import { Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CreateSkillDto, SkillFieldsDto } from "./dto/skill.dto";

const sectionMeta = {
  sectionNumber: "07",
  sectionLabel: "SKILLS",
  headlineLines: ["SKILLS THAT TURN", "IDEAS INTO PRODUCTS."],
  intro: "A practical view of the design, product, research, and implementation skills I use to move work from messy requirements into shipped digital experiences.",
  summaryLabel: "CAPABILITY MAP",
  summary: "Grouped by how the work usually happens: discovery, interface design, systems, and implementation collaboration.",
  footerNote: "SKILL DATA IS MANAGED FROM CMS AND RENDERED DIRECTLY ON THE FRONTEND.",
};

const defaultRows: CreateSkillDto[] = [
  {
    name: "Product UX Strategy",
    category: "Discovery",
    description: "Turning business requirements, user needs, and product constraints into clear user flows, IA, and experience direction.",
    level: 92,
    tools: ["User Flow", "IA", "Journey Map", "Product Logic"],
    featured: true,
    status: "PUBLISHED",
    sortOrder: 0,
  },
  {
    name: "High-Fidelity UI Design",
    category: "Interface",
    description: "Designing polished mobile and dashboard interfaces with strong hierarchy, interaction states, and responsive behavior.",
    level: 94,
    tools: ["Figma", "Auto Layout", "Prototype", "Responsive UI"],
    featured: true,
    status: "PUBLISHED",
    sortOrder: 1,
  },
  {
    name: "Design System",
    category: "System",
    description: "Building reusable components, variants, tokens, and documentation that keep product teams consistent at speed.",
    level: 88,
    tools: ["Components", "Variables", "Tokens", "Specs"],
    featured: true,
    status: "PUBLISHED",
    sortOrder: 2,
  },
  {
    name: "Developer Handoff",
    category: "Implementation",
    description: "Preparing implementation-ready specs, edge cases, interaction notes, and QA feedback for frontend and backend teams.",
    level: 86,
    tools: ["Handoff", "UAT", "QA Notes", "API States"],
    status: "PUBLISHED",
    sortOrder: 3,
  },
  {
    name: "Dashboard UX",
    category: "Interface",
    description: "Structuring dense operational screens, tables, filters, metrics, and role-based workflows for repeated daily use.",
    level: 90,
    tools: ["Data UI", "Tables", "Filters", "Admin Panel"],
    status: "PUBLISHED",
    sortOrder: 4,
  },
  {
    name: "Frontend Awareness",
    category: "Implementation",
    description: "Designing with practical awareness of HTML, CSS, responsive constraints, accessibility, and component behavior.",
    level: 78,
    tools: ["HTML", "CSS", "React", "Responsive"],
    status: "PUBLISHED",
    sortOrder: 5,
  },
];

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    await this.ensureSeeded();
    const rows = await this.prisma.skill.findMany({ orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }] });
    return { success: true, data: rows, meta: { total: rows.length, published: rows.filter((row) => row.status === "PUBLISHED").length } };
  }

  async publicContent() {
    await this.ensureSeeded();
    return { success: true, data: await this.buildContent() };
  }

  async create(dto: CreateSkillDto) {
    await this.ensureSeeded();
    const created = await this.prisma.skill.create({ data: this.toData(dto) });
    await this.syncHomepageSection();
    return { success: true, message: "Skill created.", data: created };
  }

  async update(id: string, dto: SkillFieldsDto) {
    await this.ensureExists(id);
    const updated = await this.prisma.skill.update({ where: { id }, data: this.toData(dto) });
    await this.syncHomepageSection();
    return { success: true, message: "Skill updated.", data: updated };
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.skill.update({ where: { id }, data: { status: "ARCHIVED" } });
    await this.syncHomepageSection();
    return { success: true, message: "Skill archived.", data: null };
  }

  async syncHomepageSection() {
    const content = await this.buildContent();
    const page = await this.prisma.page.upsert({
      where: { slug: "home" },
      update: { status: "PUBLISHED", isHomepage: true, publishedAt: new Date() },
      create: { name: "Homepage", slug: "home", status: "PUBLISHED", isHomepage: true, publishedAt: new Date() },
    });
    const existing = await this.prisma.pageSection.findFirst({ where: { pageId: page.id, type: "skills" }, select: { id: true } });
    if (existing) {
      await this.prisma.pageSection.update({ where: { id: existing.id }, data: { name: "Skills", content: content as Prisma.InputJsonValue, isVisible: true } });
      return;
    }
    await this.prisma.pageSection.create({
      data: { pageId: page.id, type: "skills", name: "Skills", content: content as Prisma.InputJsonValue, sortOrder: 7, isVisible: true },
    });
  }

  private async buildContent() {
    const items = await this.prisma.skill.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      select: { name: true, category: true, description: true, level: true, tools: true, featured: true },
    });
    const categories = [...new Set(items.map((item) => item.category))].map((category) => ({
      name: category,
      count: items.filter((item) => item.category === category).length,
    }));
    return { ...sectionMeta, categories, items };
  }

  private toData(dto: SkillFieldsDto): Prisma.SkillUncheckedCreateInput {
    const data: Prisma.SkillUncheckedCreateInput = {} as Prisma.SkillUncheckedCreateInput;
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.category !== undefined) data.category = dto.category.trim();
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.level !== undefined) data.level = Math.max(0, Math.min(100, dto.level));
    if (dto.tools !== undefined) data.tools = dto.tools.map((tool) => tool.trim()).filter(Boolean);
    if (dto.featured !== undefined) data.featured = dto.featured;
    if (dto.status !== undefined) data.status = dto.status as ContentStatus;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    return data;
  }

  private async ensureSeeded() {
    const count = await this.prisma.skill.count();
    if (count > 0) return;
    await this.prisma.skill.createMany({ data: defaultRows.map((row) => this.toData(row)) });
    await this.syncHomepageSection();
  }

  private async ensureExists(id: string) {
    const row = await this.prisma.skill.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new NotFoundException({ success: false, code: "NOT_FOUND", message: "Skill was not found." });
  }
}
