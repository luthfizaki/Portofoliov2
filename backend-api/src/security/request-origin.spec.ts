import assert from "node:assert/strict";
import test from "node:test";
import { allowedCorsOrigins } from "../server";
import {
  isAllowedOrigin,
  requestOriginGuard,
} from "./request-origin";

function config(values: Record<string, string | undefined>) {
  return { get: (key: string) => values[key] } as never;
}

function request(overrides: Partial<{
  method: string;
  origin: string;
  referer: string;
  cookies: Record<string, string>;
  authorization: string;
}> = {}) {
  const headers = {
    ...(overrides.authorization ? { authorization: overrides.authorization } : {}),
  };
  return {
    method: overrides.method ?? "POST",
    cookies: overrides.cookies,
    headers,
    get(name: string) {
      if (name.toLowerCase() === "origin") return overrides.origin;
      if (name.toLowerCase() === "referer") return overrides.referer;
      return undefined;
    },
  } as never;
}

type TestResponse = {
  result: { statusCode: number; body: unknown };
  status(code: number): TestResponse;
  json(body: unknown): TestResponse;
};

function response(): TestResponse {
  const result = { statusCode: 200, body: undefined as unknown };
  return {
    result,
    status(code: number) {
      result.statusCode = code;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return this;
    },
  };
}

test("production CORS uses configured origins and excludes local origins", () => {
  const origins = allowedCorsOrigins(config({
    NODE_ENV: "production",
    PORTFOLIO_URL: "https://portfolio.example",
    CMS_URL: "https://cms.example",
    CORS_ORIGINS: "http://localhost:3001,https://portfolio.example",
  }));

  assert.deepEqual(origins, ["https://portfolio.example", "https://cms.example"]);
  assert.equal(isAllowedOrigin("https://portfolio.example", origins), true);
  assert.equal(isAllowedOrigin("https://attacker.example", origins), false);
});

test("production CORS fails closed when no explicit origin is configured", () => {
  assert.throws(
    () => allowedCorsOrigins(config({ NODE_ENV: "production" })),
    /explicit origin allowlist/,
  );
});

test("development CORS retains only the documented local workflow origins", () => {
  const origins = allowedCorsOrigins(config({ NODE_ENV: "development" }));
  assert.equal(origins.includes("http://localhost:3001"), true);
  assert.equal(origins.includes("http://127.0.0.1:4173"), true);
  assert.equal(origins.includes("*"), false);
});

test("unsafe cookie requests from an untrusted origin are rejected", () => {
  const guard = requestOriginGuard(["https://cms.example"]);
  const res = response();
  let called = false;

  guard(
    request({ origin: "https://attacker.example", cookies: { portfolio_access_token: "token" } }),
    res as never,
    () => { called = true; },
  );

  assert.equal(called, false);
  assert.equal(res.result.statusCode, 403);
  assert.deepEqual(res.result.body, {
    success: false,
    code: "CSRF_ORIGIN_DENIED",
    message: "The request origin is not allowed.",
  });
});

test("allowed CMS origin and same-origin referer are accepted", () => {
  const guard = requestOriginGuard(["https://cms.example"]);
  const res = response();
  let called = false;

  guard(
    request({
      origin: "https://cms.example",
      referer: "https://cms.example/projects/1",
      cookies: { portfolio_access_token: "token" },
    }),
    res as never,
    () => { called = true; },
  );

  assert.equal(called, true);
  assert.equal(res.result.statusCode, 200);
});

test("cookie mutation without browser provenance is rejected", () => {
  const guard = requestOriginGuard(["https://cms.example"]);
  const res = response();
  let called = false;

  guard(
    request({ cookies: { portfolio_access_token: "token" } }),
    res as never,
    () => { called = true; },
  );

  assert.equal(called, false);
  assert.equal(res.result.statusCode, 403);
  assert.deepEqual(res.result.body, {
    success: false,
    code: "CSRF_ORIGIN_REQUIRED",
    message: "The request origin is not allowed.",
  });
});

test("bearer server-to-server mutations remain compatible without browser headers", () => {
  const guard = requestOriginGuard(["https://cms.example"]);
  const res = response();
  let called = false;

  guard(
    request({ authorization: "Bearer server-token" }),
    res as never,
    () => { called = true; },
  );

  assert.equal(called, true);
});
