import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProjectBlockPersistencePlan,
  mergeManagedBlockContent,
  projectBlockPersistenceConflicts,
} from "./project-block-persistence";

const block = (type: string, content: Record<string, unknown> = {}) => ({
  id: `${type}-existing`,
  type,
  title: null,
  content: {},
  sortOrder: type === "flagship" || type === "archive" ? 0 : 1,
  isVisible: true,
  desktop: true,
  tablet: true,
  mobile: true,
  layoutVariant: null,
  background: null,
  animation: null,
  ...content,
});

test("updates managed blocks and preserves flagship", () => {
  const plan = buildProjectBlockPersistencePlan(
    [block("flagship"), block("CASE_HERO"), block("CASE_SUMMARY")],
    [
      { type: "CASE_HERO", content: { lede: "Updated hero" }, sortOrder: 0 },
      { type: "CASE_SUMMARY", content: { overview: "Updated summary" }, sortOrder: 1 },
    ],
  );

  assert.deepEqual(plan.updates.map(({ id }) => id), ["CASE_HERO-existing", "CASE_SUMMARY-existing"]);
  assert.deepEqual(plan.creates, []);
  assert.deepEqual(plan.deletes, []);
  assert.equal(plan.updates.some(({ id }) => id === "flagship-existing"), false);
});

test("creates managed hero and preserves archive", () => {
  const plan = buildProjectBlockPersistencePlan(
    [block("archive")],
    [{ type: "CASE_HERO", content: { eyebrow: "Updated" }, sortOrder: 0 }],
  );

  assert.deepEqual(plan.updates, []);
  assert.deepEqual(plan.creates, [{ type: "CASE_HERO", content: { eyebrow: "Updated" }, sortOrder: 0 }]);
  assert.deepEqual(plan.deletes, []);
});

test("ignores unmanaged incoming types", () => {
  const plan = buildProjectBlockPersistencePlan(
    [block("flagship")],
    [{ type: "flagship", content: { layout: "changed" } }],
  );

  assert.deepEqual(plan, { updates: [], creates: [], deletes: [] });
});

test("deletes only the requested case feature", () => {
  const plan = buildProjectBlockPersistencePlan(
    [block("CASE_FEATURE"), block("CASE_HERO")],
    [{ type: "CASE_FEATURE", content: {}, delete: true }],
  );

  assert.deepEqual(plan.updates, []);
  assert.deepEqual(plan.creates, []);
  assert.deepEqual(plan.deletes, ["CASE_FEATURE-existing"]);
});

test("merges nested object fields while replacing arrays", () => {
  const merged = mergeManagedBlockContent({
    title: "Existing",
    options: { theme: "dark", density: "compact" },
    images: [{ url: "old-a", alt: "A", internalId: "keep" }, { url: "old-b" }],
  }, {
    options: { theme: "light" },
    images: [{ url: "new-a", alt: "Updated" }],
  });

  assert.deepEqual(merged, {
    title: "Existing",
    options: { theme: "light", density: "compact" },
    images: [{ url: "new-a", alt: "Updated", internalId: "keep" }],
  });
});

test("combined editor mode replaces gallery items without mixing deleted or reordered metadata", () => {
  const existing = {
    heading: "Gallery",
    options: { density: "compact", theme: "dark" },
    items: [
      { image: "old-a", title: "A", unknownA: "only A" },
      { image: "old-b", title: "B", unknownB: "only B" },
    ],
  };

  const removedFirst = mergeManagedBlockContent(existing, {
    items: [{ image: "new-b", title: "B", unknownB: "only B" }],
  }, { blockType: "CASE_GALLERY", replaceEditorArrays: true });
  assert.deepEqual(removedFirst.items, [{ image: "new-b", title: "B", unknownB: "only B" }]);

  const reordered = mergeManagedBlockContent(existing, {
    items: [
      { image: "new-b", title: "B", unknownB: "only B" },
      { image: "new-a", title: "A", unknownA: "only A" },
    ],
  }, { blockType: "CASE_GALLERY", replaceEditorArrays: true });
  assert.deepEqual(reordered.items, [
    { image: "new-b", title: "B", unknownB: "only B" },
    { image: "new-a", title: "A", unknownA: "only A" },
  ]);
  assert.deepEqual(reordered.options, { density: "compact", theme: "dark" });
});

test("combined editor mode makes new gallery items start without prior item metadata", () => {
  const merged = mergeManagedBlockContent({
    items: [{ image: "old", unknownOld: true }],
  }, {
    items: [{ image: "old", unknownOld: true }, { image: "new", title: "New" }],
  }, { blockType: "CASE_GALLERY", replaceEditorArrays: true });

  assert.deepEqual(merged.items, [
    { image: "old", unknownOld: true },
    { image: "new", title: "New" },
  ]);
});

test("combined editor mode replaces CASE_FEATURE images as a complete array", () => {
  const merged = mergeManagedBlockContent({
    images: [
      { url: "old-a", unknownA: "only A" },
      { url: "old-b", unknownB: "only B" },
    ],
    layout: { variant: "media-right" },
  }, {
    images: [{ url: "new-b", alt: "B", unknownB: "only B" }],
  }, { blockType: "CASE_FEATURE", replaceEditorArrays: true });

  assert.deepEqual(merged.images, [{ url: "new-b", alt: "B", unknownB: "only B" }]);
  assert.deepEqual(merged.layout, { variant: "media-right" });
});

test("legacy mode keeps partial array merge semantics for compatibility", () => {
  const merged = mergeManagedBlockContent({
    items: [{ image: "old", unknownOld: true }],
  }, {
    items: [{ image: "updated" }],
  }, { blockType: "CASE_GALLERY" });

  assert.deepEqual(merged.items, [{ image: "updated", unknownOld: true }]);
});

test("reports duplicate managed block types without flagging unmanaged blocks", () => {
  const conflicts = projectBlockPersistenceConflicts(
    [block("CASE_HERO"), block("CASE_HERO"), block("flagship")],
    [
      { type: "CASE_SUMMARY", content: {} },
      { type: "CASE_SUMMARY", content: {} },
      { type: "flagship", content: {} },
    ],
  );

  assert.deepEqual(conflicts, {
    duplicateIncomingTypes: ["CASE_SUMMARY"],
    duplicatePersistedTypes: ["CASE_HERO"],
  });
});
