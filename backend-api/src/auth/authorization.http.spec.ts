import "reflect-metadata";
import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import type { AddressInfo } from "node:net";
import { ConfigService } from "@nestjs/config";
import { INestApplication } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { RolesGuard } from "./roles.guard";
import { SessionGuard } from "./session.guard";
import { TokenService } from "./token.service";
import { PrismaService } from "../database/prisma.service";
import { ExperiencesController } from "../experiences/experiences.controller";
import { ExperiencesService } from "../experiences/experiences.service";
import { MediaController } from "../media/media.controller";
import { MediaService } from "../media/media.service";
import { PagesController } from "../pages/pages.controller";
import { PagesService } from "../pages/pages.service";
import { ProjectsController } from "../projects/projects.controller";
import { ProjectsService } from "../projects/projects.service";
import { SkillsController } from "../skills/skills.controller";
import { SkillsService } from "../skills/skills.service";
import { TestimonialsController } from "../testimonials/testimonials.controller";
import { TestimonialsService } from "../testimonials/testimonials.service";

type TestRole = "super-admin" | "editor" | "viewer" | "null-role" | "unknown-role";

const usersById = new Map([
  ["super-admin", { id: "super-admin", name: "Super Admin", email: "super@example.test", role: "SUPER_ADMIN", isActive: true }],
  ["editor", { id: "editor", name: "Editor", email: "editor@example.test", role: "EDITOR", isActive: true }],
  ["viewer", { id: "viewer", name: "Viewer", email: "viewer@example.test", role: "VIEWER", isActive: true }],
  ["null-role", { id: "null-role", name: "No Role", email: "none@example.test", role: null, isActive: true }],
  ["unknown-role", { id: "unknown-role", name: "Unknown", email: "unknown@example.test", role: "ADMIN", isActive: true }],
]);

const projects = {
  list: (limit?: string) => ({ operation: "projects.list", limit }),
  get: (id: string) => ({ operation: "projects.get", id }),
  create: (dto: unknown) => ({ operation: "projects.create", dto }),
  update: (id: string, dto: unknown) => ({ operation: "projects.update", id, dto }),
  replaceBlocks: (id: string, blocks: unknown) => ({ operation: "projects.replaceBlocks", id, blocks }),
  publish: (id: string) => ({ operation: "projects.publish", id }),
  unpublish: (id: string) => ({ operation: "projects.unpublish", id }),
  remove: (id: string) => ({ operation: "projects.remove", id }),
  restore: (id: string) => ({ operation: "projects.restore", id }),
};

const pages = {
  list: () => ({ operation: "pages.list" }),
  get: (id: string) => ({ operation: "pages.get", id }),
  updateSection: (id: string, content: unknown) => ({ operation: "pages.updateSection", id, content }),
  updateSectionVisibility: (id: string, isVisible: boolean) => ({ operation: "pages.updateSectionVisibility", id, isVisible }),
  publish: (id: string) => ({ operation: "pages.publish", id }),
};

const experiences = {
  list: () => ({ operation: "experiences.list" }),
  create: (dto: unknown) => ({ operation: "experiences.create", dto }),
  update: (id: string, dto: unknown) => ({ operation: "experiences.update", id, dto }),
  remove: (id: string) => ({ operation: "experiences.remove", id }),
};

const skills = {
  list: () => ({ operation: "skills.list" }),
  create: (dto: unknown) => ({ operation: "skills.create", dto }),
  update: (id: string, dto: unknown) => ({ operation: "skills.update", id, dto }),
  remove: (id: string) => ({ operation: "skills.remove", id }),
};

const testimonials = {
  list: () => ({ operation: "testimonials.list" }),
  create: (dto: unknown) => ({ operation: "testimonials.create", dto }),
  update: (id: string, dto: unknown) => ({ operation: "testimonials.update", id, dto }),
  remove: (id: string) => ({ operation: "testimonials.remove", id }),
};

