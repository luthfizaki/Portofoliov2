import { redirect } from "next/navigation";
import { CmsWorkspace } from "../../components/cms-workspace";
import {
  ContactFinalManager,
  type ContactFinalContent,
  type ContactFinalSection,
} from "../../components/contact-final-manager";
import { getSessionUser, sessionApi } from "../../lib/server-api";

type PageSummary = {
  id: string;
  name: string;
  slug: string;
  isHomepage: boolean;
};

type PageDetail = {
  id: string;
  name: string;
  slug: string;
  sections: ContactFinalSection[];
};

const fallbackContent: ContactFinalContent = {
  sectionNumber: "07",
  sectionLabel: "CONTACT / FINAL STATEMENT",
  headlineLines: ["LET'S BUILD", "SOMETHING", "MEANINGFUL."],
  intro: "I'm open to Product Design opportunities, selected freelance collaborations, and creative projects that turn complex ideas into clear and meaningful experiences.",
  availabilityLabel: "AVAILABLE FOR OPPORTUNITIES",
  availabilityLocation: "INDONESIA - GMT+7",
  availabilityDotUrl: "/contact-status-dot.svg",
  ambientOrbUrl: "/contact-ambient-blue-orb.svg",
  links: [
    {
      number: "01",
      label: "EMAIL",
      title: "WRITE TO ME",
      detail: "luthfizaki43@gmail.com",
      url: "mailto:luthfizaki43@gmail.com",
      accent: "blue",
      openInNewTab: false,
    },
    {
      number: "02",
      label: "RESUME",
      title: "VIEW MY CV",
      detail: "PDF / PROFESSIONAL PROFILE",
      url: "/cv-luthfi-arzaki.pdf",
      accent: "light",
      openInNewTab: true,
    },
    {
      number: "03",
      label: "LINKEDIN",
      title: "CONNECT PROFESSIONALLY",
      detail: "linkedin.com/in/luthfi-arzaki",
      url: "https://www.linkedin.com/in/luthfi-arzaki",
      accent: "blue",
      openInNewTab: true,
    },
    {
      number: "04",
      label: "GITHUB",
      title: "EXPLORE MY CODE",
      detail: "PROFILE LINK READY",
      url: "https://github.com/luthfi-arzaki",
      accent: "green",
      openInNewTab: true,
    },
  ],
  openToLabel: "OPEN TO",
  openTo: "Product Design / UI-UX / Brand & Visual / Creative Collaboration",
  copyright: "LUTHFI ARZAKI (C) 2026",
  footerStatement: "DESIGNED WITH PURPOSE - BUILT WITH CARE",
  backToTopLabel: "BACK TO TOP",
};

export default async function ContactFinalPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const pagesResponse = await sessionApi<{ success: boolean; data: PageSummary[] }>("/api/v1/admin/pages");
  const homepage = pagesResponse?.data.find((page) => page.isHomepage) ?? pagesResponse?.data.find((page) => page.slug === "home");
  const pageResponse = homepage
    ? await sessionApi<{ success: boolean; data: PageDetail }>(`/api/v1/admin/pages/${homepage.id}`)
    : null;
  const section = pageResponse?.data.sections.find((item) => item.type === "contact-final-statement");

  return (
    <CmsWorkspace
      user={user}
      active="Contact Final"
      title="Contact Final"
      subtitle="Manage the CONTACT / FINAL STATEMENT section and CV PDF link."
    >
      <ContactFinalManager
        section={section ?? null}
        fallbackContent={fallbackContent}
      />
    </CmsWorkspace>
  );
}
