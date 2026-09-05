"use client";

import { Archive, Check, Eye, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { SessionUser } from "../lib/api";
import { apiUrl } from "../lib/api";
import { CmsWorkspace } from "./cms-workspace";

type GalleryItem = { number: string; title: string; type: string; image: string; className: string };
type CaseFeatureImage = { url: string; alt: string };
type CaseFeature = { eyebrow: string; titleLines: string; description: string; platform: string; scope: string; images: CaseFeatureImage[]; layout: "media-left" | "media-right" };
type CaseStudyState = {
  eyebrow: string; lede: string; heroVisualUrl: string; heroVisualAlt: string;
  summaryHeading: string; summaryIntro: string; overview: string; contribution: string; challenge: string; deliverables: string;
  galleryHeading: string; galleryIntro: string; galleryNote: string; gallery: GalleryItem[];
  feature: CaseFeature | null;
  nextLabel: string; nextTitle: string; nextText: string; nextUrl: string;
};

type ProjectBlock = { id: string; type: string; title: string | null; content: Record<string, unknown>; sortOrder: number; isVisible: boolean; layoutVariant: string | null };

export type EditableProject = {
  id: string; title: string; slug: string; excerpt: string | null; description: string | null;
  client: string | null; industry: string | null; year: number | null; role: string | null;
  duration: string | null; platform: string | null; services: string[]; tools: string[];
  featured: boolean; nda: boolean; visibility: "PUBLIC" | "UNLISTED" | "PASSWORD_PROTECTED" | "PRIVATE"; status: string;
  blocks?: ProjectBlock[];
};

type FormState = {
  title: string; slug: string; excerpt: string; description: string; client: string; industry: string;
  year: string; role: string; duration: string; platform: string; services: string; tools: string;
  featured: boolean; nda: boolean; visibility: EditableProject["visibility"]; status: string;
};

const defaultCaseStudy: CaseStudyState = {
  eyebrow: "HEALTHTECH / INSURTECH / PRODUCT DESIGN",
  lede: "A connected health and insurance ecosystem designed across mobile applications, underwriting journeys, reporting, affiliate operations, and enterprise dashboards.",
  heroVisualUrl: "/case-studies/seleris/hero-visual.png",
  heroVisualAlt: "Seleris Care and Seleris Life interface collection",
  summaryHeading: "A CLOSER VIEW\nOF THE PROJECT.",
  summaryIntro: "Seleris SuperApp is a connected product ecosystem that combines health assessment, insurance underwriting, reporting, affiliate operations, and enterprise monitoring across mobile and dashboard experiences.",
  overview: "CARE and LIFE operate within one product family. CARE supports personal and business health experiences, including scanning, family plans, weekly results, recommendations, affiliate packages, commissions, and withdrawals. LIFE supports insurance underwriting through identity verification, structured forms, face and appearance scanning, processing, and assessment results.",
  contribution: "I worked across product definition and implementation support—turning requirements and backend logic into user flows, information architecture, high-fidelity interfaces, reusable patterns, interactive prototypes, and implementation-ready specifications. I also collaborated with frontend, backend, QA, and stakeholders during refinement and UAT.",
  challenge: "The main challenge was not only visual design, but translating long and data-heavy workflows into clear steps. Different users needed different levels of information, while product rules, backend states, scanning conditions, failure scenarios, and underwriting outputs still had to remain consistent and understandable.",
  deliverables: "MOBILE FLOWS, ENTERPRISE DASHBOARD, DESIGN SYSTEM, PROTOTYPE, REPORT UI, UAT SUPPORT",
  galleryHeading: "SELECTED\nINTERFACES.",
  galleryIntro: "This section is fully repeatable. Each uploaded item only needs an image, optional caption, and layout type: full width or half width.",
  galleryNote: "CMS BLOCKS / FULL WIDTH / TWO COLUMN / OPTIONAL CAPTION",
  gallery: [
    { number: "01", title: "GUIDED ASSESSMENT JOURNEY", type: "MOBILE APPLICATION", image: "/case-studies/seleris/gallery-assessment.png", className: "is-wide" },
    { number: "02", title: "RESULT EXPERIENCE", type: "DASHBOARD", image: "/case-studies/seleris/gallery-result.png", className: "" },
    { number: "03", title: "BUSINESS OPERATIONS", type: "DASHBOARD", image: "/case-studies/seleris/gallery-business.png", className: "" },
  ],
  feature: null,
  nextLabel: "NEXT CASE STUDY",
  nextTitle: "NOTEIT — AUTOMATIC NOTE-TAKING APP",
  nextText: "A focused mobile UI project for capturing and organizing important information.",
  nextUrl: "/#flagship-products",
};

function block(project: EditableProject | undefined, type: string) {
  return project?.blocks?.find((item) => item.type === type)?.content ?? {};
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function galleryValue(value: unknown) {
  if (!Array.isArray(value)) return defaultCaseStudy.gallery;
  return value.map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      number: stringValue(record.number, String(index + 1).padStart(2, "0")),
      title: stringValue(record.title),
      type: stringValue(record.type),
      image: stringValue(record.image),
      className: stringValue(record.className),
    };
  });
}

