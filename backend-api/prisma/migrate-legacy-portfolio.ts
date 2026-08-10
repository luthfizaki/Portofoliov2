import { PrismaClient, ContentStatus, ProjectVisibility } from "@prisma/client";
import { Client } from "pg";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

const legacyDatabaseUrl =
  process.env.LEGACY_DATABASE_URL ??
  "postgresql://postgres@127.0.0.1:5432/portfolio_v2";

const localDb = new Client({
  connectionString: legacyDatabaseUrl,
});

type LegacySection = {
  content: Record<string, any>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getLegacyContent(
  table: string,
): Promise<Record<string, any> | null> {
  const result = await localDb.query<LegacySection>(
    `SELECT content FROM ${table} ORDER BY id LIMIT 1`,
  );

  return result.rows[0]?.content ?? null;
}

async function createCategory(name: string) {
  const slug = slugify(name);

  return prisma.category.upsert({
    where: { slug },
    update: { name },
    create: {
      name,
      slug,
    },
  });
}

async function createProjectCategory(projectId: string, categoryName: string) {
  const category = await createCategory(categoryName);

  await prisma.projectCategory.upsert({
    where: {
      projectId_categoryId: {
        projectId,
        categoryId: category.id,
      },
    },
    update: {},
    create: {
      projectId,
      categoryId: category.id,
    },
  });
}

async function migrateExperiences() {
  const content = await getLegacyContent("portfolio_v2_experience");

  if (!content?.rows) {
    console.log("No experience rows found.");
    return;
  }

  console.log(`Migrating ${content.rows.length} experiences...`);

  for (const [index, row] of content.rows.entries()) {
    const existing = await prisma.experience.findFirst({
      where: {
        company: row.company,
        role: row.role,
      },
    });

    if (existing) {
      console.log(`  -> Skip existing: ${row.role} @ ${row.company}`);
      continue;
    }

    await prisma.experience.create({
      data: {
        year: row.year ?? "",
        role: row.role ?? "",
        company: row.company ?? "",
        contribution: row.contribution ?? "",
        tags: row.tags ?? [],
        featured: Boolean(row.featured),
        status: ContentStatus.PUBLISHED,
        sortOrder: index,
      },
    });

    console.log(`  OK ${row.role} @ ${row.company}`);
  }
}

async function migrateSkills() {
  const content = await getLegacyContent("portfolio_v2_capabilities_tools");

  if (!content) {
    console.log("No capabilities/tools data found.");
    return;
  }

  const tools = content.tools ?? [];
  const capabilities = content.capabilities ?? [];

  console.log(`Migrating ${tools.length} tools...`);

  for (const [index, tool] of tools.entries()) {
    const name = tool.label;

    if (!name) continue;

    const existing = await prisma.skill.findFirst({
      where: {
        name,
        category: "TOOLS",
      },
    });

    if (existing) {
      console.log(`  -> Skip existing tool: ${name}`);
      continue;
    }

    await prisma.skill.create({
      data: {
        name,
        category: "TOOLS",
        description: "Tool used in the design and product development process.",
        level: 80,
        tools: [],
        featured: Boolean(tool.featured),
        status: ContentStatus.PUBLISHED,
        sortOrder: index,
      },
    });

    console.log(`  OK Tool: ${name}`);
  }

  console.log(`Migrating ${capabilities.length} capabilities...`);

  for (const [index, capability] of capabilities.entries()) {
    const name = capability.title;

    if (!name) continue;

    const existing = await prisma.skill.findFirst({
      where: {
        name,
        category: "CAPABILITIES",
      },
    });

    if (existing) {
      console.log(`  -> Skip existing capability: ${name}`);
      continue;
    }

    await prisma.skill.create({
      data: {
        name,
        category: "CAPABILITIES",
        description: capability.description ?? "",
        level: 80,
        tools: capability.tags ?? [],
        featured: true,
        status: ContentStatus.PUBLISHED,
        sortOrder: index,
      },
    });

    console.log(`  OK Capability: ${name}`);
  }
}

async function migrateProjects() {
  const content = await getLegacyContent("portfolio_v2_project_archive");

  if (!content?.projects) {
    console.log("No project archive found.");
    return;
  }

  console.log(`Migrating ${content.projects.length} archive projects...`);

  for (const [index, project] of content.projects.entries()) {
    const title = project.title;

    if (!title) continue;

    const slug = slugify(title);

    const existing = await prisma.project.findUnique({
      where: { slug },
    });

    if (existing) {
      console.log(`  -> Skip existing project: ${title}`);
      continue;
    }

    const created = await prisma.project.create({
      data: {
        title,
        slug,
        excerpt: project.output ?? null,
        year: project.year ? Number(project.year) : null,
        featured: Boolean(project.featured),
        visibility: ProjectVisibility.PUBLIC,
        status: ContentStatus.PUBLISHED,
        sortOrder: index,
        services: [],
        tools: [],
      },
    });

    if (project.category) {
      await createProjectCategory(created.id, project.category);
    }

    await prisma.projectBlock.create({
      data: {
        projectId: created.id,
        type: "archive",
        title: project.title,
        content: {
          output: project.output ?? null,
          linkUrl: project.linkUrl ?? null,
          category: project.category ?? null,
        },
        sortOrder: 0,
      },
    });

    console.log(`  OK Project: ${title}`);
  }
}

async function migrateFlagshipProjects() {
  const content = await getLegacyContent("portfolio_v2_flagship_products");

  if (!content?.projects) {
    console.log("No flagship projects found.");
    return;
  }

  console.log(`Migrating ${content.projects.length} flagship projects...`);

  for (const [index, project] of content.projects.entries()) {
    const title = Array.isArray(project.titleLines)
      ? project.titleLines.join(" ")
      : project.title ?? "";

    if (!title) continue;

    const slug = slugify(title);

    const existing = await prisma.project.findUnique({
      where: { slug },
    });

    if (existing) {
      console.log(`  -> Skip existing flagship: ${title}`);
      continue;
    }

    const created = await prisma.project.create({
      data: {
        title,
        slug,
        description: project.description ?? null,
        role: project.role ?? null,
        platform: project.platform ?? null,
        services: project.scope
          ? project.scope
              .split("/")
              .map((item: string) => item.trim())
              .filter(Boolean)
          : [],
        featured: Boolean(project.featured),
        visibility: ProjectVisibility.PUBLIC,
        status: ContentStatus.PUBLISHED,
        sortOrder: index,
        tools: [],
      },
    });

    await prisma.projectBlock.create({
      data: {
        projectId: created.id,
        type: "flagship",
        title,
        content: {
          eyebrow: project.eyebrow ?? null,
          number: project.number ?? null,
          layout: project.layout ?? null,
          scope: project.scope ?? null,
          linkUrl: project.linkUrl ?? null,
          linkLabel: project.linkLabel ?? null,
          visualUrl: project.visualUrl ?? null,
          visualAlt: project.visualAlt ?? null,
          glowUrl: project.glowUrl ?? null,
        },
        sortOrder: 0,
      },
    });

    console.log(`  OK Flagship: ${title}`);
  }
}

async function migrateTestimonials() {
  const content = await getLegacyContent(
    "portfolio_v2_collaboration_testimonials",
  );

  if (!content?.testimonials) {
    console.log("No testimonials found.");
    return;
  }

  console.log(`Migrating ${content.testimonials.length} testimonials...`);

  for (const [index, item] of content.testimonials.entries()) {
    const existing = await prisma.testimonial.findFirst({
      where: {
        name: item.name,
        quote: item.quote,
      },
    });

    if (existing) {
      console.log(`  -> Skip existing testimonial: ${item.name}`);
      continue;
    }

    await prisma.testimonial.create({
      data: {
        name: item.name ?? "",
        position: item.role ?? null,
        company: item.company ?? null,
        quote: item.quote ?? "",
        initial: item.initial ?? null,
        avatarUrl: item.avatarUrl ?? null,
        accent: item.accent ?? "blue",
        featuredLabel: item.featuredLabel ?? null,
        tags: item.tags ?? [],
        featured: Boolean(item.featured),
        status: ContentStatus.PUBLISHED,
        sortOrder: index,
      },
    });

    console.log(`  OK Testimonial: ${item.name}`);
  }
}

async function migrateHomepageSections() {
  const sections = [
    ["hero", "HERO"],
    ["about", "ABOUT"],
    ["selected_work", "SELECTED_WORK"],
    ["experience", "EXPERIENCE"],
    ["flagship_products", "FLAGSHIP_PRODUCTS"],
    ["project_archive", "PROJECT_ARCHIVE"],
    ["capabilities_tools", "CAPABILITIES_TOOLS"],
    ["creative_practice", "CREATIVE_PRACTICE"],
    ["collaboration_testimonials", "TESTIMONIALS"],
    ["how_i_work", "HOW_I_WORK"],
    ["contact_final_statement", "CONTACT"],
  ] as const;

  const page = await prisma.page.upsert({
    where: {
      slug: "/",
    },
    update: {
      name: "Portfolio Homepage",
      isHomepage: true,
      status: ContentStatus.PUBLISHED,
    },
    create: {
      name: "Portfolio Homepage",
      slug: "/",
      isHomepage: true,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  for (const [table, type] of sections) {
    const content = await getLegacyContent(`portfolio_v2_${table}`);

    if (!content) {
      console.log(`  -> No content for ${type}`);
      continue;
    }

    const existing = await prisma.pageSection.findFirst({
      where: {
        pageId: page.id,
        type,
      },
    });

    if (existing) {
      console.log(`  -> Skip existing section: ${type}`);
      continue;
    }

    await prisma.pageSection.create({
      data: {
        pageId: page.id,
        type,
        name: type.replaceAll("_", " "),
        content,
        sortOrder: sections.findIndex(([_, value]) => value === type),
      },
    });

    console.log(`  OK Section: ${type}`);
  }
}

async function main() {
  console.log("========================================");
  console.log("Portfolio V2 Legacy Data Migration");
  console.log("========================================");

  await localDb.connect();

  try {
    await migrateExperiences();
    await migrateSkills();
    await migrateProjects();
    await migrateFlagshipProjects();
    await migrateTestimonials();
    await migrateHomepageSections();

    console.log("");
    console.log("========================================");
    console.log("Migration completed successfully.");
    console.log("========================================");
  } finally {
    await localDb.end();
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("Migration failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
