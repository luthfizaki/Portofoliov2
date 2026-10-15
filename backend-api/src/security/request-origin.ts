import type { NextFunction, Request, Response } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const LOCAL_DEVELOPMENT_ORIGINS = [
  "http://localhost:3100",
  "http://127.0.0.1:3100",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
] as const;

export function normalizeOrigin(value: string) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function isAllowedOrigin(origin: string | undefined, allowedOrigins: readonly string[]) {
  if (!origin) return false;
  const normalized = normalizeOrigin(origin);
  return normalized !== null && allowedOrigins.includes(normalized);
}

function originFromReferer(referer: string | undefined) {
  if (!referer) return null;
  try {
    const parsed = new URL(referer);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function deny(response: Response, code: "CSRF_ORIGIN_DENIED" | "CSRF_ORIGIN_REQUIRED") {
  response.status(403).json({
    success: false,
    code,
    message: "The request origin is not allowed.",
  });
}

/**
 * Origin validation is used as the CSRF boundary for cookie-authenticated
 * unsafe requests. Requests without browser provenance remain available to
 * bearer-token/server-to-server clients, while cookie requests must include
 * an allowed Origin or Referer.
 */
export function requestOriginGuard(allowedOrigins: readonly string[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      next();
      return;
    }

    const originHeader = request.get("origin")?.trim();
    const refererHeader = request.get("referer")?.trim();
    const refererOrigin = originFromReferer(refererHeader);

    if (originHeader && !isAllowedOrigin(originHeader, allowedOrigins)) {
      deny(response, "CSRF_ORIGIN_DENIED");
      return;
    }

    if (refererHeader && !refererOrigin) {
      deny(response, "CSRF_ORIGIN_DENIED");
      return;
    }

    if (refererOrigin && !isAllowedOrigin(refererOrigin, allowedOrigins)) {
      deny(response, "CSRF_ORIGIN_DENIED");
      return;
    }

    if (
      originHeader &&
      refererOrigin &&
      normalizeOrigin(originHeader) !== refererOrigin
    ) {
      deny(response, "CSRF_ORIGIN_DENIED");
      return;
    }

    const cookies = request.cookies as Record<string, string> | undefined;
    const hasCookieCredentials = Boolean(
      cookies?.portfolio_access_token || cookies?.portfolio_refresh_token,
    );
    const hasBearerCredentials = request.headers.authorization?.startsWith("Bearer ");

    if (!originHeader && !refererOrigin && hasCookieCredentials && !hasBearerCredentials) {
      deny(response, "CSRF_ORIGIN_REQUIRED");
      return;
    }

    next();
  };
}
