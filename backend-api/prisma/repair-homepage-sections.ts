import { ContentStatus, Prisma, PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

type PageSectionRow = {
  id: string;
  pageId: string;
  type: string;
  name: string | null;
  content: Prisma.JsonValue;
  sortOrder: number;
  isVisible: boolean;
  layoutVariant: string | null;
  background: string | null;
  animation: string | null;
};

type SectionSource = {
  source: "legacy-page" | "canonical-page" | "skills-table";
  oldPageId: string | null;
  oldType: string;
  section: PageSectionRow | null;
  content: Prisma.JsonValue;
  name: string | null;
  isVisible: boolean;
  layoutVariant: string | null;
  background: string | null;
  animation: string | null;
};

type RepairPlanItem = {
  desiredType: string;
  desiredSortOrder: number;
  oldType: string | null;
  oldPageId: string | null;
  newPageId: string;
  existingSectionId: string | null;
  source: SectionSource | null;
  action: "create" | "update" | "skip";
  reason: string;
};

const repoRoot = resolve(__dirname, "..", "..");
const backendRoot = resolve(__dirname, "..");

loadEnvFile(join(backendRoot, ".env"));
loadEnvFile(join(repoRoot, ".env"));

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

const desiredSections = [
  { legacyType: "HERO", type: "hero", name: "Hero" },
  { legacyType: "ABOUT", type: "about", name: "About" },
  { legacyType: "EXPERIENCE", type: "experience", name: "Experience" },
  { legacyType: "SELECTED_WORK", type: "selected-work", name: "Selected Work" },
  { legacyType: "FLAGSHIP_PRODUCTS", type: "flagship-products", name: "Flagship Products" },
  { legacyType: "CREATIVE_PRACTICE", type: "creative-practice", name: "Creative Practice" },
  { legacyType: "PROJECT_ARCHIVE", type: "project-archive", name: "Project Archive" },
  { legacyType: null, type: "skills", name: "Skills" },
  { legacyType: "HOW_I_WORK", type: "how-i-work", name: "How I Work" },
  { legacyType: "CAPABILITIES_TOOLS", type: "capabilities-tools", name: "Capabilities Tools" },
  { legacyType: "TESTIMONIALS", type: "collaboration-testimonials", name: "Collaboration Testimonials" },
  { legacyType: "CONTACT", type: "contact-final-statement", name: "Contact Final Statement" },
] as const;

const skillSectionMeta = {
  sectionNumber: "07",
  sectionLabel: "SKILLS",
  headlineLines: ["SKILLS THAT TURN", "IDEAS INTO PRODUCTS."],
  intro:
    "A practical view of the design, product, research, and implementation skills I use to move work from messy requirements into shipped digital experiences.",
  summaryLabel: "CAPABILITY MAP",
  summary:
    "Grouped by how the work usually happens: discovery, interface design, systems, and implementation collaboration.",
  footerNote:
    "SKILL DATA IS MANAGED FROM CMS AND RENDERED DIRECTLY ON THE FRONTEND.",
};

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function isObject(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isEmptyContent(value: Prisma.JsonValue) {
  if (value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  if (typeof value === "string") return value.trim().length === 0;
  return false;
}

function richnessScore(value: Prisma.JsonValue): number {
  if (value === null) return 0;
  if (Array.isArray(value)) {
    let score = value.length;
    for (const item of value) {
      score += richnessScore(item);
    }
    return score;
  }
  if (isObject(value)) {
    let score = Object.keys(value).length;
    for (const item of Object.values(value as Record<string, Prisma.JsonValue>)) {
      score += richnessScore(item);
    }
    return score;
  }
  if (typeof value === "string") return value.trim().length ? 1 : 0;
  return 1;
}

function contentKeys(value: Prisma.JsonValue) {
  return isObject(value) ? Object.keys(value) : [];
}

async function buildSkillsContent(): Promise<Prisma.JsonValue | null> {
  const items = await prisma.skill.findMany({
    where: { status: ContentStatus.PUBLISHED },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      name: true,
      category: true,
      description: true,
      level: true,
      tools: true,
      featured: true,
    },
  });

  if (!items.length) return null;

  const categories = [...new Set(items.map((item) => item.category))].map(
    (category) => ({
      name: category,
      count: items.filter((item) => item.category === category).length,
    }),
  );

  return { ...skillSectionMeta, categories, items };
}

async function getPages() {
  const [legacyPage, canonicalPage] = await Promise.all([
    prisma.page.findUnique({
      where: { slug: "/" },
      include: { sections: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.page.findUnique({
      where: { slug: "home" },
      include: { sections: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  return { legacyPage, canonicalPage };
}

async function buildPlan(): Promise<{
  legacyPage: Awaited<ReturnType<typeof getPages>>["legacyPage"];
  canonicalPage: Awaited<ReturnType<typeof getPages>>["canonicalPage"];
  items: RepairPlanItem[];
}> {
  const { legacyPage, canonicalPage } = await getPages();
  const skillsContent = await buildSkillsContent();

  const legacySections = new Map(
    (legacyPage?.sections ?? []).map((section) => [section.type, section]),
  );
  const canonicalPageId = canonicalPage?.id ?? "(create home page on apply)";
  const canonicalSections = new Map(
    (canonicalPage?.sections ?? []).map((section) => [section.type, section]),
  );

  const items = desiredSections.map<RepairPlanItem>((desired, sortOrder) => {
    const existing = canonicalSections.get(desired.type) ?? null;
    const legacy =
      desired.legacyType ? legacySections.get(desired.legacyType) ?? null : null;
    const canonicalLegacy =
      desired.legacyType ? canonicalSections.get(desired.legacyType) ?? null : null;

    let source: SectionSource | null = null;
    if (legacy) {
      source = {
        source: "legacy-page",
        oldPageId: legacy.pageId,
        oldType: legacy.type,
        section: legacy,
        content: legacy.content,
        name: legacy.name,
        isVisible: legacy.isVisible,
        layoutVariant: legacy.layoutVariant,
        background: legacy.background,
        animation: legacy.animation,
      };
    } else if (canonicalLegacy) {
      source = {
        source: "canonical-page",
        oldPageId: canonicalLegacy.pageId,
        oldType: canonicalLegacy.type,
        section: canonicalLegacy,
        content: canonicalLegacy.content,
        name: canonicalLegacy.name,
        isVisible: canonicalLegacy.isVisible,
        layoutVariant: canonicalLegacy.layoutVariant,
        background: canonicalLegacy.background,
        animation: canonicalLegacy.animation,
      };
    } else if (desired.type === "skills" && skillsContent) {
      source = {
        source: "skills-table",
        oldPageId: null,
        oldType: "Skill rows",
        section: null,
        content: skillsContent,
        name: "Skills",
        isVisible: true,
        layoutVariant: null,
        background: null,
        animation: null,
      };
    }

    if (!source) {
      return {
        desiredType: desired.type,
        desiredSortOrder: sortOrder,
        oldType: null,
        oldPageId: null,
        newPageId: canonicalPageId,
        existingSectionId: existing?.id ?? null,
        source,
        action: "skip",
        reason: "No source content found.",
      };
    }

    if (!existing) {
      return {
        desiredType: desired.type,
        desiredSortOrder: sortOrder,
        oldType: source.oldType,
        oldPageId: source.oldPageId,
        newPageId: canonicalPageId,
        existingSectionId: null,
        source,
        action: "create",
        reason: `Create canonical section from ${source.source}.`,
      };
    }

    const existingScore = richnessScore(existing.content);
    const sourceScore = richnessScore(source.content);
    const existingEmpty = isEmptyContent(existing.content);
    const shouldReplaceContent = existingEmpty || sourceScore > existingScore;
    const shouldUpdateSortOrder = existing.sortOrder !== sortOrder;
    const shouldUpdateVisibility = !existing.isVisible && source.isVisible;
    const shouldUpdateMetadata =
      existing.layoutVariant !== source.layoutVariant ||
      existing.background !== source.background ||
      existing.animation !== source.animation;

    if (
      shouldReplaceContent ||
      shouldUpdateSortOrder ||
      shouldUpdateVisibility ||
      shouldUpdateMetadata
    ) {
      const reasons = [
        shouldReplaceContent ? "replace with richer/non-empty content" : null,
        shouldUpdateSortOrder ? "align sortOrder with frontend order" : null,
        shouldUpdateVisibility ? "make visible because source is visible" : null,
        shouldUpdateMetadata ? "sync layout metadata" : null,
      ].filter(Boolean);

      return {
        desiredType: desired.type,
        desiredSortOrder: sortOrder,
        oldType: source.oldType,
        oldPageId: source.oldPageId,
        newPageId: canonicalPageId,
        existingSectionId: existing.id,
        source,
        action: "update",
        reason: reasons.join("; "),
      };
    }

    return {
      desiredType: desired.type,
      desiredSortOrder: sortOrder,
      oldType: source.oldType,
      oldPageId: source.oldPageId,
      newPageId: canonicalPageId,
      existingSectionId: existing.id,
      source,
      action: "skip",
      reason: "Canonical section already has non-empty content.",
    };
  });

  return { legacyPage, canonicalPage, items };
}

async function applyPlan(items: RepairPlanItem[]) {
  const canonicalPage = await prisma.page.upsert({
    where: { slug: "home" },
    update: {
      name: "Homepage",
      status: ContentStatus.PUBLISHED,
      isHomepage: true,
      publishedAt: new Date(),
    },
    create: {
      name: "Homepage",
      slug: "home",
      status: ContentStatus.PUBLISHED,
      isHomepage: true,
      publishedAt: new Date(),
    },
    select: { id: true },
  });

  for (const item of items) {
    if (!item.source || item.action === "skip") continue;

    const data = {
      type: item.desiredType,
      name: item.source.name,
      content: item.source.content as Prisma.InputJsonValue,
      sortOrder: item.desiredSortOrder,
      isVisible: item.source.isVisible,
      layoutVariant: item.source.layoutVariant,
      background: item.source.background,
      animation: item.source.animation,
    };

    if (item.action === "create") {
      await prisma.pageSection.create({
        data: {
          ...data,
          pageId: canonicalPage.id,
        },
      });
    } else if (item.action === "update" && item.existingSectionId) {
      await prisma.pageSection.update({
        where: { id: item.existingSectionId },
        data,
      });
    }
  }
}

function printPage(label: string, page: { id: string; slug: string; name: string; sections: PageSectionRow[] } | null) {
  if (!page) {
    console.log(`${label}: not found`);
    return;
  }

  console.log(`${label}: ${page.slug} (${page.id}) ${page.name}`);
  for (const section of page.sections) {
    console.log(
      `  - ${section.type} id=${section.id} sort=${section.sortOrder} visible=${section.isVisible} keys=${contentKeys(section.content).join(",")}`,
    );
  }
}

function printPlan(
  legacyPage: Awaited<ReturnType<typeof getPages>>["legacyPage"],
  canonicalPage: Awaited<ReturnType<typeof getPages>>["canonicalPage"],
  items: RepairPlanItem[],
) {
  console.log("");
  console.log(apply ? "Homepage section repair apply plan" : "Homepage section repair dry run");
  console.log("Mode:", apply ? "apply" : "dry-run (no database writes)");
  console.log("");
  printPage("Old page", legacyPage);
  printPage("Canonical page", canonicalPage);
  console.log("");
  console.log("Plan:");

  for (const item of items) {
    console.log(`- section: ${item.desiredType}`);
    console.log(`  old type: ${item.oldType ?? "none"}`);
    console.log(`  old pageId: ${item.oldPageId ?? "none"}`);
    console.log(`  new pageId: ${item.newPageId}`);
    console.log(`  sortOrder: ${item.desiredSortOrder}`);
    console.log(`  action: ${item.action}`);
    console.log(`  reason: ${item.reason}`);
  }
}

async function main() {
  const { legacyPage, canonicalPage, items } = await buildPlan();
  printPlan(legacyPage, canonicalPage, items);

  if (!apply) return;

  await applyPlan(items);
  console.log("");
  console.log("Homepage section repair completed.");
}

main()
  .catch((error: unknown) => {
    console.error("");
    console.error("Homepage section repair failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
