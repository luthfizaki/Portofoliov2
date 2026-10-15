import { redirect } from "next/navigation";
import { CmsWorkspace } from "../../components/cms-workspace";
import { SeoManager } from "../../components/seo-manager";
import { getSessionUser, sessionApi } from "../../lib/server-api";

type SeoValues = {
  title: string | null; description: string | null; canonical: string | null;
  ogTitle: string | null; ogDescription: string | null; ogImageUrl: string | null;
  noIndex: boolean; noFollow: boolean;
};
type SeoItem = {
  entityType: "page" | "project"; id: string; name: string; slug: string; status: string;
  updatedAt: string; visibility?: string; seo: SeoValues | null;
};

export default async function SeoPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const response = await sessionApi<{ success: boolean; data: SeoItem[] }>("/api/v1/admin/seo");
  const items = response?.success ? response.data : [];
  const writesAllowed = process.env.VERCEL_ENV !== "preview" || process.env.ALLOW_PREVIEW_CONTENT_WRITES === "true";

  return (
    <CmsWorkspace user={user} active="SEO" title="SEO Management" subtitle="Manage search result and social sharing metadata for pages and projects.">
      <SeoManager initialItems={items} writesAllowed={writesAllowed} />
    </CmsWorkspace>
  );
}
