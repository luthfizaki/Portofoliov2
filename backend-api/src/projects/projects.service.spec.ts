import assert from "node:assert/strict";
import test from "node:test";
import * as argon2 from "argon2";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { ProjectsService } from "./projects.service";

type MockOptions = {
  blocks?: Array<Record<string, unknown>>;
  failOn?: "projectBlock.update" | "projectBlock.createMany";
  currentVisibility?: "PUBLIC" | "PASSWORD_PROTECTED";
  passwordHash?: string | null;
};

function makeHarness(options: MockOptions = {}) {
  const updatedAt = new Date("2026-01-01T00:00:00.000Z");
  const calls: string[] = [];
  const clientRefs: object[] = [];
  let lastProjectWrite: Record<string, unknown> | null = null;
  const existingBlocks = options.blocks ?? [{
    id: "hero-1",
    type: "CASE_HERO",
    title: "Existing hero",
    content: {
      lede: "Original",
      unknownTopLevel: "preserve me",
      gallery: { items: [{ image: "old", unknownImageField: "preserve me" }] },
      feature: { images: [{ url: "old-feature", unknownImageField: "preserve me" }] },
    },
    sortOrder: 4,
    isVisible: false,
    desktop: false,
    tablet: true,
    mobile: false,
    layoutVariant: "split",
    background: "blue",
    animation: "fade",
  }, {
    id: "summary-1",
    type: "CASE_SUMMARY",
    title: "Existing summary",
    content: { overview: "Keep summary" },
    sortOrder: 5,
    isVisible: true,
    desktop: true,
    tablet: true,
    mobile: true,
    layoutVariant: "summary",
    background: "white",
    animation: "none",
  }, {
    id: "flagship-1",
    type: "flagship",
    title: "Unmanaged",
    content: { untouched: true },
    sortOrder: 9,
    isVisible: true,
    desktop: true,
    tablet: true,
    mobile: true,
    layoutVariant: null,
    background: null,
    animation: null,
  }];
  const current = {
    id: "project-1",
    title: "Original project",
    slug: "original-project",
    featured: false,
    visibility: options.currentVisibility ?? "PUBLIC",
    passwordHash: options.passwordHash ?? null,
    status: "DRAFT",
    deletedAt: null,
    publishedAt: null,
    updatedAt,
  };
  let committed = false;
  let rolledBack = false;

  const transaction = {
    project: {
      findUnique: async () => null,
      findFirst: async () => current,
      count: async () => 0,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        calls.push("project.create");
        lastProjectWrite = { ...data };
        return { ...current, ...data, id: "project-new", updatedAt };
      },
      update: async ({ data }: { data: Record<string, unknown> }) => {
        calls.push("project.update");
        clientRefs.push(transaction);
        lastProjectWrite = { ...data };
        return { ...current, ...data };
      },
      findUniqueOrThrow: async () => ({ ...current, blocks: existingBlocks, categories: [] }),
    },
    projectBlock: {
      findMany: async () => {
        calls.push("projectBlock.findMany");
        clientRefs.push(transaction);
        return existingBlocks;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        calls.push("projectBlock.update");
        clientRefs.push(transaction);
        if (options.failOn === "projectBlock.update") throw new Error("block update failed");
        const target = existingBlocks.find((block) => block.id === where.id);
        if (target) Object.assign(target, data);
        return target ?? data;
      },
      createMany: async () => {
        calls.push("projectBlock.createMany");
        if (options.failOn === "projectBlock.createMany") throw new Error("block create failed");
        return { count: 1 };
      },
      deleteMany: async () => {
        calls.push("projectBlock.deleteMany");
        return { count: 1 };
      },
    },
  };

  const prisma = {
    $transaction: async (callback: (client: typeof transaction) => Promise<unknown>) => {
      calls.push("transaction.begin");
      try {
        const result = await callback(transaction);
        committed = true;
        calls.push("transaction.commit");
        return result;
      } catch (error) {
        rolledBack = true;
        calls.push("transaction.rollback");
        throw error;
      }
    },
  };

  return {
    service: new ProjectsService(prisma as never),
    calls,
    clientRefs,
    current,
    existingBlocks,
    get lastProjectWrite() { return lastProjectWrite; },
    get committed() { return committed; },
    get rolledBack() { return rolledBack; },
  };
}

