import { NextRequest, NextResponse } from "next/server";
import { clearCmsAuthCookies } from "../../../../lib/auth-cookies";
import { apiInternalUrl } from "../../../../lib/api";

export async function POST(request: NextRequest) {
  let body: unknown = { success: true, message: "Signed out.", data: null };

  try {
    const backendResponse = await fetch(`${apiInternalUrl}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    body = await backendResponse.json().catch(() => body);
  } catch {
    body = { success: true, message: "Signed out.", data: null };
  }

  const response = NextResponse.json(body);
  clearCmsAuthCookies(response);
  return response;
}
