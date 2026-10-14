import assert from "node:assert/strict";
import test from "node:test";
import { cookieOptionsFor } from "./auth.controller";

function config(values: Record<string, string | undefined>) {
  return { get: (key: string) => values[key] } as never;
}

test("production cookies are HttpOnly, Secure, and SameSite=Lax by default", () => {
  assert.deepEqual(cookieOptionsFor(config({
    NODE_ENV: "production",
    COOKIE_DOMAIN: "cms.example",
  })), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    domain: "cms.example",
  });
});

test("explicit cross-site cookie mode remains opt-in and always Secure", () => {
  assert.deepEqual(cookieOptionsFor(config({
    NODE_ENV: "production",
    COOKIE_SAME_SITE: "none",
  })), {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
});

test("local development keeps localhost cookies host-only and non-Secure by default", () => {
  assert.deepEqual(cookieOptionsFor(config({
    NODE_ENV: "development",
    COOKIE_DOMAIN: "localhost",
  })), {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
});
