import assert from "node:assert/strict";
import test from "node:test";
import { shouldBlockCmsPreviewWrite } from "./cms-preview-read-only.interceptor";

const preview = { VERCEL_ENV: "preview" };
const previewWritable = { VERCEL_ENV: "preview", ALLOW_PREVIEW_CONTENT_WRITES: "true" };
const production = { VERCEL_ENV: "production" };

test("Preview blocks every common write method on admin endpoints", () => {
  for (const method of ["POST", "PATCH", "PUT", "DELETE"]) {
    assert.equal(
      shouldBlockCmsPreviewWrite(
        { method, originalUrl: "/api/v1/admin/projects/project-1?source=cms" },
        preview,
      ),
      true,
      method + " should be blocked for CMS admin paths",
    );
  }
});

test("Preview allows read-only HTTP methods on admin endpoints", () => {
  for (const method of ["GET", "HEAD", "OPTIONS"]) {
    assert.equal(
      shouldBlockCmsPreviewWrite({ method, originalUrl: "/api/v1/admin/projects" }, preview),
      false,
      method + " should remain available",
    );
  }
});

test("Preview protection does not block public access or authentication endpoints", () => {
  assert.equal(
    shouldBlockCmsPreviewWrite({ method: "POST", originalUrl: "/api/v1/public/projects/demo/access" }, preview),
    false,
  );
  assert.equal(
    shouldBlockCmsPreviewWrite({ method: "POST", originalUrl: "/api/v1/auth/refresh" }, preview),
    false,
  );
  assert.equal(
    shouldBlockCmsPreviewWrite({ method: "POST", originalUrl: "/api/v1/health" }, preview),
    false,
  );
});

test("Preview writes require the exact explicit opt-in value", () => {
  assert.equal(
    shouldBlockCmsPreviewWrite({ method: "POST", url: "/api/v1/admin/pages/page-1/publish" }, previewWritable),
    false,
  );
  assert.equal(
    shouldBlockCmsPreviewWrite(
      { method: "POST", url: "/api/v1/admin/pages/page-1/publish" },
      { VERCEL_ENV: "preview", ALLOW_PREVIEW_CONTENT_WRITES: "TRUE" },
    ),
    true,
  );
});

test("Production and local environments are unaffected by the Preview guard", () => {
  assert.equal(
    shouldBlockCmsPreviewWrite({ method: "DELETE", url: "/api/v1/admin/projects/1" }, production),
    false,
  );
  assert.equal(
    shouldBlockCmsPreviewWrite({ method: "PATCH", url: "/api/v1/admin/projects/1" }, {}),
    false,
  );
});

test("admin path matching does not catch unrelated paths with similar names", () => {
  assert.equal(
    shouldBlockCmsPreviewWrite({ method: "POST", url: "/api/v1/admin-tools/reindex" }, preview),
    false,
  );
});
