import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { ProjectsService } from "./projects.service";

type MockOptions = {
  blocks?: Array<Record<string, unknown>>;
  failOn?: "projectBlock.update" | "projectBlock.createMany";
};

function makeHarness(options: MockOptions = {}) {
  const updatedAt = new Date("2026-01-01T00:00:00.000Z");
  const calls: string[] = [];
  const clientRefs: object[] = [];
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
    visibility: "PUBLIC",
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
        return { ...current, ...data, id: "project-new", updatedAt };
      },
      update: async ({ data }: { data: Record<string, unknown> }) => {
        calls.push("project.update");
        clientRefs.push(transaction);
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
