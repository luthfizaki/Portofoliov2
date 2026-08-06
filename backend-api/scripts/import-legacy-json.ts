import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const legacyDataPath = join(process.cwd(), "..", "legacy-cms-backup", "data");
type DatabaseClient = PrismaClient | Prisma.TransactionClient;

const sectionFiles = [
  "hero",
  "about",
  "experience",
  "selected-work",
  "flagship-products",
  "creative-practice",
  "project-archive",
  "how-i-work",
  "capabilities-tools",
  "collaboration-testimonials",
  "contact-final-statement",
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function readLegacyJson<T>(name: string): Promise<T> {
  const raw = await readFile(join(legacyDataPath, `${name}.json`), "utf8");
  return JSON.parse(raw) as T;
}

async function importHomepage(database: DatabaseClient) {
  const homepage = await database.page.upsert({
    where: { slug: "home" },
    update: { name: "Homepage", isHomepage: true, status: "PUBLISHED", publishedAt: new Date() },
    create: { name: "Homepage", slug: "home", isHomepage: true, status: "PUBLISHED", publishedAt: new Date() },
  });

  for (const [sortOrder, type] of sectionFiles.entries()) {
    const content = await readLegacyJson<Record<string, unknown>>(type);
    await database.pageSection.upsert({
      where: { id: `legacy-${type}` },
      update: { content: content as Prisma.InputJsonValue, sortOrder, type },
      create: {
        id: `legacy-${type}`,
        pageId: homepage.id,
        type,
        name: type,
        content: content as Prisma.InputJsonValue,
        sortOrder,
      },
    });
  }
}

async function importProjects(database: DatabaseClient) {
  const flagship = await readLegacyJson<{
    projects: Array<{
      titleLines: string[];
      description?: string;
      role?: string;
      platform?: string;
      scope?: string;
      visualUrl?: string;
      visualAlt?: string;
      featured?: boolean;
    }>;
  }>("flagship-products");

  for (const [sortOrder, item] of flagship.projects.entries()) {
    const title = item.titleLines.join(" ");
    const slug = slugify(title);
    await database.project.upsert({
      where: { slug },
      update: {
        title,
        excerpt: item.description ?? null,
        role: item.role ?? null,
        platform: item.platform ?? null,
        services: item.scope ? item.scope.split(", ") : [],
        featured: Boolean(item.featured),
        sortOrder,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      create: {
        title,
        slug,
        excerpt: item.description ?? null,
        role: item.role ?? null,
        platform: item.platform ?? null,
        services: item.scope ? item.scope.split(", ") : [],
        tools: [],
        featured: Boolean(item.featured),
        sortOrder,
        status: "PUBLISHED",
        publishedAt: new Date(),
        blocks: {
          create: {
            type: "HERO",
            sortOrder: 0,
            content: {
              imageUrl: item.visualUrl ?? null,
              imageAlt: item.visualAlt ?? null,
            },
          },
        },
      },
    });
  }
}

async function main() {
  await prisma.$transaction(async (transaction) => {
    await importHomepage(transaction);
    await importProjects(transaction);
  });
}

main().finally(async () => {
  await prisma.$disconnect();
});
