import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

export function useContent() {
  return useContext(ContentContext);
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function projectBlock(project: PublicProject, type: string) {
  return project.blocks.find((block) => block.type === type)?.content ?? {};
}

function splitTitleLines(title: string) {
  return title.includes(" — ") ? title.split(" — ").map((line) => line.trim()) : [title];
}

function caseStudyUrl(slug: string) {
  return `/case-study/${slug}`;
}

function projectCategory(project: PublicProject) {
  return project.categories[0]?.name ?? project.industry ?? "Uncategorized";
}

function projectOutput(project: PublicProject, archiveBlock: Record<string, unknown>) {
  return stringValue(
    archiveBlock.output,
    project.platform || project.services.join(" / ") || project.excerpt || project.description || ""
  );
}

function mapFlagshipProjects(projects: PublicProject[]): FlagshipProductsContent["projects"] {
  return projects.slice(0, flagshipProjectLimit).map((project, index) => {
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
      scope: stringValue(flagshipBlock.scope, project.services.join(" / ")),
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

export function ContentProvider({ children }: { children: ReactNode }) {
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [about, setAbout] = useState<AboutContent>(defaultAbout);
  const [experience, setExperience] = useState<ExperienceContent>(defaultExperience);
  const [selectedWork, setSelectedWork] = useState<SelectedWorkContent>(defaultSelectedWork);
  const [flagshipProducts, setFlagshipProducts] =
    useState<FlagshipProductsContent>(
      defaultFlagshipProducts as FlagshipProductsContent
    );
  const [creativePractice, setCreativePractice] =
    useState<CreativePracticeContent>(
      defaultCreativePractice as CreativePracticeContent
    );
  const [projectArchive, setProjectArchive] =
    useState<ProjectArchiveContent>(
      defaultProjectArchive as ProjectArchiveContent
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
      defaultCollaborationTestimonials as CollaborationTestimonialsContent
    );
  const [contactFinalStatement, setContactFinalStatement] =
    useState<ContactFinalStatementContent>(
      defaultContactFinalStatement as ContactFinalStatementContent
    );
  const [visibleSections, setVisibleSections] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const pageResponse = await fetch(`${publicApiUrl}/api/v1/public/pages/home`);
      if (!pageResponse.ok) throw new Error("Public content API is unavailable.");
      const page = await pageResponse.json() as PublicPageResponse;
      if (!page.success) throw new Error("Public content response is invalid.");
      const sectionTypes = page.data.sections.map((section) => section.type);
      setVisibleSections(sectionTypes);
      let nextFlagshipProducts = flagshipProducts;
      let nextProjectArchive = projectArchive;

      for (const section of page.data.sections) {
        switch (section.type) {
          case "hero": setHero(section.content as HeroContent); break;
          case "about": setAbout(section.content as AboutContent); break;
          case "experience": setExperience(section.content as ExperienceContent); break;
          case "selected-work": setSelectedWork(section.content as SelectedWorkContent); break;
          case "flagship-products": nextFlagshipProducts = section.content as FlagshipProductsContent; break;
          case "creative-practice": setCreativePractice(section.content as CreativePracticeContent); break;
          case "project-archive": nextProjectArchive = section.content as ProjectArchiveContent; break;
          case "skills": setSkills(section.content as SkillsContent); break;
          case "how-i-work": setHowIWork(section.content as HowIWorkContent); break;
          case "capabilities-tools": setCapabilitiesTools(section.content as CapabilitiesToolsContent); break;
          case "collaboration-testimonials": setCollaborationTestimonials(section.content as CollaborationTestimonialsContent); break;
          case "contact-final-statement": setContactFinalStatement(section.content as ContactFinalStatementContent); break;
        }
      }

      try {
        const [featuredProjects, archiveProjects] = await Promise.all([
          fetchPublicProjects(`?featured=true&limit=${flagshipProjectLimit}`),
          fetchPublicProjects("?limit=50")
        ]);
        setFlagshipProducts({
          ...nextFlagshipProducts,
          projects: mapFlagshipProjects(featuredProjects)
        });
        setProjectArchive({
          ...nextProjectArchive,
          projects: mapArchiveProjects(archiveProjects)
        });
      } catch (error) {
        console.error("Public project API unavailable; project sections will render empty.", error);
        setFlagshipProducts({ ...nextFlagshipProducts, projects: [] });
        setProjectArchive({ ...nextProjectArchive, projects: [] });
      }

      const skillsResponse = await fetch(`${publicApiUrl}/api/v1/public/skills`);
      if (skillsResponse.ok) {
        const skillsBody = await skillsResponse.json() as PublicContentResponse<SkillsContent>;
        if (skillsBody.success) setSkills(skillsBody.data);
      }

      const testimonialsResponse = await fetch(`${publicApiUrl}/api/v1/public/testimonials`);
      if (testimonialsResponse.ok) {
        const testimonialsBody = await testimonialsResponse.json() as PublicContentResponse<CollaborationTestimonialsContent>;
        if (testimonialsBody.success) setCollaborationTestimonials(testimonialsBody.data);
      }

    } catch (error) {
      if (allowLocalDefaults) {
        console.warn("Public content API unavailable; local defaults are active.", error);
      } else {
        console.error("Public content API unavailable; production local defaults are disabled.", error);
        setVisibleSections([]);
      }
    } finally {
      setLoading(false);
    }
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
