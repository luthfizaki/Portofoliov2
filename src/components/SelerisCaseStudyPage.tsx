import { useEffect, useMemo, useState } from "react";
import { publicApiUrl } from "../lib/apiBase";

const fallbackDeliverables = [
  "MOBILE FLOWS",
  "ENTERPRISE DASHBOARD",
  "DESIGN SYSTEM",
  "PROTOTYPE",
  "REPORT UI",
  "UAT SUPPORT"
];

const fallbackGallery = [
  { number: "01", title: "GUIDED ASSESSMENT JOURNEY", type: "MOBILE APPLICATION", image: "/case-studies/seleris/gallery-assessment.png", className: "is-wide" },
  { number: "02", title: "RESULT EXPERIENCE", type: "DASHBOARD", image: "/case-studies/seleris/gallery-result.png", className: "" },
  { number: "03", title: "BUSINESS OPERATIONS", type: "DASHBOARD", image: "/case-studies/seleris/gallery-business.png", className: "" }
];

type ProjectBlock = { type: string; content: Record<string, unknown> };
type PublicProject = {
  title: string;
  slug: string;
  excerpt: string | null;
  description: string | null;
  industry: string | null;
  role: string | null;
  platform: string | null;
  services: string[];
  coverUrl: string | null;
  coverAlt: string | null;
  blocks: ProjectBlock[];
};

const allowCaseStudyFallback = import.meta.env.DEV;

function SectionLabel({ number, children }: { number: string; children: string }) {
  return (
    <div className="case-study__section-label">
      <span>{number}</span>
      <i aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function block(project: PublicProject | null, type: string) {
  return project?.blocks?.find((item) => item.type === type)?.content ?? {};
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function fallbackValue(value: string, fallback = "") {
  return allowCaseStudyFallback ? value : fallback;
}

function arrayValue(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : allowCaseStudyFallback ? fallback : [];
}

function galleryValue(value: unknown) {
  if (!Array.isArray(value)) return allowCaseStudyFallback ? fallbackGallery : [];
  return value.map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      number: stringValue(record.number, String(index + 1).padStart(2, "0")),
      title: stringValue(record.title),
      type: stringValue(record.type),
      image: stringValue(record.image),
      className: stringValue(record.className)
    };
  }).filter((item) => item.image);
}

