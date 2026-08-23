import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import defaultAbout from "../../data/about.json";
import defaultCapabilitiesTools from "../../data/capabilities-tools.json";
import defaultCollaborationTestimonials from "../../data/collaboration-testimonials.json";
import defaultContactFinalStatement from "../../data/contact-final-statement.json";
import defaultCreativePractice from "../../data/creative-practice.json";
import defaultExperience from "../../data/experience.json";
import defaultFlagshipProducts from "../../data/flagship-products.json";
import defaultHowIWork from "../../data/how-i-work.json";
import defaultProjectArchive from "../../data/project-archive.json";
import defaultSelectedWork from "../../data/selected-work.json";
import defaultSkills from "../../data/skills.json";
import { publicApiUrl } from "../lib/apiBase";

export interface HeroContent {
  role: string;
  yearsRange: string;
  experienceYears: string;
  backgroundBlurUrl?: string;
  backgroundSharpUrl?: string;
  firstName: string;
  lastName: string;
  tagline: string;
  taglineHighlight: string;
  sideTexts: Array<{ text: string }>;
  scrollIndicatorText: string;
  ctaText: string;
  ctaLink: string;
}

export interface AboutContent {
  sectionNumber: string;
  sectionLabel: string;
  headlineLines: string[];
  focus: string;
  lead: string;
  paragraphs: string[];
  metrics: Array<{ value: string; label: string }>;
  footerNote: string;
  portraitUrl: string;
}

export interface ExperienceContent {
  sectionNumber: string;
  sectionLabel: string;
  headlineLines: string[];
  intro: string;
  selectedLabel: string;
  selectedRange: string;
  footerNote: string;
  rows: Array<{
    year: string;
    role: string;
    company: string;
    contribution: string;
    tags: string[];
    featured?: boolean;
  }>;
}

export interface SelectedWorkContent {
  sectionNumber: string;
  sectionLabel: string;
  headlineLines: string[];
  intro: string;
  disciplines: Array<{
    number: string;
    label: string;
    featured?: boolean;
  }>;
  footerNote: string;
  collageUrl: string;
}

export interface FlagshipProductsContent {
  sectionNumber: string;
  sectionLabel: string;
  headlineLines: string[];
  intro: string;
  footerNote: string;
  projects: Array<{
    number: string;
    eyebrow: string;
    titleLines: string[];
    description: string;
    role: string;
    platform: string;
    scope: string;
    linkLabel: string;
    linkUrl: string;
    visualUrl: string;
    visualAlt: string;
    glowUrl?: string;
    layout: "media-left" | "media-right";
    featured?: boolean;
  }>;
}

export interface CreativePracticeContent {
  sectionNumber: string;
  sectionLabel: string;
  headlineLines: string[];
  intro: string;
  cards: Array<{
    anchorId: string;
    number: string;
    titleLines: string[];
    description: string;
    tags: string[];
    imageUrl: string;
    imageAlt: string;
    linkUrl: string;
    linkLabel: string;
    openInNewTab: boolean;
    theme: "light" | "dark";
  }>;
}

export interface ProjectArchiveContent {
  sectionNumber: string;
  sectionLabel: string;
  headline: string;
  intro: string;
  footerNote: string;
  projects: Array<{
    year: string;
    title: string;
    category: string;
    output: string;
    linkUrl: string;
    featured?: boolean;
  }>;
}

export interface SkillsContent {
  sectionNumber: string;
  sectionLabel: string;
  headlineLines: string[];
  intro: string;
  summaryLabel: string;
  summary: string;
  footerNote: string;
  categories: Array<{ name: string; count: number }>;
  items: Array<{
    name: string;
    category: string;
    description: string;
    level: number;
    tools: string[];
    featured?: boolean;
  }>;
}

interface PublicPageResponse {
  success: boolean;
  data: { sections: Array<{ type: string; content: unknown }> };
}

interface PublicContentResponse<T> {
  success: boolean;
  data: T;
}

interface PublicProjectsResponse {
  success: boolean;
  data: PublicProject[];
}