const media = {
  store: (file: { originalname: string; mimetype: string; size: number }) => ({
    operation: "media.store",
    filename: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  }),
};

let app: INestApplication;
let baseUrl: string;
let tokens: Record<TestRole, string>;

before(async () => {
  const config = { get: (key: string) => key === "JWT_ACCESS_SECRET" ? "authorization-http-test-secret" : undefined };
  const prisma = { user: { findUnique: async ({ where }: { where: { id: string } }) => usersById.get(where.id) } };
  const tokenService = new TokenService(config as never);
  const authService = new AuthService(prisma as never, tokenService);
  const sessionGuard = new SessionGuard(authService);
  const rolesGuard = new RolesGuard(new Reflector());
  const testingModule = Test.createTestingModule({
    controllers: [ProjectsController, PagesController, ExperiencesController, SkillsController, TestimonialsController, MediaController],
    providers: [
      { provide: ConfigService, useValue: config },
      { provide: PrismaService, useValue: prisma },
      { provide: TokenService, useValue: tokenService },
      { provide: AuthService, useValue: authService },
      { provide: SessionGuard, useValue: sessionGuard },
      { provide: RolesGuard, useValue: rolesGuard },
      { provide: ProjectsService, useValue: projects },
      { provide: PagesService, useValue: pages },
      { provide: ExperiencesService, useValue: experiences },
      { provide: SkillsService, useValue: skills },
      { provide: TestimonialsService, useValue: testimonials },
      { provide: MediaService, useValue: media },
    ],
  });
  const module = await testingModule.compile();

  app = module.createNestApplication();
  app.setGlobalPrefix("api/v1");
  await app.init();
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;

  tokens = Object.fromEntries(
    [...usersById.keys()].map((id) => [id, tokenService.createAccessToken({ sub: id, email: `${id}@example.test`, role: "VIEWER" })]),
  ) as Record<TestRole, string>;
});

after(async () => {
  await app.close();
});

function authorizationHeaders(role?: TestRole): Record<string, string> {
  return role ? { authorization: `Bearer ${tokens[role]}` } : {};
}

async function jsonRequest(path: string, init: RequestInit = {}, role?: TestRole) {
  const requestHeaders = new Headers(init.headers);
  requestHeaders.set("content-type", "application/json");
  for (const [name, value] of Object.entries(authorizationHeaders(role))) requestHeaders.set(name, value);
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: requestHeaders,
  });
}

async function assertStatus(response: Response, status: number) {
  if (response.status !== status) assert.fail(`${await response.text()}\nExpected HTTP ${status}; received ${response.status}.`);
}

test("projects enforce unauthenticated, viewer, editor publish, archive, and restore HTTP policies", async () => {
  await assertStatus(await jsonRequest("/api/v1/admin/projects"), 401);

  const read = await jsonRequest("/api/v1/admin/projects/project-1", {}, "viewer");
  await assertStatus(read, 200);
  assert.deepEqual(await read.json(), { operation: "projects.get", id: "project-1" });

  await assertStatus(
    await jsonRequest("/api/v1/admin/projects", { method: "POST", body: JSON.stringify({ title: "Blocked" }) }, "viewer"),
    403,
  );

  const publish = await jsonRequest("/api/v1/admin/projects/project-1/publish", { method: "POST" }, "editor");
  await assertStatus(publish, 201);
  assert.deepEqual(await publish.json(), { operation: "projects.publish", id: "project-1" });
  await assertStatus(await jsonRequest("/api/v1/admin/projects/project-1", { method: "DELETE" }, "editor"), 200);
  await assertStatus(await jsonRequest("/api/v1/admin/projects/project-1/restore", { method: "POST" }, "editor"), 201);
});

