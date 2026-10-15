import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { SeoService } from "./seo.service";

function makeService(prisma: Record<string, unknown>) {
  const service = Object.create(SeoService.prototype) as SeoService;
  Object.defineProperty(service, "prisma", { value: prisma });
  return service;
}

test("SEO list combines pages and projects and allowlists returned fields", async () => {
  const service = makeService({
    page: { findMany: async () => [{
      id: "page-1", name: "Home", slug: "home", status: "PUBLISHED",
      updatedAt: new Date("2026-01-01T00:00:00.000Z"), seo: null,
    }] },
    project: { findMany: async () => [{
      id: "project-1", title: "Case Study", slug: "case-study", status: "PUBLISHED",
      visibility: "PUBLIC", updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      seo: { title: "Case SEO", description: "Description", canonical: null, ogTitle: null, ogDescription: null, ogImageUrl: null, noIndex: false, noFollow: false, jsonLd: { internal: "do not return" } },
    }] },
  });
  const result = await service.list();
  assert.equal(result.meta.total, 2);
  assert.equal(result.data[0].entityType, "project");
  assert.equal(result.data[1].seo, null);
  assert.equal(result.data[0].seo?.title, "Case SEO");
  assert.equal("jsonLd" in (result.data[0].seo ?? {}), false);
});

test("SEO update trims metadata and stores it on the selected page", async () => {
  let upsertArgs: Record<string, unknown> | undefined;
  const service = makeService({
    page: { findFirst: async () => ({ id: "page-1" }) },
    seoMetadata: { upsert: async (args: Record<string, unknown>) => {
      upsertArgs = args;
      return { title: "Search title", description: "Description", canonical: "https://lyzastudio.my.id/", ogTitle: null, ogDescription: null, ogImageUrl: null, noIndex: true, noFollow: false, jsonLd: { secret: "not exposed" } };
    } },
  });
  const result = await service.update("page", "page-1", {
    title: " Search title ", description: "Description", canonical: "https://lyzastudio.my.id/", noIndex: true,
  });
  assert.equal(result.success, true);
  assert.deepEqual(upsertArgs?.where, { pageId: "page-1" });
  assert.equal((upsertArgs?.create as Record<string, unknown>).title, "Search title");
  assert.equal(result.data.seo?.noIndex, true);
  assert.equal("jsonLd" in (result.data.seo ?? {}), false);
});

test("SEO update rejects unsupported entities and unsafe URLs", async () => {
  const service = makeService({});
  await assert.rejects(
    () => service.update("media", "asset-1", { title: "Title" }),
    (error: unknown) => error instanceof BadRequestException,
  );
  const validEntity = makeService({
    project: { findFirst: async () => ({ id: "project-1" }) },
    seoMetadata: { upsert: async () => ({}) },
  });
  await assert.rejects(
    () => validEntity.update("project", "project-1", { canonical: "javascript:alert(1)" }),
    (error: unknown) => error instanceof BadRequestException
      && (error.getResponse() as Record<string, unknown>).code === "INVALID_SEO_URL",
  );
});

test("SEO updates require an existing, non-deleted target", async () => {
  const service = makeService({ page: { findFirst: async () => null } });
  await assert.rejects(
    () => service.update("page", "missing", { title: "Title" }),
    (error: unknown) => error instanceof NotFoundException && error.getStatus() === 404,
  );
});