interface PublicExperienceResponse {
  rows?: unknown;
}

interface PublicProjectBlock {
  type: string;
  title: string | null;
  content: Record<string, unknown>;
  sortOrder: number;
  layoutVariant: string | null;
}

interface PublicProject {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  description: string | null;
  client: string | null;
  industry: string | null;
  year: number | null;
  role: string | null;
  duration: string | null;
  platform: string | null;
  services: string[];
  tools: string[];
  featured: boolean;
  sortOrder: number;
  coverUrl: string | null;
  coverAlt: string | null;
  categories: Array<{ name: string; slug: string }>;
  tags: Array<{ name: string; slug: string }>;
  metrics: Array<{ value: string; label: string; note: string | null; sortOrder: number }>;
  blocks: PublicProjectBlock[];
}

export interface HowIWorkContent {
  sectionNumber: string;
  sectionLabel: string;
  headlineLines: string[];
  intro: string;
  processNote: string;
  steps: Array<{
    number: string;
    titleLines: string[];
    description: string;
    tags: string[];
    accent: "blue" | "periwinkle" | "warm" | "green";
  }>;
  collaborationLabel: string;
  collaborationText: string;
  collaborationNote: string;
  collaborationDots: string[];
  footerNote: string;
}

export interface CapabilitiesToolsContent {
  sectionNumber: string;
  sectionLabel: string;
  headlineLines: string[];
  intro: string;
  applicationNote: string;
  capabilities: Array<{
    number: string;
    title: string;
    description: string;
    tags: string[];
    badge: string;
    accent: "blue" | "ink" | "warm";
    tone: "blue" | "white" | "warm";
  }>;
  toolsLabel: string;
  toolsDescription: string;
  tools: Array<{
    label: string;
    featured?: boolean;
  }>;
}

export interface CollaborationTestimonialsContent {
  sectionNumber: string;
  sectionLabel: string;
  headlineLines: string[];
  intro: string;
  perspectiveNote: string;
  testimonials: Array<{
    number: string;
    featured?: boolean;
    featuredLabel?: string;
    quote: string;
    name: string;
    initial: string;
    role: string;
    company: string;
    avatarUrl: string;
    accent: "blue" | "purple" | "green";
    tags?: string[];
  }>;
  principleLabel: string;
  principle: string;
  principleTags: string;
  ambientDotUrl: string;
}

export interface ContactFinalStatementContent {
  sectionNumber: string;
  sectionLabel: string;
  headlineLines: string[];
  intro: string;
  availabilityLabel: string;
  availabilityLocation: string;
  availabilityDotUrl: string;
  ambientOrbUrl: string;
  links: Array<{
    number: string;
    label: string;
    title: string;
    detail: string;
    url: string;
    accent: "blue" | "light" | "green";
    openInNewTab: boolean;
  }>;
  openToLabel: string;
  openTo: string;
  copyright: string;
  footerStatement: string;
  backToTopLabel: string;
}

interface HeroSettings {
  navLinks: Array<{ label: string; id: string }>;
  personalInfo: { email: string };
  footer: { availability: string };
}

interface ContentValue {
  hero: HeroContent | null;
  about: AboutContent;
  experience: ExperienceContent;
  selectedWork: SelectedWorkContent;
  flagshipProducts: FlagshipProductsContent;
  creativePractice: CreativePracticeContent;
  projectArchive: ProjectArchiveContent;
  skills: SkillsContent;
  howIWork: HowIWorkContent;
  capabilitiesTools: CapabilitiesToolsContent;
  collaborationTestimonials: CollaborationTestimonialsContent;
  contactFinalStatement: ContactFinalStatementContent;
  settings: HeroSettings;
  visibleSections: string[] | null;
  loading: boolean;
  refresh: () => void;
}

const settings: HeroSettings = {
  navLinks: [
    { label: "Home", id: "home" },
    { label: "About", id: "about" },
    { label: "Experience", id: "experience" },
    { label: "Project", id: "projects" },
    { label: "Skill", id: "skills" },
    { label: "Contact", id: "contact" }
  ],
  personalInfo: {
    email: "hi@luthfiarzaki.com"
  },
  footer: {
    availability: "Full-time, Freelance, and Contract Projects"
  }
};

