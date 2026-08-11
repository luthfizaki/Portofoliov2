import { NextRequest, NextResponse } from "next/server";
import { apiInternalUrl } from "../../../../lib/api";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const methodsWithoutBody = new Set(["GET", "HEAD"]);

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const targetUrl = new URL(`/api/v1/${path.join("/")}`, apiInternalUrl);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  const cookie = request.headers.get("cookie");

  if (contentType) headers.set("Content-Type", contentType);
  if (accept) headers.set("Accept", accept);
  if (cookie) headers.set("Cookie", cookie);

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: methodsWithoutBody.has(request.method)
      ? undefined
      : await request.arrayBuffer(),
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const responseContentType = backendResponse.headers.get("content-type");
  if (responseContentType) {
    responseHeaders.set("Content-Type", responseContentType);
  }

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