export function SelerisCaseStudyPage({ slug = "seleris-superapp" }: { slug?: string }) {
  const [project, setProject] = useState<PublicProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.classList.add("case-study-is-visible");
    window.scrollTo(0, 0);
    return () => document.body.classList.remove("case-study-is-visible");
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchProject() {
      try {
        const response = await fetch(`${publicApiUrl}/api/v1/public/projects/${slug}`);
        const body = await response.json();
        if (!cancelled && response.ok && body?.success) setProject(body.data);
      } catch (error) {
        if (allowCaseStudyFallback) {
          console.warn("Project detail API unavailable; development fallback case study content is active.", error);
        } else {
          console.error("Project detail API unavailable; production fallback content is disabled.", error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchProject();
    return () => { cancelled = true; };
  }, [slug]);

  const content = useMemo(() => {
    const hero = block(project, "CASE_HERO");
    const legacyHero = block(project, "HERO");
    const summary = block(project, "CASE_SUMMARY");
    const gallery = block(project, "CASE_GALLERY");
    const next = block(project, "CASE_NEXT");
    return {
      title: project?.title ?? fallbackValue("SELERIS SUPERAPP"),
      eyebrow: stringValue(hero.eyebrow, project?.industry?.toUpperCase() ?? fallbackValue("HEALTHTECH / INSURTECH / PRODUCT DESIGN")),
      lede: stringValue(hero.lede, project?.excerpt ?? project?.description ?? fallbackValue("A connected health and insurance ecosystem designed across mobile applications, underwriting journeys, reporting, affiliate operations, and enterprise dashboards.")),
      heroVisualUrl: stringValue(hero.heroVisualUrl, stringValue(legacyHero.imageUrl, project?.coverUrl ?? fallbackValue("/case-studies/seleris/hero-visual.png"))),
      heroVisualAlt: stringValue(hero.heroVisualAlt, stringValue(legacyHero.imageAlt, project?.coverAlt ?? project?.title ?? fallbackValue("Seleris Care and Seleris Life interface collection"))),
      role: project?.role ?? fallbackValue("Product Designer"),
      platform: project?.platform ?? fallbackValue("Mobile App & Dashboard"),
      scope: project?.services?.length ? project.services.join(" · ") : fallbackValue("UX/UI · System · UAT"),
      summaryHeading: stringValue(summary.heading, fallbackValue("A CLOSER VIEW\nOF THE PROJECT.")),
      summaryIntro: stringValue(summary.intro, project?.description ?? fallbackValue("Seleris SuperApp is a connected product ecosystem that combines health assessment, insurance underwriting, reporting, affiliate operations, and enterprise monitoring across mobile and dashboard experiences.")),
      overview: stringValue(summary.overview, project?.description ?? fallbackValue("CARE and LIFE operate within one product family. CARE supports personal and business health experiences, including scanning, family plans, weekly results, recommendations, affiliate packages, commissions, and withdrawals. LIFE supports insurance underwriting through identity verification, structured forms, face and appearance scanning, processing, and assessment results.")),
      contribution: stringValue(summary.contribution, fallbackValue("I worked across product definition and implementation support-turning requirements and backend logic into user flows, information architecture, high-fidelity interfaces, reusable patterns, interactive prototypes, and implementation-ready specifications. I also collaborated with frontend, backend, QA, and stakeholders during refinement and UAT.")),
      challenge: stringValue(summary.challenge, fallbackValue("The main challenge was not only visual design, but translating long and data-heavy workflows into clear steps. Different users needed different levels of information, while product rules, backend states, scanning conditions, failure scenarios, and underwriting outputs still had to remain consistent and understandable.")),
      deliverables: arrayValue(summary.deliverables, fallbackDeliverables),
      galleryHeading: stringValue(gallery.heading, fallbackValue("SELECTED\nINTERFACES.")),
      galleryIntro: stringValue(gallery.intro, fallbackValue("This section is fully repeatable. Each uploaded item only needs an image, optional caption, and layout type: full width or half width.")),
      galleryNote: stringValue(gallery.note, fallbackValue("CMS BLOCKS / FULL WIDTH / TWO COLUMN / OPTIONAL CAPTION")),
      galleryItems: galleryValue(gallery.items),
      nextLabel: stringValue(next.label, fallbackValue("NEXT CASE STUDY")),
      nextTitle: stringValue(next.title, fallbackValue("NOTEIT - AUTOMATIC NOTE-TAKING APP")),
      nextText: stringValue(next.text, fallbackValue("A focused mobile UI project for capturing and organizing important information.")),
      nextUrl: stringValue(next.url, "/#flagship-products")
    };
  }, [project]);

  if (!loading && !project && !allowCaseStudyFallback) {
    return (
      <main className="case-study" aria-labelledby="case-study-title">
        <section className="case-study__hero">
          <div className="case-study__container">
            <div className="case-study__topbar">
              <a href="/#flagship-products">←&nbsp; BACK TO SELECTED WORK</a>
              <span>CASE STUDY&nbsp; / &nbsp;{slug}</span>
            </div>
            <div className="case-study__hero-copy">
              <p className="case-study__eyebrow">PROJECT UNAVAILABLE</p>
              <h1 id="case-study-title">Case study not found</h1>
              <p className="case-study__lede">This project is not currently available through the public portfolio API.</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="case-study" aria-labelledby="case-study-title">
      <section className="case-study__hero">
        <div className="case-study__ambient case-study__ambient--hero" />
        <div className="case-study__container">
          <div className="case-study__topbar">
            <a href="/#flagship-products">←&nbsp; BACK TO SELECTED WORK</a>
            <span>CASE STUDY&nbsp; / &nbsp;{project?.slug ?? slug}</span>
          </div>

          <div className="case-study__hero-grid">
            <div className="case-study__hero-copy">
              <p className="case-study__eyebrow">{content.eyebrow}</p>
              <h1 id="case-study-title">{content.title}</h1>
              <p className="case-study__lede">{content.lede}</p>
              <dl className="case-study__meta">
                <div><dt>ROLE</dt><dd>{content.role}</dd></div>
                <div><dt>PLATFORM</dt><dd>{content.platform}</dd></div>
                <div><dt>SCOPE</dt><dd>{content.scope}</dd></div>
              </dl>
            </div>

            <div className="case-study__hero-visual">
              <img src={content.heroVisualUrl} alt={content.heroVisualAlt} />
            </div>
          </div>
        </div>
      </section>

      <section className="case-study__summary">
        <div className="case-study__container">
          <div className="case-study__rule" />
          <SectionLabel number="01">PROJECT SUMMARY</SectionLabel>
          <div className="case-study__section-heading">
            <h2>{content.summaryHeading.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h2>
            <p>{content.summaryIntro}</p>
          </div>
          <div className="case-study__summary-grid">
            <article><span className="is-blue">OVERVIEW</span><p>{content.overview}</p></article>
            <article><span className="is-green">MY CONTRIBUTION</span><p>{content.contribution}</p></article>
            <article><span className="is-pink">THE CHALLENGE</span><p>{content.challenge}</p></article>
            <article><span className="is-blue">KEY DELIVERABLES</span><div className="case-study__tags">{content.deliverables.map((item, index) => <span className={`is-accent-${index % 3}`} key={item}>{item}</span>)}</div></article>
          </div>
        </div>
      </section>

      <section className="case-study__gallery">
        <div className="case-study__container">
          <div className="case-study__rule" />
          <SectionLabel number="02">UI GALLERY</SectionLabel>
          <div className="case-study__section-heading">
            <h2>{content.galleryHeading.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h2>
            <p>{content.galleryIntro}</p>
          </div>
          <div className="case-study__gallery-grid">
            {content.galleryItems.map((item) => (
              <figure className={item.className || ""} key={`${item.number}-${item.image}`}>
                <img src={item.image} alt={item.title.toLowerCase()} loading="lazy" />
              </figure>
            ))}
          </div>
          <p className="case-study__cms-note">{content.galleryNote}</p>
        </div>
      </section>

      <section className="case-study__next">
        <div className="case-study__ambient case-study__ambient--next" />
        <div className="case-study__container">
          <div className="case-study__rule case-study__rule--dark" />
          <div className="case-study__next-grid">
            <div><span>{content.nextLabel}</span><h2>{content.nextTitle}</h2></div>
            <div><p>{content.nextText}</p><a href={content.nextUrl}>VIEW NEXT PROJECT&nbsp; ↗</a></div>
          </div>
        </div>
      </section>
    </main>
  );
}