test("combined metadata and managed blocks save through the same transaction client", async () => {
  const harness = makeHarness();
  const result = await harness.service.update("project-1", {
    title: "Updated project",
    blocks: [{ type: "CASE_HERO", content: { lede: "Updated" } }],
  });

  assert.equal(result.success, true);
  assert.equal(harness.committed, true);
  assert.equal(new Set(harness.clientRefs).size, 1);
  assert.deepEqual(harness.calls, [
    "transaction.begin",
    "projectBlock.findMany",
    "projectBlock.update",
    "project.update",
    "transaction.commit",
  ]);
  const updatedBlock = harness.existingBlocks[0];
  assert.equal((updatedBlock.content as Record<string, unknown>).unknownTopLevel, "preserve me");
});

test("block write failure rejects and signals transaction rollback before metadata is committed", async () => {
  const harness = makeHarness({ failOn: "projectBlock.update" });

  await assert.rejects(
    () => harness.service.update("project-1", {
      title: "Must roll back",
      blocks: [{ type: "CASE_HERO", content: { lede: "Failure" } }],
    }),
    /block update failed/,
  );

  assert.equal(harness.rolledBack, true);
  assert.equal(harness.committed, false);
  assert.equal(harness.calls.includes("project.update"), false);
  assert.equal(harness.calls.at(-1), "transaction.rollback");
});

test("new project block failure rejects after project creation and signals rollback", async () => {
  const harness = makeHarness({ failOn: "projectBlock.createMany" });

  await assert.rejects(
    () => harness.service.create({
      title: "New project",
      blocks: [{ type: "CASE_HERO", content: { lede: "New" } }],
    }),
    /block create failed/,
  );

  assert.deepEqual(harness.calls, [
    "transaction.begin",
    "project.create",
    "projectBlock.createMany",
    "transaction.rollback",
  ]);
  assert.equal(harness.rolledBack, true);
  assert.equal(harness.committed, false);
});

test("stale expectedUpdatedAt returns 409 STALE_PROJECT without writes", async () => {
  const harness = makeHarness();

  await assert.rejects(
    () => harness.service.update("project-1", {
      title: "Stale",
      expectedUpdatedAt: "2025-12-31T00:00:00.000Z",
      blocks: [{ type: "CASE_HERO", content: { lede: "Must not write" } }],
    }),
    (error: unknown) => error instanceof ConflictException
      && (error.getResponse() as Record<string, unknown>).code === "STALE_PROJECT",
  );

  assert.deepEqual(harness.calls, ["transaction.begin", "transaction.rollback"]);
  assert.equal(harness.rolledBack, true);
});

test("metadata-only update remains compatible and does not load or write blocks", async () => {
  const harness = makeHarness();
  await harness.service.update("project-1", { title: "Metadata only" });

  assert.deepEqual(harness.calls, ["transaction.begin", "project.update", "transaction.commit"]);
});

test("legacy block-only save remains functional", async () => {
  const harness = makeHarness();
  const result = await harness.service.replaceBlocks("project-1", [
    { type: "CASE_HERO", content: { lede: "Legacy endpoint" } },
  ]);

  assert.equal(result.success, true);
  assert.equal(harness.calls.includes("projectBlock.update"), true);
  assert.equal(harness.calls.includes("project.update"), true);
  assert.equal(harness.committed, true);
});

test("combined save replaces gallery and feature arrays without index-based metadata mixing", async () => {
  const harness = makeHarness({ blocks: [
    {
      id: "gallery-1",
      type: "CASE_GALLERY",
      title: "Gallery",
      content: {
        items: [
          { image: "old-a", unknownA: "only A" },
          { image: "old-b", unknownB: "only B" },
        ],
      },
      sortOrder: 2,
      isVisible: true,
      desktop: true,
      tablet: true,
      mobile: true,
      layoutVariant: null,
      background: null,
      animation: null,
    },
    {
      id: "feature-1",
      type: "CASE_FEATURE",
      title: "Feature",
      content: {
        images: [
          { url: "old-feature-a", unknownA: "only A" },
          { url: "old-feature-b", unknownB: "only B" },
        ],
      },
      sortOrder: 3,
      isVisible: true,
      desktop: true,
      tablet: true,
      mobile: true,
      layoutVariant: null,
      background: null,
      animation: null,
    },
  ] });

  await harness.service.update("project-1", {
    blocks: [
      {
        type: "CASE_GALLERY",
        content: { items: [{ image: "new-b", unknownB: "only B" }, { image: "new-c", fresh: true }] },
      },
      {
        type: "CASE_FEATURE",
        content: { images: [{ url: "new-feature-b", unknownB: "only B" }] },
      },
    ],
  });

  assert.deepEqual((harness.existingBlocks[0].content as Record<string, unknown>).items, [
    { image: "new-b", unknownB: "only B" },
    { image: "new-c", fresh: true },
  ]);
  assert.deepEqual((harness.existingBlocks[1].content as Record<string, unknown>).images, [
    { url: "new-feature-b", unknownB: "only B" },
  ]);
});

