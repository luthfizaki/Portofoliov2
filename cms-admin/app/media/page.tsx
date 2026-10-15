import { redirect } from "next/navigation";
import { CmsWorkspace } from "../../components/cms-workspace";
import { MediaLibrary } from "../../components/media-library";
import { getSessionUser } from "../../lib/server-api";

export default async function MediaPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const writesAllowed = process.env.VERCEL_ENV !== "preview" || process.env.ALLOW_PREVIEW_CONTENT_WRITES === "true";

  return (
    <CmsWorkspace user={user} active="Media" title="Media Library" subtitle="Find, reuse, and describe assets across your portfolio.">
      <MediaLibrary writesAllowed={writesAllowed} />
    </CmsWorkspace>
  );
}
