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
    .split(/,(?=\s*portfolio_(?:access|refresh)_token=)/g)
    .map((value) => value.trim())
    .filter(Boolean);
}

function setCookieHeaders(headers: Headers) {
  const headersWithGetter = headers as Headers & {
    getSetCookie?: () => string[];
  };
  const values = headersWithGetter.getSetCookie?.();
  if (values?.length) return values;

  const combined = headers.get("set-cookie");
  return combined ? splitSetCookieHeader(combined) : [];
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
