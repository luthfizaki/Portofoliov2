import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { ROLES_KEY } from "./roles.decorator";
import type { AuthenticatedRequest } from "./session.guard";

const knownRoles = new Set<string>(Object.values(UserRole));

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Admin handlers must opt in explicitly. This prevents an unannotated
    // mutation endpoint from becoming available to every authenticated user.
    if (!roles?.length) {
      throw new ForbiddenException({
        success: false,
        code: "ROLE_NOT_CONFIGURED",
        message: "This operation is not authorized.",
      });
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role: unknown = request.user?.role;

    if (role === undefined || role === null) {
      throw new UnauthorizedException({
        success: false,
        code: "UNAUTHORIZED",
        message: "Authentication is required.",
      });
    }

    if (typeof role !== "string" || !knownRoles.has(role)) {
      throw new ForbiddenException({
        success: false,
        code: "INVALID_ROLE",
        message: "This operation is not authorized.",
      });
    }

    if (!roles.includes(role as UserRole)) {
      throw new ForbiddenException({
        success: false,
        code: "FORBIDDEN",
        message: "You do not have permission to perform this operation.",
      });
    }

    return true;
  }
}
