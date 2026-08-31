import assert from "node:assert/strict";
import test from "node:test";
import { buildProjectBlockPersistencePlan } from "./project-block-persistence";

const block = (type: string, content: Record<string, unknown> = {}) => ({
  id: `${type}-existing`,
  type,
  title: null,
  content: {},
  sortOrder: type === "flagship" || type === "archive" ? 0 : 1,
  isVisible: true,
  layoutVariant: null,
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
  assert.equal(plan.updates.some(({ id }) => id === "flagship-existing"), false);
});

test("creates managed hero and preserves archive", () => {
  const plan = buildProjectBlockPersistencePlan(
    [block("archive")],
    [{ type: "CASE_HERO", content: { eyebrow: "Updated" }, sortOrder: 0 }],
  );

  assert.deepEqual(plan.updates, []);
  assert.deepEqual(plan.creates, [{ type: "CASE_HERO", content: { eyebrow: "Updated" }, sortOrder: 0 }]);
});

test("ignores unmanaged incoming types", () => {
  const plan = buildProjectBlockPersistencePlan(
    [block("flagship")],
    [{ type: "flagship", content: { layout: "changed" } }],
  );

  assert.deepEqual(plan, { updates: [], creates: [] });
});