function caseFeatureValue(value: unknown): CaseFeature | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const images = Array.isArray(record.images)
    ? record.images.map((item) => {
      if (!item || typeof item !== "object") return null;
      const image = item as Record<string, unknown>;
      const url = stringValue(image.url).trim();
      return url ? { url, alt: stringValue(image.alt).trim() } : null;
    }).filter((item): item is CaseFeatureImage => item !== null)
    : [];
  const normalizedImages = images.length
    ? images
    : Array.from(new Set([record.image, record.imageUrl, record.visualUrl].map((item) => stringValue(item).trim()).filter(Boolean))).map((url) => ({ url, alt: stringValue(record.visualAlt, stringValue(record.imageAlt, stringValue(record.alt))).trim() }));
  return {
    eyebrow: stringValue(record.eyebrow),
    titleLines: Array.isArray(record.titleLines) ? record.titleLines.filter((item): item is string => typeof item === "string").join("\n") : stringValue(record.titleLines),
    description: stringValue(record.description),
    platform: stringValue(record.platform),
    scope: stringValue(record.scope),
    images: normalizedImages,
    layout: stringValue(record.layout) === "media-left" ? "media-left" : "media-right",
  };
}

function initialState(project?: EditableProject): FormState {
  return {
    title: project?.title ?? "", slug: project?.slug ?? "", excerpt: project?.excerpt ?? "", description: project?.description ?? "",
    client: project?.client ?? "", industry: project?.industry ?? "", year: project?.year?.toString() ?? "", role: project?.role ?? "",
    duration: project?.duration ?? "", platform: project?.platform ?? "", services: project?.services.join(", ") ?? "", tools: project?.tools.join(", ") ?? "",
    featured: project?.featured ?? false, nda: project?.nda ?? false, visibility: project?.visibility ?? "PUBLIC", status: project?.status ?? "DRAFT",
  };
}

function initialCaseStudy(project?: EditableProject): CaseStudyState {
  const hero = block(project, "CASE_HERO");
  const legacyHero = block(project, "HERO");
  const summary = block(project, "CASE_SUMMARY");
  const gallery = block(project, "CASE_GALLERY");
  const next = block(project, "CASE_NEXT");
  return {
    eyebrow: stringValue(hero.eyebrow, project?.industry ? project.industry.toUpperCase() : defaultCaseStudy.eyebrow),
    lede: stringValue(hero.lede, project?.description ?? project?.excerpt ?? defaultCaseStudy.lede),
    heroVisualUrl: stringValue(hero.heroVisualUrl, stringValue(legacyHero.imageUrl, defaultCaseStudy.heroVisualUrl)),
    heroVisualAlt: stringValue(hero.heroVisualAlt, stringValue(legacyHero.imageAlt, defaultCaseStudy.heroVisualAlt)),
    summaryHeading: stringValue(summary.heading, defaultCaseStudy.summaryHeading),
    summaryIntro: stringValue(summary.intro, defaultCaseStudy.summaryIntro),
    overview: stringValue(summary.overview, defaultCaseStudy.overview),
    contribution: stringValue(summary.contribution, defaultCaseStudy.contribution),
    challenge: stringValue(summary.challenge, defaultCaseStudy.challenge),
    deliverables: Array.isArray(summary.deliverables) ? summary.deliverables.join(", ") : defaultCaseStudy.deliverables,
    galleryHeading: stringValue(gallery.heading, defaultCaseStudy.galleryHeading),
    galleryIntro: stringValue(gallery.intro, defaultCaseStudy.galleryIntro),
    galleryNote: stringValue(gallery.note, defaultCaseStudy.galleryNote),
    gallery: galleryValue(gallery.items),
    feature: caseFeatureValue(block(project, "CASE_FEATURE")),
    nextLabel: stringValue(next.label, defaultCaseStudy.nextLabel),
    nextTitle: stringValue(next.title, defaultCaseStudy.nextTitle),
    nextText: stringValue(next.text, defaultCaseStudy.nextText),
    nextUrl: stringValue(next.url, defaultCaseStudy.nextUrl),
  };
}

