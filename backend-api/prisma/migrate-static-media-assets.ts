import { Prisma, PrismaClient, MediaType } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

type JsonValue = Prisma.JsonValue;

type AssetScope =
  | "homepage"
  | "profile"
  | "projects"
  | "case-studies"
  | "testimonials";

type AssetManifestItem = {
  sourceUrl: string;
  localPath: string;
  storagePath: string;
  label: string;
  scope: AssetScope;
  altText?: string;
  projectCoverSlugs?: string[];
  testimonialNames?: string[];
};

type JsonReference = {
  recordType: "PageSection" | "ProjectBlock";
  id: string;
  owner: string;
  fieldPaths: string[];
};

type AssetPlan = {
  asset: AssetManifestItem;
  localFileExists: boolean;
  mimeType: string;
  size: number;
  publicUrl: string;
  mediaAssetAction: "create" | "reuse";
  mediaAssetId: string | null;
  jsonReferences: JsonReference[];
  projectCoverTargets: Array<{ id: string; slug: string; title: string; willUpdate: boolean }>;
  testimonialTargets: Array<{ id: string; name: string; willUpdateAvatarUrl: boolean; willUpdatePhotoMediaId: boolean }>;
  staticOnly: boolean;
};

const repoRoot = resolve(__dirname, "..", "..");
const backendRoot = resolve(__dirname, "..");

loadEnvFile(join(backendRoot, ".env"));
loadEnvFile(join(repoRoot, ".env"));

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const dryRun = !apply;

const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "portfolio-media";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

const manifest: AssetManifestItem[] = [
  {
    sourceUrl: "/uploads/id_ced79044051b.webp",
    localPath: "public/uploads/id_ced79044051b.webp",
    storagePath: "homepage/hero-background-blur.webp",
    label: "Homepage hero blur background",
    scope: "homepage",
    altText: "Blurred portrait background for homepage hero",
  },
  {
    sourceUrl: "/uploads/id_d642ad39b200.webp",
    localPath: "public/uploads/id_d642ad39b200.webp",
    storagePath: "homepage/hero-background-sharp.webp",
    label: "Homepage hero sharp background",
    scope: "homepage",
    altText: "Sharp portrait background for homepage hero",
  },
  {
    sourceUrl: "/luthfi_blur.png",
    localPath: "public/luthfi_blur.png",
    storagePath: "homepage/luthfi-blur.png",
    label: "Homepage hero blur fallback",
    scope: "homepage",
    altText: "Blurred portrait background for homepage hero",
  },
  {
    sourceUrl: "/luthfi_sharp.png",
    localPath: "public/luthfi_sharp.png",
    storagePath: "homepage/luthfi-sharp.png",
    label: "Homepage hero sharp fallback",
    scope: "homepage",
    altText: "Sharp portrait background for homepage hero",
  },
  {
    sourceUrl: "/profile5-1.png",
    localPath: "public/profile5-1.png",
    storagePath: "profile/profile5-1.png",
    label: "About profile portrait",
    scope: "profile",
    altText: "Luthfi Arzaki profile portrait",
  },
  {
    sourceUrl: "/selected-work-collage.png",
    localPath: "public/selected-work-collage.png",
    storagePath: "homepage/selected-work-collage.png",
    label: "Selected work collage",
    scope: "homepage",
    altText: "Selected multidisciplinary work collage",
  },
  {
    sourceUrl: "/flagship-seleris.png",
    localPath: "public/flagship-seleris.png",
    storagePath: "projects/flagship-seleris.png",
    label: "Seleris flagship visual",
    scope: "projects",
    altText: "Seleris Care and Seleris Life product experience screens",
    projectCoverSlugs: ["seleris-superapp"],
  },
  {
    sourceUrl: "/flagship-noteit.png",
    localPath: "public/flagship-noteit.png",
    storagePath: "projects/flagship-noteit.png",
    label: "NoteIt flagship visual",
    scope: "projects",
    altText: "NoteIt automatic note-taking mobile application showcase",
    projectCoverSlugs: ["noteit-automatic-note-taking-app"],
  },
  {
    sourceUrl: "/flagship-flexa.png",
    localPath: "public/flagship-flexa.png",
    storagePath: "projects/flagship-flexa.png",
    label: "Flexa flagship visual",
    scope: "projects",
    altText: "Flexa.asia flexible accident insurance mobile and dashboard screens",
    projectCoverSlugs: ["flexa-asia-flexible-accident-insurance"],
  },
  {
    sourceUrl: "/creative-brand-visual.png",
    localPath: "public/creative-brand-visual.png",
    storagePath: "homepage/creative-brand-visual.png",
    label: "Creative practice brand visual",
    scope: "homepage",
    altText: "Nexora brand identity and visual collateral collection",
  },
  {
    sourceUrl: "/creative-photography.png",
    localPath: "public/creative-photography.png",
    storagePath: "homepage/creative-photography.png",
    label: "Creative practice photography",
    scope: "homepage",
    altText: "Photography and visual direction moodboard",
  },
  {
    sourceUrl: "/testimonial-raka-avatar.svg",
    localPath: "public/testimonial-raka-avatar.svg",
    storagePath: "testimonials/raka-avatar.svg",
    label: "Raka testimonial avatar",
    scope: "testimonials",
    altText: "Raka testimonial avatar",
    testimonialNames: ["Raka"],
  },
  {
    sourceUrl: "/testimonial-sarah-avatar.svg",
    localPath: "public/testimonial-sarah-avatar.svg",
    storagePath: "testimonials/sarah-avatar.svg",
    label: "Sarah testimonial avatar",
    scope: "testimonials",
    altText: "Sarah testimonial avatar",
    testimonialNames: ["Sarah"],
  },
  {
    sourceUrl: "/testimonial-budi-avatar.svg",
    localPath: "public/testimonial-budi-avatar.svg",
    storagePath: "testimonials/budi-avatar.svg",
    label: "Budi testimonial avatar",
    scope: "testimonials",
    altText: "Budi testimonial avatar",
    testimonialNames: ["Budi"],
  },
  {
    sourceUrl: "/case-studies/seleris/hero-visual.png",
    localPath: "public/case-studies/seleris/hero-visual.png",
    storagePath: "case-studies/seleris/hero-visual.png",
    label: "Seleris case study hero visual",
    scope: "case-studies",
    altText: "Seleris Care and Seleris Life interface collection",
  },
  {
    sourceUrl: "/case-studies/seleris/gallery-assessment.png",
    localPath: "public/case-studies/seleris/gallery-assessment.png",
    storagePath: "case-studies/seleris/gallery-assessment.png",
    label: "Seleris assessment gallery image",
    scope: "case-studies",
    altText: "Seleris guided assessment journey interface",
  },
  {
    sourceUrl: "/case-studies/seleris/gallery-result.png",
    localPath: "public/case-studies/seleris/gallery-result.png",
    storagePath: "case-studies/seleris/gallery-result.png",
    label: "Seleris result gallery image",
    scope: "case-studies",
    altText: "Seleris result experience dashboard interface",
  },
  {
    sourceUrl: "/case-studies/seleris/gallery-business.png",
    localPath: "public/case-studies/seleris/gallery-business.png",
    storagePath: "case-studies/seleris/gallery-business.png",
    label: "Seleris business gallery image",
    scope: "case-studies",
    altText: "Seleris business operations dashboard interface",
  },
];

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

