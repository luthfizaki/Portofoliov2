import type { NextResponse } from "next/server";

export const accessTokenCookieName = "portfolio_access_token";
export const refreshTokenCookieName = "portfolio_refresh_token";

type AuthCookieName =
  | typeof accessTokenCookieName
  | typeof refreshTokenCookieName;

type ParsedAuthCookie = {
  name: AuthCookieName;
  value: string;
  maxAge?: number;
};

function splitSetCookieHeader(header: string) {
  return header
    // `Expires` contains a comma, so only split where the following value
    // looks like the beginning of another cookie-pair.
    .split(/,(?=\s*[^=;,\s]+=[^;,\s]*)/g)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function setCookieHeaders(headers: Headers) {
  const headersWithGetter = headers as Headers & {
    getSetCookie?: () => string[];
  };
  const values = headersWithGetter.getSetCookie?.();
  if (values?.length) return values;

  const combined = headers.get("set-cookie");
  return combined ? splitSetCookieHeader(combined) : [];
}

function authCookieName(header: string) {
  const separatorIndex = header.indexOf("=");
  return separatorIndex === -1 ? "" : header.slice(0, separatorIndex).trim();
}

/**
 * Copies only the CMS session cookies as individual Set-Cookie fields. The
 * strings are forwarded unchanged so attributes from the backend (including
 * HttpOnly, Secure, SameSite, Path, Expires, Max-Age, and Domain) survive.
 */
export function appendBackendAuthCookies(responseHeaders: Headers, backendHeaders: Headers) {
  for (const header of setCookieHeaders(backendHeaders)) {
    const name = authCookieName(header);
    if (name === accessTokenCookieName || name === refreshTokenCookieName) {
      responseHeaders.append("Set-Cookie", header);
    }
  }
}

export function authCookiesFromBackend(headers: Headers) {
  const cookies = new Map<AuthCookieName, ParsedAuthCookie>();

  for (const header of setCookieHeaders(headers)) {
    const parts = header.split(";").map((part) => part.trim());
    const [pair, ...attributes] = parts;
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) continue;

    const name = pair.slice(0, separatorIndex) as AuthCookieName;
    if (name !== accessTokenCookieName && name !== refreshTokenCookieName) {
      continue;
    }

    const maxAgeAttribute = attributes.find((attribute) =>
      attribute.toLowerCase().startsWith("max-age="),
    );
    const parsedMaxAge = maxAgeAttribute
      ? Number.parseInt(maxAgeAttribute.slice("max-age=".length), 10)
      : undefined;
    const maxAge =
      parsedMaxAge !== undefined &&
      Number.isFinite(parsedMaxAge) &&
      parsedMaxAge > 0
        ? parsedMaxAge
        : undefined;

    cookies.set(name, {
      name,
      value: pair.slice(separatorIndex + 1),
      ...(maxAge !== undefined ? { maxAge } : {}),
    });
  }

  return cookies;
}

export function setCmsAuthCookie(
  response: NextResponse,
  cookie: ParsedAuthCookie,
) {
  response.cookies.set(cookie.name, cookie.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(cookie.maxAge ? { maxAge: cookie.maxAge } : {}),
  });
}

export function clearCmsAuthCookies(response: NextResponse) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  response.cookies.set(accessTokenCookieName, "", options);
  response.cookies.set(refreshTokenCookieName, "", options);
}
