import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";

type AuthenticatedRequest = Request & { user?: Awaited<ReturnType<AuthService["getCurrentUser"]>> };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : request.cookies?.portfolio_access_token as string | undefined;
    request.user = await this.auth.getCurrentUser(token);
    return true;
  }
}
