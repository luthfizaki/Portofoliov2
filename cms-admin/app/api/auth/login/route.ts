import { NextRequest, NextResponse } from "next/server";
import {
  accessTokenCookieName,
  authCookiesFromBackend,
  refreshTokenCookieName,
  setCmsAuthCookie,
} from "../../../../lib/auth-cookies";
import { apiInternalUrl } from "../../../../lib/api";

export async function POST(request: NextRequest) {
  const credentials = await request.json().catch(() => null);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (origin) headers.Origin = origin;
  if (referer) headers.Referer = referer;

  const backendResponse = await fetch(`${apiInternalUrl}/api/v1/auth/login`, {
    method: "POST",
    headers,
    body: JSON.stringify(credentials),
    cache: "no-store",
  });
  const body = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok || !body?.success) {
    return NextResponse.json(body ?? { success: false }, {
      status: backendResponse.status,
    });
  }

  const authCookies = authCookiesFromBackend(backendResponse.headers);
  const accessCookie = authCookies.get(accessTokenCookieName);
  const refreshCookie = authCookies.get(refreshTokenCookieName);

  if (!accessCookie || !refreshCookie) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication session could not be established.",
      },
      { status: 502 },
    );
  }

  const response = NextResponse.json(body, { status: backendResponse.status });
  setCmsAuthCookie(response, accessCookie);
  setCmsAuthCookie(response, refreshCookie);
  return response;
}
