# Phase 4.5 — Preview Safety and Validation

This phase is maintained on `security/phase-4-5-preview-write-safety`. It is not merged into `main` and is not a Production release.

## Preview environment isolation

The Vercel environment variables for this branch are scoped to the **Preview** target and this Git branch only:

- Landing `VITE_API_URL` points to the branch's backend Preview deployment.
- CMS `API_INTERNAL_URL` and `NEXT_PUBLIC_API_URL` point to that same backend Preview deployment.
- CMS `BACKEND_VERCEL_PROTECTION_BYPASS_SECRET` is server-only and is sent by the CMS API proxy as the Vercel protection-bypass header. It must never be exposed to browser code or response payloads.

The backend Preview deployment uses the existing Production database environment. Therefore, validation must remain read-only against content data.

## Write safety

`CmsPreviewReadOnlyInterceptor` is registered as a global interceptor. After authentication and role guards run, it returns `403 PREVIEW_READ_ONLY` for mutating HTTP methods on `/admin/*` routes whenever `VERCEL_ENV=preview`, unless `ALLOW_PREVIEW_CONTENT_WRITES=true` is explicitly set.

`GET`, `HEAD`, and `OPTIONS` remain available. Public routes, including the protected-project password access endpoint, and authentication endpoints are not blocked by this interceptor.

## Smoke-test checklist

1. Confirm `GET /api/v1/health` and public read endpoints respond from the branch's backend Preview URL.
2. Confirm the CMS's same-origin `/api/v1/*` proxy can reach the protected backend Preview and preserve normal authentication cookies.
3. Confirm an authenticated write request to an admin endpoint returns `403 PREVIEW_READ_ONLY` without changing content.
4. Do not upload, publish, edit, delete, or restore content during Preview validation.
5. Re-pin the branch-scoped API URL variables if the backend Preview deployment URL changes after future backend code commits.