const ContentContext = createContext<ContentValue>({
  hero: null,
  about: defaultAbout,
  experience: defaultExperience,
  selectedWork: defaultSelectedWork,
  flagshipProducts: defaultFlagshipProducts as FlagshipProductsContent,
  creativePractice: defaultCreativePractice as CreativePracticeContent,
  projectArchive: defaultProjectArchive as ProjectArchiveContent,
  skills: defaultSkills as SkillsContent,
  howIWork: defaultHowIWork as HowIWorkContent,
  capabilitiesTools: defaultCapabilitiesTools as CapabilitiesToolsContent,
  collaborationTestimonials:
    defaultCollaborationTestimonials as CollaborationTestimonialsContent,
  contactFinalStatement:
    defaultContactFinalStatement as ContactFinalStatementContent,
  settings,
  visibleSections: null,
  loading: true,
  refresh: () => undefined
});

const allowLocalDefaults = import.meta.env.DEV;
const flagshipProjectLimit = 3;

const emptyExperience: ExperienceContent = {
  ...(defaultExperience as ExperienceContent),
  rows: []
};

const emptyFlagshipProducts: FlagshipProductsContent = {
  ...(defaultFlagshipProducts as FlagshipProductsContent),
  projects: []
};

const emptyProjectArchive: ProjectArchiveContent = {
  ...(defaultProjectArchive as ProjectArchiveContent),
  projects: []
};

const emptyTestimonials: CollaborationTestimonialsContent = {
  ...(defaultCollaborationTestimonials as CollaborationTestimonialsContent),
  testimonials: []
};

const emptyContactFinalStatement: ContactFinalStatementContent = {
  sectionNumber: "",
  sectionLabel: "",
  headlineLines: [],
  intro: "",
  availabilityLabel: "",
  availabilityLocation: "",
  availabilityDotUrl: "",
  ambientOrbUrl: "",
  links: [],
  openToLabel: "",
  openTo: "",
  copyright: "",
  footerStatement: "",
  backToTopLabel: ""
};

export function useContent() {
  return useContext(ContentContext);
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function mapExperienceRows(value: unknown): ExperienceContent["rows"] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    return [{
      year: stringValue(row.year),
      role: stringValue(row.role),
      company: stringValue(row.company),
      contribution: stringValue(row.contribution),
      tags: stringArray(row.tags),
      featured: typeof row.featured === "boolean" ? row.featured : undefined
    }];
  });
}

function testimonialAccent(value: unknown): CollaborationTestimonialsContent["testimonials"][number]["accent"] {
  return value === "purple" || value === "green" ? value : "blue";
}

function mapTestimonials(value: unknown): CollaborationTestimonialsContent["testimonials"] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const testimonial = item as Record<string, unknown>;
    const name = stringValue(testimonial.name, "Anonymous");
    const tags = stringArray(testimonial.tags);
    return [{
      number: stringValue(testimonial.number, String(index + 1).padStart(2, "0")),
      featured: testimonial.featured === true,
      featuredLabel: stringValue(testimonial.featuredLabel) || undefined,
      quote: stringValue(testimonial.quote),
      name,
      initial: stringValue(testimonial.initial, name.slice(0, 1).toUpperCase()),
      role: stringValue(testimonial.role),
      company: stringValue(testimonial.company),
      avatarUrl: stringValue(testimonial.avatarUrl, "/testimonial-raka-avatar.svg"),
      accent: testimonialAccent(testimonial.accent),
      tags: tags.length ? tags : undefined
    }];
  });
}

function contactAccent(value: unknown): ContactFinalStatementContent["links"][number]["accent"] {
  return value === "light" || value === "green" ? value : "blue";
}