function mimeTypeForPath(path: string) {
  const extension = extname(path).toLowerCase();
  if (extension === ".webp") return "image/webp";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".pdf") return "application/pdf";
  return "application/octet-stream";
}

function mediaTypeForMime(mimeType: string) {
  if (mimeType.startsWith("image/")) return MediaType.IMAGE;
  if (mimeType.startsWith("video/")) return MediaType.VIDEO;
  if (mimeType === "application/pdf" || mimeType.includes("document")) {
    return MediaType.DOCUMENT;
  }
  return MediaType.OTHER;
}

function publicUrlFor(storagePath: string) {
  if (!supabaseUrl) return `<SUPABASE_URL>/storage/v1/object/public/${bucket}/${storagePath}`;
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${storagePath}`;
}

function replaceJsonUrls(value: JsonValue, sourceUrl: string, targetUrl: string) {
  const paths: string[] = [];

  function visit(current: JsonValue, path: string): JsonValue {
    if (current === sourceUrl) {
      paths.push(path || "$");
      return targetUrl;
    }

    if (Array.isArray(current)) {
      let changed = false;
      const next = current.map((item, index) => {
        const replaced = visit(item, `${path}[${index}]`);
        if (replaced !== item) changed = true;
        return replaced;
      });
      return changed ? next : current;
    }

    if (current && typeof current === "object") {
      let changed = false;
      const next: Record<string, JsonValue> = {};
      for (const [key, item] of Object.entries(current)) {
        const childPath = path ? `${path}.${key}` : key;
        const replaced = visit(item as JsonValue, childPath);
        next[key] = replaced;
        if (replaced !== item) changed = true;
      }
      return changed ? next : current;
    }

    return current;
  }

  return {
    value: visit(value, ""),
    paths,
  };
}

async function buildPlan() {
  const [pageSections, projectBlocks, testimonials, projects, mediaAssets] =
    await prisma.$transaction([
      prisma.pageSection.findMany({
        include: { page: { select: { slug: true, name: true } } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.projectBlock.findMany({
        include: { project: { select: { slug: true, title: true } } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.testimonial.findMany({
        where: { projectId: null },
        select: { id: true, name: true, avatarUrl: true, photoMediaId: true },
      }),
      prisma.project.findMany({
        where: { deletedAt: null },
        select: { id: true, slug: true, title: true, coverMediaId: true },
      }),
      prisma.mediaAsset.findMany({
        where: {
          storageKey: {
            in: manifest.map((asset) => `${bucket}/${asset.storagePath}`),
          },
        },
        select: { id: true, storageKey: true },
      }),
    ]);

  const mediaByStorageKey = new Map(
    mediaAssets.map((asset) => [asset.storageKey, asset]),
  );

  return manifest.map<AssetPlan>((asset) => {
    const absolutePath = join(repoRoot, asset.localPath);
    const localFileExists = existsSync(absolutePath);
    const size = localFileExists ? statSync(absolutePath).size : 0;
    const mimeType = mimeTypeForPath(asset.localPath);
    const storageKey = `${bucket}/${asset.storagePath}`;
    const existingMediaAsset = mediaByStorageKey.get(storageKey) ?? null;
    const targetUrl = publicUrlFor(asset.storagePath);

    const pageSectionReferences = pageSections.flatMap<JsonReference>((section) => {
      const replacement = replaceJsonUrls(
        section.content as JsonValue,
        asset.sourceUrl,
        targetUrl,
      );
      if (!replacement.paths.length) return [];
      return [{
        recordType: "PageSection",
        id: section.id,
        owner: `${section.page.slug} / ${section.type}`,
        fieldPaths: replacement.paths,
      }];
    });

    const projectBlockReferences = projectBlocks.flatMap<JsonReference>((block) => {
      const replacement = replaceJsonUrls(
        block.content as JsonValue,
        asset.sourceUrl,
        targetUrl,
      );
      if (!replacement.paths.length) return [];
      return [{
        recordType: "ProjectBlock",
        id: block.id,
        owner: `${block.project.slug} / ${block.type}`,
        fieldPaths: replacement.paths,
      }];
    });

    const testimonialTargets = testimonials
      .filter((testimonial) => asset.testimonialNames?.includes(testimonial.name))
      .map((testimonial) => {
        const avatarUrlMatchesLocalAsset = testimonial.avatarUrl === asset.sourceUrl;
        return {
          id: testimonial.id,
          name: testimonial.name,
          willUpdateAvatarUrl: avatarUrlMatchesLocalAsset,
          willUpdatePhotoMediaId:
            avatarUrlMatchesLocalAsset ||
            (!testimonial.avatarUrl && testimonial.photoMediaId !== existingMediaAsset?.id),
        };
      });

    const projectCoverTargets = projects
      .filter((project) => asset.projectCoverSlugs?.includes(project.slug))
      .map((project) => ({
        id: project.id,
        slug: project.slug,
        title: project.title,
        willUpdate: project.coverMediaId === null,
      }));

    return {
      asset,
      localFileExists,
      mimeType,
      size,
      publicUrl: targetUrl,
      mediaAssetAction: existingMediaAsset ? "reuse" : "create",
      mediaAssetId: existingMediaAsset?.id ?? null,
      jsonReferences: [...pageSectionReferences, ...projectBlockReferences],
      testimonialTargets,
      projectCoverTargets,
      staticOnly:
        pageSectionReferences.length === 0 &&
        projectBlockReferences.length === 0 &&
        testimonialTargets.length === 0 &&
        projectCoverTargets.length === 0,
    };
  });
}

async function ensureMediaAsset(plan: AssetPlan) {
  const storageKey = `${bucket}/${plan.asset.storagePath}`;
  const existing = await prisma.mediaAsset.findUnique({ where: { storageKey } });
  if (existing) return existing;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured for --apply.",
    );
  }

  const localFilePath = join(repoRoot, plan.asset.localPath);
  const fileBuffer = readFileSync(localFilePath);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabase.storage
    .from(bucket)
    .upload(plan.asset.storagePath, fileBuffer, {
      contentType: plan.mimeType,
      upsert: false,
    });

  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw new Error(`Upload failed for ${plan.asset.sourceUrl}: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(plan.asset.storagePath);

  return prisma.mediaAsset.create({
    data: {
      type: mediaTypeForMime(plan.mimeType),
      filename: basename(plan.asset.storagePath),
      originalName: basename(plan.asset.localPath),
      url: publicUrl,
      storageKey,
      mimeType: plan.mimeType,
      size: plan.size,
      altText: plan.asset.altText ?? null,
    },
  });
}

