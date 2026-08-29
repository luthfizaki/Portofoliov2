import { AboutSection } from "./components/AboutSection";
import { CapabilitiesToolsSection } from "./components/CapabilitiesToolsSection";
import { CollaborationTestimonialsSection } from "./components/CollaborationTestimonialsSection";
import { ContactFinalStatementSection } from "./components/ContactFinalStatementSection";
import { CreativePracticeSection } from "./components/CreativePracticeSection";
import { ExperienceSection } from "./components/ExperienceSection";
import { FlagshipProductsSection } from "./components/FlagshipProductsSection";
import { HeroSection } from "./components/HeroSection";
import { HowIWorkSection } from "./components/HowIWorkSection";
import { ProjectArchiveSection } from "./components/ProjectArchiveSection";
import { SelectedWorkSection } from "./components/SelectedWorkSection";
import { SelerisCaseStudyPage } from "./components/SelerisCaseStudyPage";
import { SkillsSection } from "./components/SkillsSection";
import { SmoothScroll } from "./components/SmoothScroll";
import { ContentProvider, useContent } from "./context/ContentContext";
import { SEO, getCaseStudySeo } from "./components/SEO";

const caseStudyAliases: Record<string, string> = {
  "seleris-superapp": "seleris-superapp",
  noteit: "noteit-automatic-note-taking-app",
  flexa: "flexa-asia-flexible-accident-insurance",
  takaful: "takaful-mobile-app"
};

function HomeSections() {
  const { loading, visibleSections } = useContent();
  const isVisible = (type: string) =>
    !visibleSections || visibleSections.includes(type);

  if (loading && !visibleSections) return null;

  return (
    <SmoothScroll>
      {isVisible("hero") && <HeroSection />}
      {isVisible("about") && <AboutSection />}
      {isVisible("experience") && <ExperienceSection />}
      {isVisible("selected-work") && <SelectedWorkSection />}
      {isVisible("flagship-products") && <FlagshipProductsSection />}
      {isVisible("creative-practice") && <CreativePracticeSection />}
      {isVisible("project-archive") && <ProjectArchiveSection />}
      {isVisible("skills") && <SkillsSection />}
      {isVisible("how-i-work") && <HowIWorkSection />}
      {isVisible("capabilities-tools") && <CapabilitiesToolsSection />}
      {isVisible("collaboration-testimonials") && <CollaborationTestimonialsSection />}
      {isVisible("contact-final-statement") && <ContactFinalStatementSection />}
    </SmoothScroll>
  );
}

export default function App() {
  const normalizedPath = window.location.pathname.replace(/\/$/, "");
  const caseStudyMatch = normalizedPath.match(/^\/case-study\/([^/]+)$/);

  if (caseStudyMatch) {
    const requestedSlug = caseStudyMatch[1];
    const canonicalSlug = caseStudyAliases[requestedSlug] ?? requestedSlug;
    const seo = getCaseStudySeo(canonicalSlug);

    return (
      <SmoothScroll>
        {seo && <SEO {...seo} />}
        <SelerisCaseStudyPage slug={canonicalSlug} />
      </SmoothScroll>
    );
  }

  return (
    <ContentProvider>
      <SEO
        title="Luthfi Arzaki | UI/UX Designer"
        description="Luthfi Arzaki, UI/UX Designer and Product Designer crafting thoughtful digital products and experiences."
        canonical="https://lyzastudio.my.id/"
        type="website"
      />
      <HomeSections />
    </ContentProvider>
  );
}
