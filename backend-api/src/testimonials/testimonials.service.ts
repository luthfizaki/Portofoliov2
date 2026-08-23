import { Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CreateTestimonialDto, TestimonialFieldsDto } from "./dto/testimonial.dto";

const sectionMeta = {
  sectionNumber: "06",
  sectionLabel: "COLLABORATION / TESTIMONIALS",
  headlineLines: ["GOOD DESIGN IS", "BUILT TOGETHER."],
  intro: "The strongest outcomes come from clear communication, shared responsibility, and the ability to adapt without losing sight of the user or the business goal.",
  perspectiveNote: "THREE PERSPECTIVES  /  ONE SHARED STANDARD",
  principleLabel: "WORKING PRINCIPLE",
  principle: "Listen clearly  ->  align early  ->  adapt quickly  ->  deliver responsibly.",
  principleTags: "TRUST  /  CLARITY  /  ACCOUNTABILITY",
  ambientDotUrl: "/testimonial-ambient-dot.svg",
};

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.testimonial.findMany({
      where: { projectId: null },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }, { id: "asc" }],
    });
    return { success: true, data: rows.map((row) => this.toAdmin(row)), meta: { total: rows.length, published: rows.filter((row) => row.status === "PUBLISHED").length } };
  }

  async publicContent() {
    return { success: true, data: await this.buildContent() };
  }

  async create(dto: CreateTestimonialDto) {
    const created = await this.prisma.testimonial.create({ data: this.toData(dto) });
    return { success: true, message: "Testimonial created.", data: this.toAdmin(created) };
  }

  async update(id: string, dto: TestimonialFieldsDto) {
    await this.ensureExists(id);
    const updated = await this.prisma.testimonial.update({ where: { id }, data: this.toData(dto) });
    return { success: true, message: "Testimonial updated.", data: this.toAdmin(updated) };
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.testimonial.update({ where: { id }, data: { status: "ARCHIVED" } });
    return { success: true, message: "Testimonial archived.", data: null };
  }

  private async buildContent() {
    const rows = await this.prisma.testimonial.findMany({
      where: { status: "PUBLISHED", projectId: null },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { updatedAt: "desc" }, { id: "asc" }],
      include: { photoMedia: { select: { url: true } } },
    });
    return { ...sectionMeta, testimonials: rows.map((row, index) => this.toPublic(row, index)) };
  }

  private toData(dto: TestimonialFieldsDto): Prisma.TestimonialUncheckedCreateInput {
    const data: Prisma.TestimonialUncheckedCreateInput = { projectId: null } as Prisma.TestimonialUncheckedCreateInput;
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.role !== undefined) data.position = dto.role.trim();
    if (dto.company !== undefined) data.company = dto.company.trim();
    if (dto.quote !== undefined) data.quote = dto.quote.trim();
    if (dto.initial !== undefined) data.initial = dto.initial.trim();
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl.trim();
    if (dto.accent !== undefined) data.accent = dto.accent;
    if (dto.featuredLabel !== undefined) data.featuredLabel = dto.featuredLabel.trim();
    if (dto.tags !== undefined) data.tags = dto.tags.map((tag) => tag.trim()).filter(Boolean);
    if (dto.featured !== undefined) data.featured = dto.featured;
    if (dto.status !== undefined) data.status = dto.status as ContentStatus;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    return data;
  }

  private toAdmin(row: {
    id: string; name: string; position: string | null; company: string | null; quote: string; initial: string | null; avatarUrl: string | null; accent: string; featuredLabel: string | null; tags: string[]; featured: boolean; status: ContentStatus; sortOrder: number; updatedAt: Date;
  }) {
    return {
      id: row.id,
      name: row.name,
      role: row.position ?? "",
      company: row.company ?? "",
      quote: row.quote,
      initial: row.initial ?? row.name.slice(0, 1).toUpperCase(),
      avatarUrl: row.avatarUrl ?? "",
      accent: row.accent,
      featuredLabel: row.featuredLabel ?? "",
      tags: row.tags,
      featured: row.featured,
      status: row.status,
      sortOrder: row.sortOrder,
      updatedAt: row.updatedAt,
    };
  }

  private toPublic(row: {
    name: string; position: string | null; company: string | null; quote: string; initial: string | null; avatarUrl: string | null; accent: string; featuredLabel: string | null; tags: string[]; featured: boolean; photoMedia: { url: string } | null;
  }, index: number) {
    return {
      number: String(index + 1).padStart(2, "0"),
      featured: row.featured,
      featuredLabel: row.featuredLabel || undefined,
      quote: row.quote,
      name: row.name,
      initial: row.initial || row.name.slice(0, 1).toUpperCase(),
      role: row.position ?? "",
      company: row.company ?? "",
      avatarUrl: row.avatarUrl || row.photoMedia?.url || "/testimonial-raka-avatar.svg",
      accent: row.accent,
      tags: row.tags.length ? row.tags : undefined,
    };
  }

  private async ensureExists(id: string) {
    const row = await this.prisma.testimonial.findFirst({ where: { id, projectId: null }, select: { id: true } });
    if (!row) throw new NotFoundException({ success: false, code: "NOT_FOUND", message: "Testimonial was not found." });
  }
}