function asPayload(state: FormState) {
  const text = (value: string) => value.trim() || undefined;
  const tags = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
  return {
    title: state.title.trim(), slug: text(state.slug), excerpt: text(state.excerpt), description: text(state.description),
    client: text(state.client), industry: text(state.industry), year: state.year ? Number(state.year) : undefined,
    role: text(state.role), duration: text(state.duration), platform: text(state.platform), services: tags(state.services),
    tools: tags(state.tools), featured: state.featured, nda: state.nda, visibility: state.visibility,
  };
}

function blocksPayload(state: CaseStudyState) {
  const deliverables = state.deliverables.split(",").map((item) => item.trim()).filter(Boolean);
  const blocks = [
    { type: "CASE_HERO", title: "Case Study Hero", sortOrder: 0, isVisible: true, content: { eyebrow: state.eyebrow, lede: state.lede, heroVisualUrl: state.heroVisualUrl, heroVisualAlt: state.heroVisualAlt } },
    { type: "CASE_SUMMARY", title: "Project Summary", sortOrder: 1, isVisible: true, content: { heading: state.summaryHeading, intro: state.summaryIntro, overview: state.overview, contribution: state.contribution, challenge: state.challenge, deliverables } },
    { type: "CASE_GALLERY", title: "UI Gallery", sortOrder: 2, isVisible: true, content: { heading: state.galleryHeading, intro: state.galleryIntro, note: state.galleryNote, items: state.gallery } },
    ...(state.feature ? [{ type: "CASE_FEATURE", title: "Product Feature", sortOrder: 3, isVisible: true, content: { ...state.feature, titleLines: state.feature.titleLines.split("\n").map((line) => line.trim()).filter(Boolean) } }] : []),
    { type: "CASE_NEXT", title: "Next Case Study", sortOrder: state.feature ? 4 : 3, isVisible: true, content: { label: state.nextLabel, title: state.nextTitle, text: state.nextText, url: state.nextUrl } },
  ];
  return {
    blocks,
  };
}