test("preserves omitted managed metadata and unknown nested content fields", async () => {
  const harness = makeHarness();
  await harness.service.update("project-1", {
    blocks: [{
      type: "CASE_HERO",
      content: {
        gallery: { items: [{ image: "new", caption: "Edited" }] },
        feature: { images: [{ url: "new-feature", alt: "Edited" }] },
      },
    }],
  });

  const block = harness.existingBlocks[0];
  assert.equal(block.isVisible, false);
  assert.equal(block.desktop, false);
  assert.equal(block.tablet, true);
  assert.equal(block.mobile, false);
  assert.equal(block.layoutVariant, "split");
  assert.equal(block.background, "blue");
  assert.equal(block.animation, "fade");
  assert.equal((block.content as Record<string, unknown>).unknownTopLevel, "preserve me");
  assert.equal(((block.content as Record<string, any>).gallery.items[0]).unknownImageField, "preserve me");
  assert.equal(((block.content as Record<string, any>).feature.images[0]).unknownImageField, "preserve me");
  assert.deepEqual(harness.existingBlocks[1], {
    id: "summary-1",
    type: "CASE_SUMMARY",
    title: "Existing summary",
    content: { overview: "Keep summary" },
    sortOrder: 5,
    isVisible: true,
    desktop: true,
    tablet: true,
    mobile: true,
    layoutVariant: "summary",
    background: "white",
    animation: "none",
  });
  assert.deepEqual(harness.existingBlocks[2], {
    id: "flagship-1",
    type: "flagship",
    title: "Unmanaged",
    content: { untouched: true },
    sortOrder: 9,
    isVisible: true,
    desktop: true,
    tablet: true,
    mobile: true,
    layoutVariant: null,
    background: null,
    animation: null,
  });
});

test("rejects duplicate incoming and persisted managed types before writes", async () => {
  const incomingDuplicate = makeHarness();
  await assert.rejects(
    () => incomingDuplicate.service.update("project-1", {
      blocks: [
        { type: "CASE_HERO", content: { one: true } },
        { type: "CASE_HERO", content: { two: true } },
      ],
    }),
    (error: unknown) => error instanceof ConflictException
      && (error.getResponse() as Record<string, unknown>).code === "DUPLICATE_BLOCK_TYPE",
  );
  assert.deepEqual(incomingDuplicate.calls, []);

  const persistedDuplicate = makeHarness({ blocks: [
    ...makeHarness().existingBlocks,
    { ...makeHarness().existingBlocks[0], id: "hero-duplicate" },
  ] });
  await assert.rejects(
    () => persistedDuplicate.service.update("project-1", {
      blocks: [{ type: "CASE_HERO", content: { one: true } }],
    }),
    (error: unknown) => error instanceof ConflictException
      && (error.getResponse() as Record<string, unknown>).code === "DUPLICATE_PERSISTED_BLOCK_TYPE",
  );
  assert.equal(persistedDuplicate.calls.includes("projectBlock.update"), false);
  assert.equal(persistedDuplicate.calls.includes("project.update"), false);
});

test("rejects empty, null, and array block content while allowing explicit feature deletion", async () => {
  for (const content of [{}, null, []]) {
    const harness = makeHarness();
    await assert.rejects(
      () => harness.service.update("project-1", { blocks: [{ type: "CASE_HERO", content: content as never }] }),
      (error: unknown) => error instanceof BadRequestException
        && (error.getResponse() as Record<string, unknown>).code === "EMPTY_BLOCK_CONTENT",
    );
    assert.deepEqual(harness.calls, []);
  }

  const deletion = makeHarness({ blocks: [{
    id: "feature-1",
    type: "CASE_FEATURE",
    title: "Feature",
    content: { title: "Feature" },
    sortOrder: 3,
    isVisible: true,
    desktop: true,
    tablet: true,
    mobile: true,
    layoutVariant: null,
    background: null,
    animation: null,
  }] });
  await deletion.service.replaceBlocks("project-1", [{ type: "CASE_FEATURE", content: {}, delete: true }]);
  assert.equal(deletion.calls.includes("projectBlock.deleteMany"), true);
});

