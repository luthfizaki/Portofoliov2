import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { MediaService } from "./media.service";

function makeService(prisma: Record<string, unknown>) {
  const service = Object.create(MediaService.prototype) as MediaService;
  Object.defineProperty(service, "prisma", { value: prisma });
  return service;
}

test("media library list filters active assets without exposing storage keys", async () => {
  let listArgs: Record<string, unknown> | undefined;
  let countArgs: Record<string, unknown> | undefined;
  const asset = {
    id: "asset-1", type: "IMAGE", filename: "id_123.png", originalName: "portfolio-cover.png",
    url: "https://cdn.example.test/cover.png", mimeType: "image/png", size: 123,
    width: 1, height: 1, duration: null, altText: null, caption: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"), updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
  const service = makeService({
    mediaAsset: {
      findMany: async (args: Record<string, unknown>) => { listArgs = args; return [asset]; },
      count: async (args: Record<string, unknown>) => { countArgs = args; return 1; },
    },
  });
  const result = await service.list({ type: "image", q: " cover ", limit: "10" });
  assert.equal(result.success, true);
  assert.equal(result.data.length, 1);
  assert.equal("storageKey" in result.data[0], false);
  assert.equal(result.meta.total, 1);
  const where = (listArgs?.where ?? {}) as Record<string, unknown>;
  assert.deepEqual(where.deletedAt, null);
  assert.equal(where.type, "IMAGE");
  assert.equal(Array.isArray(where.OR), true);
  assert.deepEqual(countArgs?.where, listArgs?.where);
});

test("media metadata update trims text and maps blank values to null", async () => {
  let updateArgs: Record<string, unknown> | undefined;
  const service = makeService({
    mediaAsset: {
      findFirst: async () => ({ id: "asset-1" }),
      update: async (args: Record<string, unknown>) => {
        updateArgs = args;
        return { id: "asset-1", altText: "Portfolio cover", caption: null };
      },
    },
  });
  const result = await service.updateMetadata("asset-1", { altText: "  Portfolio cover ", caption: "   " });
  assert.equal(result.success, true);
  assert.deepEqual(updateArgs?.data, { altText: "Portfolio cover", caption: null });
});

test("missing and soft-deleted assets cannot have metadata updated", async () => {
  const service = makeService({ mediaAsset: { findFirst: async () => null } });
  await assert.rejects(
    () => service.updateMetadata("missing", { altText: "Cover" }),
    (error: unknown) => error instanceof NotFoundException && error.getStatus() === 404,
  );
});

test("media list rejects unsupported type filters", async () => {
  const service = makeService({ mediaAsset: { findMany: async () => [], count: async () => 0 } });
  await assert.rejects(
    () => service.list({ type: "SCRIPT" }),
    (error: unknown) => error instanceof BadRequestException && error.getStatus() === 400,
  );
});

test("Preview content writes fail closed unless explicitly enabled", async () => {
  const oldEnv = process.env.VERCEL_ENV;
  const oldOptIn = process.env.ALLOW_PREVIEW_CONTENT_WRITES;
  process.env.VERCEL_ENV = "preview";
  delete process.env.ALLOW_PREVIEW_CONTENT_WRITES;
  try {
    const service = makeService({ mediaAsset: { findFirst: async () => { throw new Error("should not query"); } } });
    await assert.rejects(
      () => service.updateMetadata("asset-1", { altText: "Cover" }),
      (error: unknown) => error instanceof ForbiddenException
        && (error.getResponse() as Record<string, unknown>).code === "PREVIEW_READ_ONLY",
    );
  } finally {
    if (oldEnv === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = oldEnv;
    if (oldOptIn === undefined) delete process.env.ALLOW_PREVIEW_CONTENT_WRITES; else process.env.ALLOW_PREVIEW_CONTENT_WRITES = oldOptIn;
  }
});