test("pages use their effective section route and let editors publish while viewers remain read-only", async () => {
  await assertStatus(await jsonRequest("/api/v1/admin/pages", {}, "viewer"), 200);
  await assertStatus(
    await jsonRequest("/api/v1/admin/pages/sections/hero", { method: "PATCH", body: JSON.stringify({ content: { title: "Blocked" } }) }, "viewer"),
    403,
  );

  const update = await jsonRequest(
    "/api/v1/admin/pages/sections/hero",
    { method: "PATCH", body: JSON.stringify({ content: { title: "Updated" } }) },
    "editor",
  );
  await assertStatus(update, 200);
  assert.deepEqual(await update.json(), { operation: "pages.updateSection", id: "hero", content: { title: "Updated" } });
  await assertStatus(await jsonRequest("/api/v1/admin/pages/home/publish", { method: "POST" }, "editor"), 201);
});

test("experience, skill, and testimonial routes enforce representative reader and writer policies", async () => {
  await assertStatus(await jsonRequest("/api/v1/admin/experiences", {}, "viewer"), 200);
  await assertStatus(
    await jsonRequest(
      "/api/v1/admin/experiences",
      { method: "POST", body: JSON.stringify({ year: "2026", role: "Designer", company: "Example", contribution: "Built it" }) },
      "editor",
    ),
    201,
  );

  await assertStatus(await jsonRequest("/api/v1/admin/skills", {}, "viewer"), 200);
  await assertStatus(
    await jsonRequest("/api/v1/admin/skills/skill-1", { method: "PATCH", body: JSON.stringify({ name: "Blocked" }) }, "viewer"),
    403,
  );
  await assertStatus(
    await jsonRequest("/api/v1/admin/skills/skill-1", { method: "PATCH", body: JSON.stringify({ name: "TypeScript" }) }, "editor"),
    200,
  );

  await assertStatus(await jsonRequest("/api/v1/admin/testimonials", {}, "viewer"), 200);
  await assertStatus(
    await jsonRequest("/api/v1/admin/testimonials", { method: "POST", body: JSON.stringify({ name: "Client", quote: "Great work" }) }, "super-admin"),
    201,
  );
  await assertStatus(await jsonRequest("/api/v1/admin/testimonials/testimonial-1", { method: "DELETE" }, "viewer"), 403);
});

test("media upload uses HTTP authorization before invoking the mocked storage service", async () => {
  const viewerForm = new FormData();
  viewerForm.append("file", new Blob(["viewer upload"], { type: "text/plain" }), "viewer.txt");
  await assertStatus(
    await fetch(`${baseUrl}/api/v1/admin/media/upload`, { method: "POST", headers: authorizationHeaders("viewer"), body: viewerForm }),
    403,
  );

  const editorForm = new FormData();
  editorForm.append("file", new Blob(["editor upload"], { type: "text/plain" }), "editor.txt");
  const upload = await fetch(`${baseUrl}/api/v1/admin/media/upload`, { method: "POST", headers: authorizationHeaders("editor"), body: editorForm });
  await assertStatus(upload, 201);
  assert.deepEqual(await upload.json(), { operation: "media.store", filename: "editor.txt", mimetype: "text/plain", size: 13 });
});

test("missing, malformed, invalidly signed, null, and unknown roles fail closed over HTTP", async () => {
  await assertStatus(await jsonRequest("/api/v1/admin/projects"), 401);
  await assertStatus(
    await fetch(`${baseUrl}/api/v1/admin/projects`, { headers: { authorization: "Bearer not-a-jwt" } }),
    401,
  );

  const validViewerToken = tokens.viewer;
  const alteredToken = `${validViewerToken.slice(0, -1)}${validViewerToken.endsWith("a") ? "b" : "a"}`;
  await assertStatus(
    await fetch(`${baseUrl}/api/v1/admin/projects`, { headers: { authorization: `Bearer ${alteredToken}` } }),
    401,
  );
  await assertStatus(await jsonRequest("/api/v1/admin/projects", {}, "null-role"), 401);
  await assertStatus(await jsonRequest("/api/v1/admin/projects", {}, "unknown-role"), 403);
});