function mapContactContent(value: unknown): ContactFinalStatementContent {
  if (!value || typeof value !== "object") return emptyContactFinalStatement;
  const content = value as Record<string, unknown>;
  const links = Array.isArray(content.links)
    ? content.links.flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const link = item as Record<string, unknown>;
      return [{
        number: stringValue(link.number, String(index + 1).padStart(2, "0")),
        label: stringValue(link.label),
        title: stringValue(link.title),
        detail: stringValue(link.detail),
        url: stringValue(link.url),
        accent: contactAccent(link.accent),
        openInNewTab: link.openInNewTab === true
      }];
    })
    : [];

  return {
    sectionNumber: stringValue(content.sectionNumber),
    sectionLabel: stringValue(content.sectionLabel),
    headlineLines: stringArray(content.headlineLines),
    intro: stringValue(content.intro),
    availabilityLabel: stringValue(content.availabilityLabel),
    availabilityLocation: stringValue(content.availabilityLocation),
    availabilityDotUrl: stringValue(content.availabilityDotUrl),
    ambientOrbUrl: stringValue(content.ambientOrbUrl),
    links,
    openToLabel: stringValue(content.openToLabel),
    openTo: stringValue(content.openTo),
    copyright: stringValue(content.copyright),
    footerStatement: stringValue(content.footerStatement),
    backToTopLabel: stringValue(content.backToTopLabel)
  };
}

function projectBlock(project: PublicProject, type: string) {
  return project.blocks?.find((block) => block.type === type)?.content ?? {};
}

function splitTitleLines(title: string) {
  return title.includes(" — ") ? title.split(" — ").map((line) => line.trim()) : [title];
}

function caseStudyUrl(slug: string) {
  return `/case-study/${slug}`;
}

function projectCategory(project: PublicProject) {
  return project.categories?.[0]?.name ?? project.industry ?? "Uncategorized";
}

function projectOutput(project: PublicProject, archiveBlock: Record<string, unknown>) {
  const services = Array.isArray(project.services) ? project.services : [];
  return stringValue(
    archiveBlock.output,
    project.platform || services.join(" / ") || project.excerpt || project.description || ""
  );
}

function mapFlagshipProjects(projects: PublicProject[]): FlagshipProductsContent["projects"] {
  return projects.map((project, index) => {
    const flagshipBlock = projectBlock(project, "flagship");
    const heroBlock = projectBlock(project, "HERO");
    const linkLabel = stringValue(flagshipBlock.linkLabel, "VIEW CASE STUDY");
    const visualUrl = stringValue(
      flagshipBlock.visualUrl,
      project.coverUrl || stringValue(heroBlock.imageUrl)
    );

    return {
      number: stringValue(flagshipBlock.number, String(index + 1).padStart(2, "0")),
      eyebrow: stringValue(
        flagshipBlock.eyebrow,
        [projectCategory(project), project.industry].filter(Boolean).join("  /  ").toUpperCase()
      ),
      titleLines: splitTitleLines(project.title),
      description: project.description || project.excerpt || "",
      role: project.role || "",
      platform: project.platform || "",
      scope: stringValue(flagshipBlock.scope, Array.isArray(project.services) ? project.services.join(" / ") : ""),
      linkLabel,
      linkUrl: caseStudyUrl(project.slug),
      visualUrl,
      visualAlt: stringValue(
        flagshipBlock.visualAlt,
        project.coverAlt || stringValue(heroBlock.imageAlt, project.title)
      ),
      glowUrl: stringValue(flagshipBlock.glowUrl) || undefined,
      layout: stringValue(flagshipBlock.layout, index % 2 === 1 ? "media-left" : "media-right") === "media-left" ? "media-left" : "media-right",
      featured: project.featured,
    };
  });
}

function mapArchiveProjects(projects: PublicProject[]): ProjectArchiveContent["projects"] {
  return projects.map((project) => {
    const archiveBlock = projectBlock(project, "archive");
    return {
      year: project.year?.toString() ?? "",
      title: project.title,
      category: stringValue(archiveBlock.category, projectCategory(project)).toUpperCase(),
      output: projectOutput(project, archiveBlock).toUpperCase(),
      linkUrl: caseStudyUrl(project.slug),
      featured: project.featured,
    };
  });
}

