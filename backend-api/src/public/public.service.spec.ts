import assert from "node:assert/strict";
import test from "node:test";
import * as argon2 from "argon2";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { PublicService } from "./public.service";

type ProjectStub = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  description: string | null;
  client: string | null;
  industry: string | null;
  year: number | null;
  role: string | null;
  duration: string | null;
  platform: string | null;
  services: string[];
  tools: string[];
  featured: boolean;
  sortOrder: number;
  visibility: "PUBLIC" | "UNLISTED" | "PASSWORD_PROTECTED" | "PRIVATE";
  status: "PUBLISHED" | "DRAFT";
  deletedAt: Date | null;
  publishedAt: Date;
  passwordHash: string | null;
  coverMedia: { url: string; altText: string | null } | null;
  categories: Array<{ category: { name: string; slug: string } }>;
  tags: Array<{ tag: { name: string; slug: string } }>;
  metrics: Array<{ value: string; label: string; note: string | null; sortOrder: number }>;
  blocks: Array<{ type: string; title: string | null; content: Record<string, unknown>; sortOrder: number; layoutVariant: string | null }>;
  seo?: { title: string | null; description: string | null; canonical: string | null; ogTitle: string | null; ogDescription: string | null; ogImageUrl: string | null; noIndex: boolean; noFollow: boolean; jsonLd?: Record<string, unknown> | null } | null;
};

function project(overrides: Partial<ProjectStub> = {}): ProjectStub {
  return {
    id: "project-1",
    title: "Protected case study",
    slug: "protected-case-study",
    excerpt: "A private preview",
    description: "Details that must stay behind the password gate.",
    client: "Example client",
    industry: "Product Design",
    year: 2026,
    role: "Product Designer",
    duration: "3 months",
    platform: "Web",
    services: ["Product Design"],
    tools: ["Figma"],
    featured: false,
    sortOrder: 0,
    visibility: "PASSWORD_PROTECTED",
    status: "PUBLISHED",
    deletedAt: null,
    publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    passwordHash: null,
    coverMedia: { url: "https://assets.example.test/cover.png", altText: "Project cover" },
    categories: [{ category: { name: "Product Design", slug: "product-design" } }],
    tags: [{ tag: { name: "UX", slug: "ux" } }],
    metrics: [{ value: "30%", label: "Improvement", note: null, sortOrder: 0 }],
    blocks: [{ type: "CASE_HERO", title: "Hero", content: { lede: "Sensitive case study content" }, sortOrder: 0, layoutVariant: null }],
    seo: { title: "SEO title", description: "SEO description", canonical: "https://lyzastudio.my.id/case-study/protected-case-study", ogTitle: "Social title", ogDescription: "Social description", ogImageUrl: "https://assets.example.test/og.png", noIndex: true, noFollow: false, jsonLd: { privateField: "must not leak" } },
    ...overrides,
  };
}

function makeService(record: ProjectStub | null) {
  const findFirstCalls: Array<Record<string, unknown>> = [];
  const listCalls: Array<Record<string, unknown>> = [];
  const prisma = {
    project: {
      findFirst: async (args: Record<string, unknown>) => {
        findFirstCalls.push(args);
        const where = args.where as Record<string, unknown>;
        if (!record || where.slug !== record.slug) return null;
        if (where.visibility && where.visibility !== record.visibility) return null;
        if (where.status && where.status !== record.status) return null;
        if ("deletedAt" in where && record.deletedAt !== null) return null;
        const publishedAt = where.publishedAt as { lte?: Date } | undefined;
        if (publishedAt?.lte && record.publishedAt > publishedAt.lte) return null;
        return record;
      },
      findMany: async (args: Record<string, unknown>) => {
        listCalls.push(args);
        return [];
      },
      count: async (args: Record<string, unknown>) => {
        listCalls.push(args);
        return 0;
      },
    },
    $transaction: async (operations: Array<Promise<unknown>>) => Promise.all(operations),
  };
  const service = new PublicService(prisma as never, {} as never, {} as never, {} as never);
  return { service, findFirstCalls, listCalls };
}