test("lists archived projects separately without exposing active projects", async () => {
  const deletedAt = new Date("2026-10-14T10:00:00.000Z");
  const updatedAt = new Date("2026-10-13T10:00:00.000Z");
  const queries: Array<{ method: string; args: Record<string, unknown> }> = [];
  const archivedRow = {
    id: "project-archived",
    title: "Archived project",
    slug: "archived-project",
    industry: null,
    status: "PUBLISHED",
    updatedAt,
    deletedAt,
    categories: [{ category: { name: "Product Design" } }],
  };
  const prisma = {
    project: {
      findMany: async (args: Record<string, unknown>) => {
        queries.push({ method: "findMany", args });
        return [archivedRow];
      },
      count: async (args: Record<string, unknown>) => {
        queries.push({ method: "count", args });
        return 1;
      },
    },
    $transaction: async (operations: Array<Promise<unknown>>) => Promise.all(operations),
  };
  const service = new ProjectsService(prisma as never);

  const result = await service.listArchived("12");

  assert.deepEqual(result, {
    success: true,
    data: [{
      id: "project-archived",
      title: "Archived project",
      slug: "archived-project",
      type: "Product Design",
      status: "PUBLISHED",
      updatedAt,
      deletedAt,
    }],
    meta: { total: 1, limit: 12 },
  });
  assert.equal(queries.length, 2);
  assert.deepEqual(queries[0].args.where, { deletedAt: { not: null } });
  assert.equal(queries[0].args.take, 12);
  assert.deepEqual(queries[1].args.where, { deletedAt: { not: null } });
});

test("password-protected project creation requires a password and validates its length", async () => {
  const missing = makeHarness();
  await assert.rejects(
    () => missing.service.create({ title: "Protected project", visibility: "PASSWORD_PROTECTED" }),
    (error: unknown) => error instanceof BadRequestException
      && (error.getResponse() as Record<string, unknown>).code === "PROJECT_PASSWORD_REQUIRED",
  );
  assert.deepEqual(missing.calls, []);

  const short = makeHarness();
  await assert.rejects(
    () => short.service.create({ title: "Protected project", visibility: "PASSWORD_PROTECTED", accessPassword: "short" }),
    (error: unknown) => error instanceof BadRequestException
      && (error.getResponse() as Record<string, unknown>).code === "INVALID_PROJECT_PASSWORD",
  );
  assert.deepEqual(short.calls, []);
});

test("password-protected project creation stores only an Argon2id hash and does not return the hash", async () => {
  const harness = makeHarness();
  const password = "correct horse battery staple";
  const result = await harness.service.create({
    title: "Protected project",
    visibility: "PASSWORD_PROTECTED",
    accessPassword: password,
  });

  assert.equal(harness.lastProjectWrite?.visibility, "PASSWORD_PROTECTED");
  assert.equal(typeof harness.lastProjectWrite?.passwordHash, "string");
  assert.notEqual(harness.lastProjectWrite?.passwordHash, password);
  assert.equal(await argon2.verify(harness.lastProjectWrite?.passwordHash as string, password), true);
  assert.equal(result.data.hasPassword, true);
  assert.equal("passwordHash" in result.data, false);
  assert.equal("accessPassword" in result.data, false);
});

test("switching a project to password-protected visibility requires a new password", async () => {
  const harness = makeHarness();
  await assert.rejects(
    () => harness.service.update("project-1", { visibility: "PASSWORD_PROTECTED" }),
    (error: unknown) => error instanceof BadRequestException
      && (error.getResponse() as Record<string, unknown>).code === "PROJECT_PASSWORD_REQUIRED",
  );
  assert.equal(harness.calls.includes("project.update"), false);
  assert.equal(harness.rolledBack, true);
});

test("protected project password can be rotated and is never returned by the API", async () => {
  const existingHash = await argon2.hash("previous valid password");
  const harness = makeHarness({ currentVisibility: "PASSWORD_PROTECTED", passwordHash: existingHash });
  const password = "new password with enough length";
  const result = await harness.service.update("project-1", { accessPassword: password });

  assert.equal(await argon2.verify(harness.lastProjectWrite?.passwordHash as string, password), true);
  assert.equal(result.data.hasPassword, true);
  assert.equal("passwordHash" in result.data, false);
  assert.equal("accessPassword" in result.data, false);
});

test("leaving password-protected visibility clears the stored password hash", async () => {
  const existingHash = await argon2.hash("previous valid password");
  const harness = makeHarness({ currentVisibility: "PASSWORD_PROTECTED", passwordHash: existingHash });
  const result = await harness.service.update("project-1", { visibility: "PUBLIC" });

  assert.equal(harness.lastProjectWrite?.passwordHash, null);
  assert.equal(result.data.hasPassword, false);
  assert.equal("passwordHash" in result.data, false);
});