async function fetchPublicProjects(query: string) {
  const response = await fetch(`${publicApiUrl}/api/v1/public/projects${query}`);
  if (!response.ok) throw new Error("Public project API is unavailable.");
  const body = await response.json() as PublicProjectsResponse;
  if (!body.success || !Array.isArray(body.data)) {
    throw new Error("Public project response is invalid.");
  }
  return body.data;
}

async function fetchPublicContent<T>(path: string) {
  const response = await fetch(`${publicApiUrl}${path}`);
  if (!response.ok) throw new Error(`${path} is unavailable.`);
  const body = await response.json() as PublicContentResponse<T>;
  if (!body.success || !body.data) throw new Error(`${path} returned an invalid response.`);
  return body.data;
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [about, setAbout] = useState<AboutContent>(defaultAbout);
  const [experience, setExperience] = useState<ExperienceContent>(allowLocalDefaults ? defaultExperience as ExperienceContent : emptyExperience);
  const [selectedWork, setSelectedWork] = useState<SelectedWorkContent>(defaultSelectedWork);
  const [flagshipProducts, setFlagshipProducts] =
    useState<FlagshipProductsContent>(
      allowLocalDefaults ? defaultFlagshipProducts as FlagshipProductsContent : emptyFlagshipProducts
    );
  const [creativePractice, setCreativePractice] =
    useState<CreativePracticeContent>(
      defaultCreativePractice as CreativePracticeContent
    );
  const [projectArchive, setProjectArchive] =
    useState<ProjectArchiveContent>(
      allowLocalDefaults ? defaultProjectArchive as ProjectArchiveContent : emptyProjectArchive
    );
  const [skills, setSkills] = useState<SkillsContent>(
    defaultSkills as SkillsContent
  );
  const [howIWork, setHowIWork] = useState<HowIWorkContent>(
    defaultHowIWork as HowIWorkContent
  );
  const [capabilitiesTools, setCapabilitiesTools] =
    useState<CapabilitiesToolsContent>(
      defaultCapabilitiesTools as CapabilitiesToolsContent
    );
  const [collaborationTestimonials, setCollaborationTestimonials] =
    useState<CollaborationTestimonialsContent>(
      allowLocalDefaults ? defaultCollaborationTestimonials as CollaborationTestimonialsContent : emptyTestimonials
    );
  const [contactFinalStatement, setContactFinalStatement] =
    useState<ContactFinalStatementContent>(
      allowLocalDefaults ? defaultContactFinalStatement as ContactFinalStatementContent : emptyContactFinalStatement
    );
  const [visibleSections, setVisibleSections] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const requestSequence = useRef(0);

  const fetchContent = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    let nextExperience = allowLocalDefaults ? defaultExperience as ExperienceContent : emptyExperience;
    let nextFlagshipProducts = allowLocalDefaults ? defaultFlagshipProducts as FlagshipProductsContent : emptyFlagshipProducts;
    let nextProjectArchive = allowLocalDefaults ? defaultProjectArchive as ProjectArchiveContent : emptyProjectArchive;
    let nextTestimonials = allowLocalDefaults ? defaultCollaborationTestimonials as CollaborationTestimonialsContent : emptyTestimonials;
    let nextContact = allowLocalDefaults ? defaultContactFinalStatement as ContactFinalStatementContent : emptyContactFinalStatement;

    try {
      const pageResponse = await fetch(`${publicApiUrl}/api/v1/public/pages/home`);
      if (!pageResponse.ok) throw new Error("Public page API is unavailable.");
      const page = await pageResponse.json() as PublicPageResponse;
      if (!page.success || !Array.isArray(page.data?.sections)) throw new Error("Public page response is invalid.");
      if (requestId !== requestSequence.current) return;

      setVisibleSections(page.data.sections.map((section) => section.type));
      for (const section of page.data.sections) {
        switch (section.type) {
          case "hero": setHero(section.content as HeroContent); break;
          case "about": setAbout(section.content as AboutContent); break;
          case "experience": nextExperience = { ...(section.content as ExperienceContent), rows: [] }; break;
          case "selected-work": setSelectedWork(section.content as SelectedWorkContent); break;
          case "flagship-products": nextFlagshipProducts = { ...(section.content as FlagshipProductsContent), projects: [] }; break;
          case "creative-practice": setCreativePractice(section.content as CreativePracticeContent); break;
          case "project-archive": nextProjectArchive = { ...(section.content as ProjectArchiveContent), projects: [] }; break;
          case "skills": setSkills(section.content as SkillsContent); break;
          case "how-i-work": setHowIWork(section.content as HowIWorkContent); break;
          case "capabilities-tools": setCapabilitiesTools(section.content as CapabilitiesToolsContent); break;
          case "collaboration-testimonials": nextTestimonials = { ...(section.content as CollaborationTestimonialsContent), testimonials: [] }; break;
          case "contact-final-statement": nextContact = mapContactContent(section.content); break;
        }
      }
    } catch (error) {
      console.error("Public page API unavailable; editorial configuration is using safe defaults.", error);
      if (!allowLocalDefaults) setVisibleSections(null);
    }

    if (requestId !== requestSequence.current) return;
    setExperience(nextExperience);
    setFlagshipProducts(nextFlagshipProducts);
    setProjectArchive(nextProjectArchive);
    setCollaborationTestimonials(nextTestimonials);
    setContactFinalStatement(nextContact);

    const [experienceResult, featuredResult, archiveResult, skillsResult, testimonialsResult] = await Promise.allSettled([
      fetchPublicContent<PublicExperienceResponse>("/api/v1/public/experiences"),
      fetchPublicProjects(`?featured=true&limit=${flagshipProjectLimit}`),
      fetchPublicProjects("?featured=false"),
      fetchPublicContent<SkillsContent>("/api/v1/public/skills"),
      fetchPublicContent<CollaborationTestimonialsContent>("/api/v1/public/testimonials")
    ]);

    if (requestId !== requestSequence.current) return;

    if (experienceResult.status === "fulfilled") {
      setExperience({ ...nextExperience, rows: mapExperienceRows(experienceResult.value.rows) });
    } else {
      console.error("Public Experience API unavailable; Experience will render empty.", experienceResult.reason);
      setExperience({ ...nextExperience, rows: allowLocalDefaults ? (defaultExperience as ExperienceContent).rows : [] });
    }

    if (featuredResult.status === "fulfilled") {
      setFlagshipProducts({ ...nextFlagshipProducts, projects: mapFlagshipProjects(featuredResult.value) });
    } else {
      console.error("Public featured Projects API unavailable; Flagship Products will render empty.", featuredResult.reason);
      setFlagshipProducts({ ...nextFlagshipProducts, projects: [] });
    }

    if (archiveResult.status === "fulfilled") {
      setProjectArchive({ ...nextProjectArchive, projects: mapArchiveProjects(archiveResult.value) });
    } else {
      console.error("Public archive Projects API unavailable; Project Archive will render empty.", archiveResult.reason);
      setProjectArchive({ ...nextProjectArchive, projects: [] });
    }

    if (skillsResult.status === "fulfilled") setSkills(skillsResult.value);
    else console.error("Public Skills API unavailable; Skills will keep its current safe content.", skillsResult.reason);

    if (testimonialsResult.status === "fulfilled") {
      setCollaborationTestimonials({
        ...nextTestimonials,
        testimonials: mapTestimonials(testimonialsResult.value.testimonials)
      });
    } else {
      console.error("Public Testimonials API unavailable; Testimonials will render empty.", testimonialsResult.reason);
      setCollaborationTestimonials({ ...nextTestimonials, testimonials: [] });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchContent();
  }, [fetchContent]);

  return (
    <ContentContext.Provider
      value={{
        hero,
        about,
        experience,
        selectedWork,
        flagshipProducts,
        creativePractice,
        projectArchive,
        skills,
        howIWork,
        capabilitiesTools,
        collaborationTestimonials,
        contactFinalStatement,
      settings,
        visibleSections,
        loading,
        refresh: fetchContent
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}
