import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");
const siteUrl = "https://lyzastudio.my.id";
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
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function metadataHead(metadata) {
  const title = escapeAttribute(metadata.title);
  const description = escapeAttribute(metadata.description);
  const canonical = escapeAttribute(metadata.canonical);
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="${metadata.type}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`
  ].join("\n    ");
}

const template = await readFile(join(dist, "index.html"), "utf8");
for (const [route, metadata] of Object.entries(routes)) {
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta name="description"[^>]*\/>/, "")
    .replace(/<link rel="canonical"[^>]*\/>/, "")
    .replace(/<meta property="og:[^"]+"[^>]*\/>/g, "")
    .replace(/<meta name="twitter:[^"]+"[^>]*\/>/g, "")
    .replace("</head>", `    ${metadataHead(metadata)}\n  </head>`);
  const output = route === "/" ? join(dist, "index.html") : join(dist, route.slice(1), "index.html");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
}