test("public project lists query PUBLIC visibility only", async () => {
  const { service, listCalls } = makeService(project());
  await service.projects(undefined, undefined, undefined);

  assert.equal(listCalls.length, 2);
  assert.deepEqual((listCalls[0].where as Record<string, unknown>).visibility, "PUBLIC");
  assert.deepEqual((listCalls[1].where as Record<string, unknown>).visibility, "PUBLIC");
});

test("public case study SEO is exposed through an allowlist", async () => {
  const record = project({ visibility: "PUBLIC" });
  const { service } = makeService(record);
  const result = await service.project(record.slug);
  assert.equal(result.data.seo?.title, "SEO title");
  assert.equal(result.data.seo?.noIndex, true);
  assert.equal("jsonLd" in (result.data.seo ?? {}), false);
  assert.equal(JSON.stringify(result).includes("must not leak"), false);
});

test("public case study response never contains passwordHash", async () => {
  const record = project({ visibility: "PUBLIC", passwordHash: "argon2id-secret-hash" });
  const { service } = makeService(record);
  const result = await service.project(record.slug);

  assert.equal(result.success, true);
  assert.equal(result.data.title, record.title);
  assert.equal("passwordHash" in result.data, false);
  assert.equal(JSON.stringify(result).includes("argon2id-secret-hash"), false);
});

test("protected case study returns PASSWORD_REQUIRED without exposing content", async () => {
  const record = project({ passwordHash: "argon2id-secret-hash" });
  const { service } = makeService(record);

  await assert.rejects(
    () => service.project(record.slug),
    (error: unknown) => error instanceof ForbiddenException
      && error.getStatus() === 403
      && (error.getResponse() as Record<string, unknown>).code === "PASSWORD_REQUIRED"
      && !("data" in (error.getResponse() as Record<string, unknown>)),
  );
});

test("private and unlisted case studies remain unavailable by direct public URL", async () => {
  for (const visibility of ["PRIVATE", "UNLISTED"] as const) {
    const { service } = makeService(project({ visibility }));
    await assert.rejects(
      () => service.project("protected-case-study"),
      (error: unknown) => error instanceof NotFoundException && error.getStatus() === 404,
    );
  }
});

test("correct password returns case study content without passwordHash", async () => {
  const password = "correct horse battery staple";
  const record = project({ passwordHash: await argon2.hash(password, { type: argon2.argon2id }) });
  const { service } = makeService(record);

  const result = await service.accessProtectedProject(record.slug, password);

  assert.equal(result.success, true);
  assert.equal(result.data.title, record.title);
  assert.equal("passwordHash" in result.data, false);
  assert.equal(JSON.stringify(result).includes(record.passwordHash as string), false);
});

test("incorrect password never returns case study content", async () => {
  const record = project({ passwordHash: await argon2.hash("the correct password", { type: argon2.argon2id }) });
  const { service } = makeService(record);

  await assert.rejects(
    () => service.accessProtectedProject(record.slug, "incorrect password"),
    (error: unknown) => error instanceof ForbiddenException
      && error.getStatus() === 403
      && (error.getResponse() as Record<string, unknown>).code === "INVALID_PROJECT_PASSWORD",
  );
});

test("missing protected password configuration fails closed", async () => {
  const { service } = makeService(project({ passwordHash: null }));

  await assert.rejects(
    () => service.accessProtectedProject("protected-case-study", "some valid password"),
    (error: unknown) => error instanceof ForbiddenException
      && (error.getResponse() as Record<string, unknown>).code === "PROJECT_PASSWORD_NOT_CONFIGURED",
  );
});

test("unpublished or missing protected projects cannot be unlocked", async () => {
  const unpublished = project({ status: "DRAFT", passwordHash: await argon2.hash("correct horse battery staple") });
  const { service } = makeService(unpublished);

  await assert.rejects(
    () => service.accessProtectedProject(unpublished.slug, "correct horse battery staple"),
    (error: unknown) => error instanceof NotFoundException && error.getStatus() === 404,
  );
});
