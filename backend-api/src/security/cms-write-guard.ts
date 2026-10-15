import { ForbiddenException } from "@nestjs/common";

/**
 * Preview deployments currently inherit the production database environment.
 * Keep content mutations disabled there unless an operator explicitly opts in.
 */
export function assertCmsContentWritesAllowed(): void {
  if (process.env.VERCEL_ENV === "preview" && process.env.ALLOW_PREVIEW_CONTENT_WRITES !== "true") {
    throw new ForbiddenException({
      success: false,
      code: "PREVIEW_READ_ONLY",
      message: "CMS content writes are disabled on Preview deployments to protect production data.",
    });
  }
}