export function ProjectEditor({ project, user }: { project?: EditableProject; user: SessionUser }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialState(project));
  const [caseStudy, setCaseStudy] = useState<CaseStudyState>(() => initialCaseStudy(project));
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState("");

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function setCaseField<K extends keyof CaseStudyState>(field: K, value: CaseStudyState[K]) {
    setCaseStudy((current) => ({ ...current, [field]: value }));
  }

  function setGallery(index: number, patch: Partial<GalleryItem>) {
    setCaseStudy((current) => ({
      ...current,
      gallery: current.gallery.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }));
  }

  function setFeature(index: number, patch: Partial<CaseFeatureImage>) {
    setCaseStudy((current) => current.feature ? {
      ...current,
      feature: {
        ...current.feature,
        images: current.feature.images.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
      },
    } : current);
  }

  async function uploadImage(target: "hero" | number | ["feature", number], file: File) {
    const uploadKey = Array.isArray(target) ? `feature-${target[1]}` : String(target);
    setUploading(uploadKey);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${apiUrl}/api/v1/admin/media/upload`, { method: "POST", credentials: "include", body: formData });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) { setError(body?.message ?? "Image could not be uploaded."); return; }
      if (target === "hero") setCaseField("heroVisualUrl", body.data.url);
      else if (Array.isArray(target)) setFeature(target[1], { url: body.data.url });
      else setGallery(target, { image: body.data.url });
    } catch {
      setError("Upload service is unavailable.");
    } finally {
      setUploading("");
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice(""); setSaving(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/projects${project ? `/${project.id}` : ""}`, {
        method: project ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(asPayload(form)),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) { setError(body?.message ?? "Project could not be saved."); return; }
      const projectId = project?.id ?? body.data.id;
      const blocksResponse = await fetch(`${apiUrl}/api/v1/admin/projects/${projectId}/blocks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(blocksPayload(caseStudy)),
      });
      const blocksBody = await blocksResponse.json().catch(() => null);
      if (!blocksResponse.ok || !blocksBody?.success) { setError(blocksBody?.message ?? "Case study detail could not be saved."); return; }
      if (!project) { router.replace(`/projects/${projectId}`); return; }
      setNotice("Project and case study detail saved successfully."); router.refresh();
    } catch { setError("CMS API is unavailable."); } finally { setSaving(false); }
  }

  async function transition(action: "publish" | "unpublish" | "delete") {
    if (!project) return;
    setError(""); setNotice(""); setPublishing(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/projects/${project.id}${action === "delete" ? "" : `/${action}`}`, { method: action === "delete" ? "DELETE" : "POST", credentials: "include" });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) { setError(body?.message ?? "Project status could not be changed."); return; }
      if (action === "delete") { router.replace("/projects"); return; }
      setNotice(action === "publish" ? "Project published." : "Project moved to draft."); router.refresh();
    } catch { setError("CMS API is unavailable."); } finally { setPublishing(false); }
  }

  return (
    <CmsWorkspace user={user} active="Projects" title={project ? "Edit Project" : "New Project"} subtitle={project ? "Update project details and publishing settings." : "Create a new portfolio project."}>
      <div className="cms-module-body cms-editor-modern">
        <div className="cms-editor-modern__toolbar">
          <a href="/projects">← Back to Projects</a>
          <div>
            <span className={`cms-editor__status status-${form.status.replaceAll("_", "-").toLowerCase()}`}>{form.status.replaceAll("_", " ")}</span>
            {project && <button className="cms-secondary-action" type="button" onClick={() => transition(form.status === "PUBLISHED" ? "unpublish" : "publish")} disabled={publishing}>{form.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button>}
            <button className="cms-module-primary" type="submit" form="project-editor" disabled={saving}>{saving ? <Check size={16} /> : <Save size={16} />}{saving ? "Saving" : "Save Project"}</button>
          </div>
        </div>

        <form id="project-editor" className="cms-modern-form" onSubmit={save}>
          <section className="cms-editor-panel">
            <header><div><h2>Core Details</h2><p>Project name, URL, and primary case study content.</p></div><span>01</span></header>
            <div className="cms-form-grid">
              <label className="cms-field cms-field--wide">Title<input value={form.title} onChange={(event) => setField("title", event.target.value)} required /></label>
              <label className="cms-field">Slug<input value={form.slug} onChange={(event) => setField("slug", event.target.value)} placeholder="Generated from title when empty" /></label>
              <label className="cms-field">Year<input value={form.year} onChange={(event) => setField("year", event.target.value)} type="number" min="1900" max="2100" /></label>
              <label className="cms-field cms-field--wide">Short Description<textarea value={form.excerpt} onChange={(event) => setField("excerpt", event.target.value)} rows={3} /></label>
              <label className="cms-field cms-field--wide">Case Study Description<textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={6} /></label>
            </div>
          </section>

          <section className="cms-editor-panel">
            <header><div><h2>Project Context</h2><p>Supporting information shown throughout the portfolio.</p></div><span>02</span></header>
            <div className="cms-form-grid">
              <label className="cms-field">Client<input value={form.client} onChange={(event) => setField("client", event.target.value)} /></label>
              <label className="cms-field">Industry<input value={form.industry} onChange={(event) => setField("industry", event.target.value)} /></label>
              <label className="cms-field">Role<input value={form.role} onChange={(event) => setField("role", event.target.value)} /></label>
              <label className="cms-field">Duration<input value={form.duration} onChange={(event) => setField("duration", event.target.value)} /></label>
              <label className="cms-field">Platform<input value={form.platform} onChange={(event) => setField("platform", event.target.value)} /></label>
              <label className="cms-field">Visibility<select value={form.visibility} onChange={(event) => setField("visibility", event.target.value as FormState["visibility"])}><option value="PUBLIC">Public</option><option value="UNLISTED">Unlisted</option><option value="PRIVATE">Private</option><option value="PASSWORD_PROTECTED">Password protected</option></select></label>
              <label className="cms-field cms-field--wide">Services<input value={form.services} onChange={(event) => setField("services", event.target.value)} placeholder="Research, UX, UI design" /></label>
              <label className="cms-field cms-field--wide">Tools<input value={form.tools} onChange={(event) => setField("tools", event.target.value)} placeholder="Figma, FigJam, Maze" /></label>
            </div>
            <div className="cms-checkboxes"><label><input type="checkbox" checked={form.featured} onChange={(event) => setField("featured", event.target.checked)} />Featured project</label><label><input type="checkbox" checked={form.nda} onChange={(event) => setField("nda", event.target.checked)} />NDA restricted</label></div>
          </section>

          <section className="cms-editor-panel cms-case-detail-editor">
            <header><div><h2>Case Study Detail</h2><p>Controls the public detail page for this project.</p></div><span>03</span></header>
            <div className="cms-form-grid">
              <label className="cms-field cms-field--wide">Hero Eyebrow<input value={caseStudy.eyebrow} onChange={(event) => setCaseField("eyebrow", event.target.value)} /></label>
              <label className="cms-field cms-field--wide">Hero Lead<textarea value={caseStudy.lede} onChange={(event) => setCaseField("lede", event.target.value)} rows={4} /></label>
              <label className="cms-field cms-field--wide">Hero Visual URL<input value={caseStudy.heroVisualUrl} onChange={(event) => setCaseField("heroVisualUrl", event.target.value)} /></label>
              <label className="cms-upload-field">Hero Visual Upload<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage("hero", file); }} /><span><ImagePlus size={15} />{uploading === "hero" ? "Uploading" : "Upload hero image"}</span></label>
              <label className="cms-field cms-field--wide">Hero Visual Alt<input value={caseStudy.heroVisualAlt} onChange={(event) => setCaseField("heroVisualAlt", event.target.value)} /></label>
              <label className="cms-field cms-field--wide">Summary Heading<textarea value={caseStudy.summaryHeading} onChange={(event) => setCaseField("summaryHeading", event.target.value)} rows={3} /></label>
              <label className="cms-field cms-field--wide">Summary Intro<textarea value={caseStudy.summaryIntro} onChange={(event) => setCaseField("summaryIntro", event.target.value)} rows={4} /></label>
              <label className="cms-field cms-field--wide">Overview<textarea value={caseStudy.overview} onChange={(event) => setCaseField("overview", event.target.value)} rows={5} /></label>
              <label className="cms-field cms-field--wide">My Contribution<textarea value={caseStudy.contribution} onChange={(event) => setCaseField("contribution", event.target.value)} rows={5} /></label>
              <label className="cms-field cms-field--wide">The Challenge<textarea value={caseStudy.challenge} onChange={(event) => setCaseField("challenge", event.target.value)} rows={5} /></label>
              <label className="cms-field cms-field--wide">Deliverables<input value={caseStudy.deliverables} onChange={(event) => setCaseField("deliverables", event.target.value)} placeholder="MOBILE FLOWS, DESIGN SYSTEM" /></label>
              <label className="cms-field cms-field--wide">Gallery Heading<textarea value={caseStudy.galleryHeading} onChange={(event) => setCaseField("galleryHeading", event.target.value)} rows={3} /></label>
              <label className="cms-field cms-field--wide">Gallery Intro<textarea value={caseStudy.galleryIntro} onChange={(event) => setCaseField("galleryIntro", event.target.value)} rows={3} /></label>
            </div>

            <div className="cms-gallery-editor">
              <header><strong>Gallery Items</strong><button type="button" onClick={() => setCaseField("gallery", [...caseStudy.gallery, { number: String(caseStudy.gallery.length + 1).padStart(2, "0"), title: "", type: "", image: "", className: "" }])}><Plus size={14} />Add Image</button></header>
              {caseStudy.gallery.map((item, index) => (
                <div className="cms-gallery-editor__item" key={`${item.number}-${index}`}>
                  <label className="cms-field">Number<input value={item.number} onChange={(event) => setGallery(index, { number: event.target.value })} /></label>
                  <label className="cms-field">Title<input value={item.title} onChange={(event) => setGallery(index, { title: event.target.value })} /></label>
                  <label className="cms-field">Type<input value={item.type} onChange={(event) => setGallery(index, { type: event.target.value })} /></label>
                  <label className="cms-field">Layout<select value={item.className} onChange={(event) => setGallery(index, { className: event.target.value })}><option value="">Half width</option><option value="is-wide">Full width</option></select></label>
                  <label className="cms-field cms-field--wide">Image URL<input value={item.image} onChange={(event) => setGallery(index, { image: event.target.value })} /></label>
                  <label className="cms-upload-field"><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(index, file); }} /><span><ImagePlus size={15} />{uploading === String(index) ? "Uploading" : "Upload image"}</span></label>
                  <button className="cms-gallery-remove" type="button" onClick={() => setCaseField("gallery", caseStudy.gallery.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} />Remove</button>
                </div>
              ))}
            </div>

            <div className="cms-gallery-editor cms-case-feature-editor">
              <header><strong>Product Feature</strong>{!caseStudy.feature && <button type="button" onClick={() => setCaseField("feature", { eyebrow: "PRODUCT EXPERIENCE", titleLines: "FINANCIAL\nVISIBILITY.", description: "", platform: "Mobile application", scope: "Financial dashboard / Personal finance", images: [], layout: "media-right" })}><Plus size={14} />Add Feature</button>}</header>
              {caseStudy.feature && <div className="cms-form-grid">
                <label className="cms-field">Eyebrow<input value={caseStudy.feature.eyebrow} onChange={(event) => setCaseField("feature", { ...caseStudy.feature!, eyebrow: event.target.value })} /></label>
                <label className="cms-field">Layout<select value={caseStudy.feature.layout} onChange={(event) => setCaseField("feature", { ...caseStudy.feature!, layout: event.target.value as CaseFeature["layout"] })}><option value="media-right">Media right</option><option value="media-left">Media left</option></select></label>
                <label className="cms-field cms-field--wide">Heading<textarea value={caseStudy.feature.titleLines} onChange={(event) => setCaseField("feature", { ...caseStudy.feature!, titleLines: event.target.value })} rows={2} /></label>
                <label className="cms-field cms-field--wide">Description<textarea value={caseStudy.feature.description} onChange={(event) => setCaseField("feature", { ...caseStudy.feature!, description: event.target.value })} rows={4} /></label>
                <label className="cms-field">Platform<input value={caseStudy.feature.platform} onChange={(event) => setCaseField("feature", { ...caseStudy.feature!, platform: event.target.value })} /></label>
                <label className="cms-field">Scope<input value={caseStudy.feature.scope} onChange={(event) => setCaseField("feature", { ...caseStudy.feature!, scope: event.target.value })} /></label>
                <div className="cms-field cms-field--wide cms-feature-images-field">
                  <div className="cms-feature-images-field__header"><span>Images</span><button type="button" onClick={() => setCaseField("feature", { ...caseStudy.feature!, images: [...caseStudy.feature!.images, { url: "", alt: "" }] })}><Plus size={14} />Add Image</button></div>
                  {caseStudy.feature.images.map((image, index) => <div className="cms-feature-image-item" key={`${index}-${image.url}`}>
                    <label className="cms-field">Image URL<input value={image.url} onChange={(event) => setFeature(index, { url: event.target.value })} /></label>
                    <label className="cms-field">Alt Text<input value={image.alt} onChange={(event) => setFeature(index, { alt: event.target.value })} /></label>
                    <label className="cms-upload-field"><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(["feature", index], file); }} /><span><ImagePlus size={15} />{uploading === `feature-${index}` ? "Uploading" : "Upload image"}</span></label>
                    <button className="cms-gallery-remove" type="button" onClick={() => setCaseField("feature", { ...caseStudy.feature!, images: caseStudy.feature!.images.filter((_, imageIndex) => imageIndex !== index) })}><Trash2 size={14} />Remove</button>
                  </div>)}
                </div>
              </div>}
            </div>

            <div className="cms-form-grid">
              <label className="cms-field cms-field--wide">Gallery Note<input value={caseStudy.galleryNote} onChange={(event) => setCaseField("galleryNote", event.target.value)} /></label>
              <label className="cms-field">Next Label<input value={caseStudy.nextLabel} onChange={(event) => setCaseField("nextLabel", event.target.value)} /></label>
              <label className="cms-field cms-field--wide">Next Title<input value={caseStudy.nextTitle} onChange={(event) => setCaseField("nextTitle", event.target.value)} /></label>
              <label className="cms-field cms-field--wide">Next Text<textarea value={caseStudy.nextText} onChange={(event) => setCaseField("nextText", event.target.value)} rows={3} /></label>
              <label className="cms-field cms-field--wide">Next URL<input value={caseStudy.nextUrl} onChange={(event) => setCaseField("nextUrl", event.target.value)} /></label>
            </div>
          </section>

          {error && <p className="cms-form-message cms-form-message--error" role="alert">{error}</p>}
          {notice && <p className="cms-form-message">{notice}</p>}
        </form>

        {project && <footer className="cms-modern-editor-footer"><a href={`http://localhost:3100/case-study/${project.slug}`} target="_blank" rel="noreferrer"><Eye size={16} />Open public URL</a><button type="button" onClick={() => transition("delete")} disabled={publishing}><Archive size={16} />Archive project</button></footer>}
      </div>
    </CmsWorkspace>
  );
}