async function updateJsonReferences(plan: AssetPlan, targetUrl: string) {
  const [pageSections, projectBlocks] = await prisma.$transaction([
    prisma.pageSection.findMany({ select: { id: true, content: true } }),
    prisma.projectBlock.findMany({ select: { id: true, content: true } }),
  ]);

  for (const section of pageSections) {
    const replacement = replaceJsonUrls(
      section.content as JsonValue,
      plan.asset.sourceUrl,
      targetUrl,
    );
    if (!replacement.paths.length) continue;
    await prisma.pageSection.update({
      where: { id: section.id },
      data: { content: replacement.value as Prisma.InputJsonValue },
    });
  }

  for (const block of projectBlocks) {
    const replacement = replaceJsonUrls(
      block.content as JsonValue,
      plan.asset.sourceUrl,
      targetUrl,
    );
    if (!replacement.paths.length) continue;
    await prisma.projectBlock.update({
      where: { id: block.id },
      data: { content: replacement.value as Prisma.InputJsonValue },
    });
  }
}

async function applyPlan(plans: AssetPlan[]) {
  for (const plan of plans) {
    if (!plan.localFileExists) {
      throw new Error(`Local file is missing: ${plan.asset.localPath}`);
    }

    const mediaAsset = await ensureMediaAsset(plan);
    await updateJsonReferences(plan, mediaAsset.url);

    for (const target of plan.testimonialTargets) {
      if (!target.willUpdateAvatarUrl && !target.willUpdatePhotoMediaId) continue;

      await prisma.testimonial.update({
        where: { id: target.id },
        data: {
          ...(target.willUpdateAvatarUrl ? { avatarUrl: mediaAsset.url } : {}),
          ...(target.willUpdatePhotoMediaId ? { photoMediaId: mediaAsset.id } : {}),
        },
      });
    }

    for (const target of plan.projectCoverTargets) {
      if (!target.willUpdate) continue;

      await prisma.project.update({
        where: { id: target.id },
        data: { coverMediaId: mediaAsset.id },
      });
    }
  }
}

