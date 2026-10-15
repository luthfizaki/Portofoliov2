import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");
const siteUrl = "https://lyzastudio.my.id";
const apiBase = (process.env.VITE_API_URL || "").replace(/\/+$/, "");
const routes = {
  "/": {
    title: "Luthfi Arzaki | UI/UX Designer",
    description: "Luthfi Arzaki, UI/UX Designer and Product Designer crafting thoughtful digital products and experiences.",
    canonical: `${siteUrl}/`,
    type: "website"
  },
  "/case-study/seleris-superapp": {
    title: "SELERIS SUPERAPP | Luthfi Arzaki",
    description: "Seleris SuperApp product design case study by Luthfi Arzaki.",
    canonical: `${siteUrl}/case-study/seleris-superapp`,
    type: "article"
  },
  "/case-study/noteit-automatic-note-taking-app": {
    title: "NOTEIT — AUTOMATIC NOTE-TAKING APP | Luthfi Arzaki",
    description: "NoteIt automatic note-taking mobile application case study by Luthfi Arzaki.",
    canonical: `${siteUrl}/case-study/noteit-automatic-note-taking-app`,
    type: "article"
  },
  "/case-study/flexa-asia-flexible-accident-insurance": {
    title: "FLEXA.ASIA — FLEXIBLE ACCIDENT INSURANCES | Luthfi Arzaki",
    description: "Flexa.asia flexible accident insurance product design case study by Luthfi Arzaki.",
    canonical: `${siteUrl}/case-study/flexa-asia-flexible-accident-insurance`,
    type: "article"
  },
  "/case-study/takaful-mobile-app": {
    title: "TAKAFUL MOBILE APP | Luthfi Arzaki",
    description: "Takaful Mobile App product design case study by Luthfi Arzaki.",
    canonical: `${siteUrl}/case-study/takaful-mobile-app`,
    type: "article"
  }
};

function escapeAttribute(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function resolveMetadata(route, fallback) {
  if (!apiBase) return fallback;
  const endpoint = route === "/"
    ? "/api/v1/public/pages/home"
    : `/api/v1/public/projects/${route.split("/").filter(Boolean).at(-1)}`;
  try {
    const response = await fetch(`${apiBase}${endpoint}`, {
      headers: { accept: "application/json" },
      cache: "no-store"
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 403 && payload?.code === "PASSWORD_REQUIRED") {
        return {
          ...fallback,
          title: "Protected Case Study | Luthfi Arzaki",
          description: "This case study is password protected.",
          noIndex: true,
          noFollow: true
        };
      }
      return fallback;
    }
    const seo = payload?.success === true ? payload?.data?.seo : null;
    if (!seo || typeof seo !== "object") return fallback;

    return {
      ...fallback,
      title: typeof seo.title === "string" && seo.title.trim() ? seo.title.trim() : fallback.title,
      description: typeof seo.description === "string" && seo.description.trim() ? seo.description.trim() : fallback.description,
      canonical: typeof seo.canonical === "string" && seo.canonical.trim() ? seo.canonical.trim() : fallback.canonical,
      ogTitle: typeof seo.ogTitle === "string" && seo.ogTitle.trim() ? seo.ogTitle.trim() : undefined,
      ogDescription: typeof seo.ogDescription === "string" && seo.ogDescription.trim() ? seo.ogDescription.trim() : undefined,
      ogImageUrl: typeof seo.ogImageUrl === "string" && seo.ogImageUrl.trim() ? seo.ogImageUrl.trim() : undefined,
      noIndex: seo.noIndex === true,
      noFollow: seo.noFollow === true
    };
  } catch (error) {
    console.warn(`SEO metadata fetch failed for ${route}; static metadata will be used.`, error);
    return fallback;
  }
}

function metadataHead(metadata) {
  const title = escapeAttribute(metadata.title);
  const description = escapeAttribute(metadata.description);
  const canonical = escapeAttribute(metadata.canonical);
  const ogTitle = escapeAttribute(metadata.ogTitle || metadata.title);
  const ogDescription = escapeAttribute(metadata.ogDescription || metadata.description);
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="${metadata.type}" />`,
    `<meta property="og:title" content="${ogTitle}" />`,
    `<meta property="og:description" content="${ogDescription}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${ogTitle}" />`,
    `<meta name="twitter:description" content="${ogDescription}" />`
  ];
  if (metadata.ogImageUrl) {
    const image = escapeAttribute(metadata.ogImageUrl);
    tags.push(`<meta property="og:image" content="${image}" />`);
    tags.push(`<meta name="twitter:image" content="${image}" />`);
  }
  if (metadata.noIndex || metadata.noFollow) {
    const robots = [metadata.noIndex ? "noindex" : "index", metadata.noFollow ? "nofollow" : "follow"].join(", ");
    tags.push(`<meta name="robots" content="${robots}" />`);
  }
  return tags.join("\n    ");
}

const template = await readFile(join(dist, "index.html"), "utf8");
const resolvedRoutes = await Promise.all(
  Object.entries(routes).map(async ([route, fallback]) => [route, await resolveMetadata(route, fallback)])
);

for (const [route, metadata] of resolvedRoutes) {
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta name="description"[^>]*\/>/, "")
    .replace(/<link rel="canonical"[^>]*\/>/, "")
    .replace(/<meta property="og:[^"]+"[^>]*\/>/g, "")
    .replace(/<meta name="twitter:[^"]+"[^>]*\/>/g, "")
    .replace(/<meta name="robots"[^>]*\/>/g, "")
    .replace("</head>", `    ${metadataHead(metadata)}\n  </head>`);
  const output = route === "/" ? join(dist, "index.html") : join(dist, route.slice(1), "index.html");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
}
