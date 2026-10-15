import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { setCookieHeaders } from "./lib/auth-cookies";
import { POST } from "./app/api/v1/[...path]/route";

const accessCookie = "portfolio_access_token=rotated-access; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=900";
const refreshCookie = "portfolio_refresh_token=rotated-refresh; Domain=cms.example; Path=/; HttpOnly; Secure; SameSite=None; Expires=Wed, 21 Oct 2026 07:28:00 GMT";

function refreshRequest(headers: HeadersInit = {}) {
  return new NextRequest("https://cms.example/api/v1/auth/refresh", {
    method: "POST",
    headers: {
      Origin: "https://cms.example",
      Referer: "https://cms.example/projects",
      Cookie: "portfolio_refresh_token=previous-refresh",
      ...headers,
    },
  });
}

function context() {
  return { params: Promise.resolve({ path: ["auth", "refresh"] }) };
}

async function withBackendResponse(response: Response, assertion: (calls: Array<[input: RequestInfo | URL, init?: RequestInit]>) => Promise<void>) {
  const originalFetch = globalThis.fetch;
  const calls: Array<[input: RequestInfo | URL, init?: RequestInit]> = [];
  globalThis.fetch = (async (input, init) => {
    calls.push([input, init]);
    return response;
  }) as typeof fetch;
  try {
    await assertion(calls);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function backendResponse(status: number, body: unknown, cookies: string[] = []) {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

test("proxy omits the bypass header when no server-only secret is configured", async () => {
  const previous = process.env.BACKEND_VERCEL_PROTECTION_BYPASS_SECRET;
  delete process.env.BACKEND_VERCEL_PROTECTION_BYPASS_SECRET;
  try {
    await withBackendResponse(
      backendResponse(200, { success: true, data: null }),
      async (calls) => {
        const response = await POST(refreshRequest(), context());
        assert.equal(response.status, 200);
        assert.equal(new Headers(calls[0][1]?.headers).has("x-vercel-protection-bypass"), false);
      },
    );
  } finally {
    if (previous !== undefined) process.env.BACKEND_VERCEL_PROTECTION_BYPASS_SECRET = previous;
  }
});

test("server-side proxy adds the configured Vercel protection bypass header", async () => {
  const previous = process.env.BACKEND_VERCEL_PROTECTION_BYPASS_SECRET;
  process.env.BACKEND_VERCEL_PROTECTION_BYPASS_SECRET = "test-only-protection-token";
  try {
    await withBackendResponse(
      backendResponse(200, { success: true, data: null }),
      async (calls) => {
        const response = await POST(refreshRequest(), context());
        assert.equal(response.status, 200);
        assert.equal(new Headers(calls[0][1]?.headers).get("x-vercel-protection-bypass"), "test-only-protection-token");
        assert.equal((await response.text()).includes("test-only-protection-token"), false);
      },
    );
  } finally {
    if (previous === undefined) delete process.env.BACKEND_VERCEL_PROTECTION_BYPASS_SECRET;
    else process.env.BACKEND_VERCEL_PROTECTION_BYPASS_SECRET = previous;
  }
});

test("refresh proxy forwards one backend auth Set-Cookie unchanged and retains browser provenance", async () => {
  await withBackendResponse(
    backendResponse(200, { success: true, data: { user: { id: "user-1" } } }, [accessCookie]),
    async (calls) => {
      const response = await POST(refreshRequest(), context());
      assert.equal(response.status, 200);
      assert.deepEqual(setCookieHeaders(response.headers), [accessCookie]);
      const body = await response.text();
      assert.equal(body, JSON.stringify({ success: true, data: { user: { id: "user-1" } } }));
      assert.equal(body.includes("rotated-access"), false);
      assert.equal(calls.length, 1);
      const headers = new Headers(calls[0][1]?.headers);
      assert.equal(headers.get("origin"), "https://cms.example");
      assert.equal(headers.get("referer"), "https://cms.example/projects");
      assert.equal(headers.get("cookie"), "portfolio_refresh_token=previous-refresh");
    },
  );
});

test("refresh proxy preserves multiple auth cookies and every backend cookie attribute", async () => {
  await withBackendResponse(
    backendResponse(200, { success: true, data: null }, [accessCookie, refreshCookie]),
    async () => {
      const response = await POST(refreshRequest(), context());
      assert.deepEqual(setCookieHeaders(response.headers), [accessCookie, refreshCookie]);
    },
  );
});

test("refresh proxy does not manufacture cookies when the backend sends none", async () => {
  await withBackendResponse(
    backendResponse(200, { success: true, data: null }),
    async () => {
      const response = await POST(refreshRequest(), context());
      assert.deepEqual(setCookieHeaders(response.headers), []);
    },
  );
});

test("refresh rejection preserves its failure body without forwarding or exposing session tokens", async () => {
  await withBackendResponse(
    backendResponse(401, { success: false, message: "Refresh token is invalid." }),
    async () => {
      const response = await POST(refreshRequest(), context());
      assert.equal(response.status, 401);
      const body = await response.text();
      assert.equal(body, JSON.stringify({ success: false, message: "Refresh token is invalid." }));
      assert.equal(/access_token|refresh_token|rotated-(?:access|refresh)/i.test(body), false);
      assert.deepEqual(setCookieHeaders(response.headers), []);
    },
  );
});
