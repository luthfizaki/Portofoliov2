import { ForbiddenException, Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from "@nestjs/common";

type PreviewRequest = {
  method?: string;
  originalUrl?: string;
  url?: string;
};

type PreviewEnvironment = {
  VERCEL_ENV?: string;
  ALLOW_PREVIEW_CONTENT_WRITES?: string;
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * True when a request would mutate CMS content on a Preview deployment.
 * Preview deployments currently inherit Production database environment values,
 * so every admin write is blocked unless an operator explicitly opts in.
 */
export function shouldBlockCmsPreviewWrite(
  request: PreviewRequest,
  environment: PreviewEnvironment = process.env,
): boolean {
  if (
    environment.VERCEL_ENV !== "preview" ||
    environment.ALLOW_PREVIEW_CONTENT_WRITES === "true"
  ) {
    return false;
  }

  const method = (request.method ?? "GET").toUpperCase();
  if (SAFE_METHODS.has(method)) return false;

  const path = (request.originalUrl ?? request.url ?? "").split("?")[0];
  return /(^|\/)admin(?:\/|$)/.test(path);
}

@Injectable()
export class CmsPreviewReadOnlyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<PreviewRequest>();
    if (shouldBlockCmsPreviewWrite(request)) {
      throw new ForbiddenException({
        success: false,
        code: "PREVIEW_READ_ONLY",
        message: "CMS writes are disabled on Preview deployments to protect Production data.",
      });
    }
    return next.handle();
  }
}