function printPlan(plans: AssetPlan[]) {
  console.log("");
  console.log(dryRun ? "Static media migration dry run" : "Static media migration apply plan");
  console.log("Mode:", dryRun ? "dry-run (no uploads or database writes)" : "apply");
  console.log("Bucket:", bucket);
  console.log("");

  for (const plan of plans) {
    console.log(`- ${plan.asset.localPath}`);
    console.log(`  destination: ${bucket}/${plan.asset.storagePath}`);
    console.log(`  source url: ${plan.asset.sourceUrl}`);
    console.log(`  public url: ${plan.publicUrl}`);
    console.log(`  mime/size: ${plan.mimeType}, ${plan.size} bytes`);
    console.log(`  local file: ${plan.localFileExists ? "found" : "missing"}`);
    console.log(`  MediaAsset: ${plan.mediaAssetAction}${plan.mediaAssetId ? ` (${plan.mediaAssetId})` : ""}`);

    if (plan.projectCoverTargets.length) {
      for (const target of plan.projectCoverTargets) {
        console.log(
          `  Project cover: ${target.slug} (${target.willUpdate ? "update coverMediaId" : "already linked"})`,
        );
      }
    }

    if (plan.testimonialTargets.length) {
      for (const target of plan.testimonialTargets) {
        const actions = [
          target.willUpdateAvatarUrl ? "update avatarUrl" : "avatarUrl already remote or unchanged",
          target.willUpdatePhotoMediaId ? "update photoMediaId" : "photoMediaId already linked",
        ];
        console.log(`  Testimonial: ${target.name} (${actions.join(", ")})`);
      }
    }

    if (plan.jsonReferences.length) {
      for (const reference of plan.jsonReferences) {
        console.log(
          `  ${reference.recordType}: ${reference.owner} -> ${reference.fieldPaths.join(", ")}`,
        );
      }
    }

    if (plan.staticOnly) {
      console.log("  references: no database reference found; portfolio fallback/static asset only");
    }
  }

  const decorativeAssets = [
    "public/logo.png",
    "public/contact-ambient-blue-orb.svg",
    "public/contact-status-dot.svg",
    "public/how-i-work-dot-blue.svg",
    "public/how-i-work-dot-green.svg",
    "public/how-i-work-dot-warm.svg",
    "public/testimonial-ambient-dot.svg",
    "public/flagship-purple-glow.svg",
    "public/about-mobile-portrait.png",
  ];

  console.log("");
  console.log("Excluded decorative/static assets:");
  for (const asset of decorativeAssets) {
    console.log(`- ${asset}`);
  }
}

async function main() {
  const plans = await buildPlan();
  printPlan(plans);

  if (dryRun) return;

  await applyPlan(plans);
  console.log("");
  console.log("Static media migration completed.");
}

main()
  .catch((error: unknown) => {
    console.error("");
    console.error("Static media migration failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
