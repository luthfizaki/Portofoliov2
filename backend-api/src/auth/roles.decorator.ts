import { SetMetadata } from "@nestjs/common";
import { UserRole } from "@prisma/client";

export const ROLES_KEY = "cms:roles";

/** Declares the server-side roles permitted to invoke an admin handler. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
