import assert from "node:assert/strict";
import test from "node:test";
import { draftJson, editorSnapshot, isConfirmedProjectStatus, isEditorActionDisabled, isEditorDirty, mergeConfirmedProjectStatus, preserveUnknownFields, shouldApplyServerResponse, shouldProtectNavigation, stableSerialize } from "./project-editor-state";

const savedMetadata = { title: "Portfolio project", visibility: "PUBLIC" };
const savedBlocks = [{ type: "CASE_HERO", content: { lede: "Saved", nested: { order: ["a", "b"] } } }];

test("editor becomes dirty after a persistent metadata or block change", () => {
  const saved = editorSnapshot(savedMetadata, savedBlocks);
  const changed = editorSnapshot({ ...savedMetadata, title: "Local draft" }, [{ type: "CASE_HERO", content: { lede: "Draft", nested: { order: ["a", "b"] } } }]);

  assert.equal(isEditorDirty(saved, changed), true);
});

test("editor is clean when the confirmed server snapshot matches the editor", () => {
  const serverSnapshot = editorSnapshot(savedMetadata, savedBlocks);

  assert.equal(isEditorDirty(serverSnapshot, editorSnapshot(savedMetadata, savedBlocks)), false);
});

test("save failure leaves the local draft dirty against the last saved snapshot", () => {
  const saved = editorSnapshot(savedMetadata, savedBlocks);
  const localDraft = editorSnapshot({ ...savedMetadata, title: "Unsaved draft" }, savedBlocks);

  assert.equal(isEditorDirty(saved, localDraft), true);
});

test("a server response is not applied after a newer local revision", () => {
  assert.equal(shouldApplyServerResponse(4, 5), false);
  assert.equal(shouldApplyServerResponse(4, 4), true);
});

test("create success with a newer local revision keeps the local draft disposition", () => {
  assert.equal(shouldApplyServerResponse(7, 8), false);
  assert.equal(shouldApplyServerResponse(7, 7), true);
});

test("confirmed publish status updates the server baseline identity and timestamp", () => {
  const current = { id: "project-1", status: "DRAFT", updatedAt: "2026-01-01T00:00:00.000Z" };
  const response = { id: "project-1", status: "PUBLISHED", updatedAt: "2026-01-01T00:01:00.000Z" };

  assert.equal(isConfirmedProjectStatus(response), true);
  assert.deepEqual(mergeConfirmedProjectStatus(current, response), response);
});

test("incomplete or mismatched status responses cannot update the editor baseline", () => {
  const current = { id: "project-1", status: "DRAFT", updatedAt: "2026-01-01T00:00:00.000Z" };

  assert.equal(isConfirmedProjectStatus({ id: "project-1", status: "PUBLISHED" }), false);
  assert.equal(mergeConfirmedProjectStatus(current, { id: "project-2", status: "PUBLISHED", updatedAt: "2026-01-01T00:01:00.000Z" }), null);
});

test("mutation controls block conflicting requests and dirty publish transitions", () => {
  const clean = { dirty: false, saving: false, publishing: false, loadingLatest: false };
  const dirty = { ...clean, dirty: true };
  const saving = { ...clean, saving: true };

  assert.equal(isEditorActionDisabled("save", clean), false);
  assert.equal(isEditorActionDisabled("publish", dirty), true);
  assert.equal(isEditorActionDisabled("archive", dirty), false);
  assert.equal(isEditorActionDisabled("loadLatest", saving), true);
});

test("conflict draft export retains nested local content for explicit recovery", () => {
  const localBlocks = [{ type: "CASE_GALLERY", content: { items: [{ image: "local.png", unknown: { preserved: true } }] } }];
  const saved = editorSnapshot(savedMetadata, savedBlocks);
  const local = editorSnapshot({ ...savedMetadata, title: "Local conflict draft" }, localBlocks);
  const exported = draftJson({ ...savedMetadata, title: "Local conflict draft" }, localBlocks);

  assert.equal(isEditorDirty(saved, local), true);
  assert.match(exported, /Local conflict draft/);
  assert.match(exported, /"preserved": true/);
});

test("snapshot comparison is not affected by object property order", () => {
  assert.equal(stableSerialize({ first: 1, second: { alpha: true, beta: [1, 2] } }), stableSerialize({ second: { beta: [1, 2], alpha: true }, first: 1 }));
});

test("non-persistent UI state does not participate in the snapshot", () => {
  const cleanUi = { saving: false, notice: "" };
  const busyUi = { saving: true, notice: "Saving" };
  const saved = editorSnapshot(savedMetadata, savedBlocks);
  const withUiStateChanged = editorSnapshot(savedMetadata, savedBlocks);

  assert.notDeepEqual(cleanUi, busyUi);
  assert.equal(isEditorDirty(saved, withUiStateChanged), false);
});

test("navigation protection is disabled when the editor is clean", () => {
  assert.equal(shouldProtectNavigation(false), false);
});

test("navigation protection is enabled while a conflict draft remains dirty", () => {
  assert.equal(shouldProtectNavigation(true), true);
});

test("gallery deletion and reorder keep unknown fields with their raw item", () => {
  const first = { number: "01", title: "First", raw: { analyticsId: "first" } };
  const second = { number: "02", title: "Second", raw: { analyticsId: "second" } };
  const reordered = [second, first].map((item) => preserveUnknownFields(item.raw, { number: item.number, title: item.title }));
  const afterDelete = reordered.slice(0, 1);

  assert.equal(afterDelete[0].analyticsId, "second");
  assert.equal(afterDelete[0].title, "Second");
});

test("CASE_FEATURE image fields keep unknown fields with their raw image", () => {
  const image = { url: "feature-b.png", alt: "Feature B", raw: { crop: { focalPoint: "right" } } };
  const payload = preserveUnknownFields(image.raw, { url: image.url, alt: image.alt });

  assert.deepEqual(payload.crop, { focalPoint: "right" });
  assert.equal(payload.url, "feature-b.png");
});
