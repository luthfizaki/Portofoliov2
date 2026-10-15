import { useEffect } from "react";

const siteUrl = "https://lyzastudio.my.id";

export type SeoMetadata = {
  title: string;
  description: string;
  canonical: string;
  type: "website" | "article";
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
};

const caseStudyMetadata: Record<string, SeoMetadata> = {
  "seleris-superapp": {
    title: "SELERIS SUPERAPP | Luthfi Arzaki",
    description: "Seleris SuperApp product design case study by Luthfi Arzaki.",
    canonical: `${siteUrl}/case-study/seleris-superapp`,
    type: "article"
  },
  "noteit-automatic-note-taking-app": {
    title: "NOTEIT — AUTOMATIC NOTE-TAKING APP | Luthfi Arzaki",
    description: "NoteIt automatic note-taking mobile application case study by Luthfi Arzaki.",
    canonical: `${siteUrl}/case-study/noteit-automatic-note-taking-app`,
    type: "article"
  },
  "flexa-asia-flexible-accident-insurance": {
    title: "FLEXA.ASIA — FLEXIBLE ACCIDENT INSURANCES | Luthfi Arzaki",
    description: "Flexa.asia flexible accident insurance product design case study by Luthfi Arzaki.",
    canonical: `${siteUrl}/case-study/flexa-asia-flexible-accident-insurance`,
    type: "article"
  },
  "takaful-mobile-app": {
    title: "TAKAFUL MOBILE APP | Luthfi Arzaki",
    description: "Takaful Mobile App product design case study by Luthfi Arzaki.",
    canonical: `${siteUrl}/case-study/takaful-mobile-app`,
    type: "article"
  }
};

export function getCaseStudySeo(slug: string) {
  return caseStudyMetadata[slug];
}

function setMeta(name: string, content: string, attribute = "name") {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export function SEO({
  title,
  description,
  canonical,
  type,
  ogTitle,
  ogDescription,
  ogImageUrl,
  noIndex = false,
  noFollow = false,
}: SeoMetadata) {
  useEffect(() => {
    document.title = title;
    setMeta("description", description);
    setMeta("og:type", type, "property");
    setMeta("og:title", ogTitle || title, "property");
    setMeta("og:description", ogDescription || description, "property");
    setMeta("og:url", canonical, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", ogTitle || title);
    setMeta("twitter:description", ogDescription || description);
    setMeta("robots", [noIndex ? "noindex" : "index", noFollow ? "nofollow" : "follow"].join(", "));

    if (ogImageUrl) {
      setMeta("og:image", ogImageUrl, "property");
      setMeta("twitter:image", ogImageUrl);
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove();
      document.head.querySelector('meta[name="twitter:image"]')?.remove();
    }

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;
  }, [canonical, description, noFollow, noIndex, ogDescription, ogImageUrl, ogTitle, title, type]);

  return null;
}
