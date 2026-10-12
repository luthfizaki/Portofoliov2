import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { ExperiencesController } from "../experiences/experiences.controller";
import { MediaController } from "../media/media.controller";
import { PagesController } from "../pages/pages.controller";
import { ProjectsController } from "../projects/projects.controller";
import { SkillsController } from "../skills/skills.controller";
import { TestimonialsController } from "../testimonials/testimonials.controller";
import { ROLES_KEY } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";
import { SessionGuard } from "./session.guard";

type Controller = { prototype: object };
type Endpoint = readonly [Controller, string];

const protectedControllers: Controller[] = [
  ProjectsController,
  PagesController,
  ExperiencesController,
  SkillsController,
  TestimonialsController,
  MediaController,
];

const readEndpoints: Endpoint[] = [
  [ProjectsController, "list"],
  [ProjectsController, "get"],
  [PagesController, "list"],
  [PagesController, "get"],
  [ExperiencesController, "list"],
  [SkillsController, "list"],
  [TestimonialsController, "list"],
];

const editorEndpoints: Endpoint[] = [
  [ProjectsController, "create"],
  [ProjectsController, "update"],
  [ProjectsController, "replaceBlocks"],
  [ProjectsController, "publish"],
  [ProjectsController, "unpublish"],
  [PagesController, "updateSection"],
  [PagesController, "updateSectionVisibility"],
  [PagesController, "publish"],
  [ExperiencesController, "create"],
  [ExperiencesController, "update"],
  [SkillsController, "create"],
  [SkillsController, "update"],
  [TestimonialsController, "create"],
  [TestimonialsController, "update"],
  [MediaController, "upload"],
];

const archiveEndpoints: Endpoint[] = [
  [ProjectsController, "remove"],
  [ProjectsController, "restore"],
  [ExperiencesController, "remove"],
  [SkillsController, "remove"],
  [TestimonialsController, "remove"],
];

const rolesGuard = new RolesGuard(new Reflector());

function contextFor(controller: Controller, method: string, role?: unknown) {
  const handler = (controller.prototype as Record<string, unknown>)[method] as Function;
  return {
    getClass: () => controller,
    getHandler: () => handler,
    switchToHttp: () => ({ getRequest: () => ({ user: role === undefined ? undefined : { role } }) }),
  } as never;
}

function assertAllowed(endpoint: Endpoint, role: UserRole) {
  assert.equal(rolesGuard.canActivate(contextFor(...endpoint, role)), true);
}

function assertForbidden(endpoint: Endpoint, role: unknown) {
  assert.throws(
    () => rolesGuard.canActivate(contextFor(...endpoint, role)),
    (error: unknown) => error instanceof ForbiddenException && error.getStatus() === 403,
  );
}

test("every protected CMS controller applies both authentication and role guards", () => {
  for (const controller of protectedControllers) {
    const guards = Reflect.getMetadata(GUARDS_METADATA, controller) as unknown[] | undefined;
    assert.ok(guards?.includes(SessionGuard));
    assert.ok(guards?.includes(RolesGuard));
  }
});

test("every protected CMS endpoint declares an explicit role policy", () => {
  for (const controller of protectedControllers) {
    for (const method of Object.getOwnPropertyNames(controller.prototype)) {
      if (method === "constructor") continue;
      const handler = (controller.prototype as Record<string, unknown>)[method];
      if (typeof handler !== "function") continue;
      const roles = Reflect.getMetadata(ROLES_KEY, handler) as UserRole[] | undefined;
      assert.ok(roles?.length, `${(controller as Function).name}.${method} is missing a role policy`);
    }
  }
});

test("super admins can access every protected CMS endpoint", () => {
  for (const endpoint of [...readEndpoints, ...editorEndpoints, ...archiveEndpoints]) {
    assertAllowed(endpoint, UserRole.SUPER_ADMIN);
  }
});

test("editors can manage content, including the existing soft archive and restore operations", () => {
  for (const endpoint of [...readEndpoints, ...editorEndpoints, ...archiveEndpoints]) {
    assertAllowed(endpoint, UserRole.EDITOR);
  }
});

test("viewers have read-only CMS access and cannot mutate, publish, archive, restore, or upload", () => {
  for (const endpoint of readEndpoints) {
    assertAllowed(endpoint, UserRole.VIEWER);
  }
  for (const endpoint of [...editorEndpoints, ...archiveEndpoints]) {
    assertForbidden(endpoint, UserRole.VIEWER);
  }
});

test("missing or malformed roles fail closed", () => {
  assert.throws(
    () => rolesGuard.canActivate(contextFor(ProjectsController, "list")),
    (error: unknown) => error instanceof UnauthorizedException && error.getStatus() === 401,
  );
  assertForbidden([ProjectsController, "create"], "ADMIN");
  assertForbidden([ProjectsController, "create"], "");
});

test("unauthenticated requests are rejected by the session guard before authorization", async () => {
  const auth = {
    getCurrentUser: async () => {
      throw new UnauthorizedException({ success: false, code: "UNAUTHORIZED" });
    },
  };
  const sessionGuard = new SessionGuard(auth as never);
  const context = {
    switchToHttp: () => ({ getRequest: () => ({ headers: {}, cookies: {} }) }),
  } as never;

  await assert.rejects(
    () => sessionGuard.canActivate(context),
    (error: unknown) => error instanceof UnauthorizedException && error.getStatus() === 401,
  );
});
