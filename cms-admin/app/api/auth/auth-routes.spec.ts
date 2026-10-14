import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { setCookieHeaders } from "../../../lib/auth-cookies";
import { POST as login } from "./login/route";
import { POST as logout } from "./logout/route";

const accessCookie = "portfolio_access_token=access-value; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=900";
const refreshCookie = "portfolio_refresh_token=refresh-value; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600";

async function withFetch(response: Response, assertion: (calls: Array<[input: RequestInfo | URL, init?: RequestInit]>) => Promise<void>) {
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

test("login keeps its CMS cookie bridge and forwards Origin and Referer", async () => {
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", accessCookie);
  headers.append("Set-Cookie", refreshCookie);
  await withFetch(new Response(JSON.stringify({ success: true, data: { user: { id: "user-1" } } }), { status: 200, headers }), async (calls) => {
    const request = new NextRequest("https://cms.example/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://cms.example", Referer: "https://cms.example/login" },
      body: JSON.stringify({ email: "editor@example.com", password: "not-a-token" }),
    });
    const response = await login(request);
    assert.equal(response.status, 200);
    assert.equal(setCookieHeaders(response.headers).length, 2);
    const forwarded = new Headers(calls[0][1]?.headers);
    assert.equal(forwarded.get("origin"), "https://cms.example");
    assert.equal(forwarded.get("referer"), "https://cms.example/login");
  });
});

test("logout forwards browser provenance and clears CMS session cookies", async () => {
  await withFetch(new Response(JSON.stringify({ success: true, message: "Signed out.", data: null }), { status: 200 }), async (calls) => {
    const request = new NextRequest("https://cms.example/api/auth/logout", {
      method: "POST",
      headers: { Cookie: "portfolio_refresh_token=refresh-value", Origin: "https://cms.example", Referer: "https://cms.example/projects" },
    });
    const response = await logout(request);
    assert.equal(response.status, 200);
    const cleared = setCookieHeaders(response.headers);
    assert.equal(cleared.length, 2);
    assert.match(cleared.join("\n"), /Max-Age=0/);
    const forwarded = new Headers(calls[0][1]?.headers);
    assert.equal(forwarded.get("origin"), "https://cms.example");
    assert.equal(forwarded.get("referer"), "https://cms.example/projects");
    assert.equal(forwarded.get("cookie"), "portfolio_refresh_token=refresh-value");
  });
});
