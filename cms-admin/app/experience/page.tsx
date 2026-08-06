import { redirect } from "next/navigation";
import { CmsWorkspace } from "../../components/cms-workspace";
import { ExperienceManager, type ExperienceRow } from "../../components/experience-manager";
import { getSessionUser, sessionApi } from "../../lib/server-api";

type ExperienceResponse = { success: boolean; data: ExperienceRow[] };

export default async function ExperiencePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const response = await sessionApi<ExperienceResponse>("/api/v1/admin/experiences");
  const rows = response?.success ? response.data : [];

  return (
    <CmsWorkspace user={user} active="Experience" title="Experience" subtitle="Manage career history, roles, companies, and contributions.">
      <div className="cms-module-body">
        <ExperienceManager initialRows={rows} />
      </div>
    </CmsWorkspace>
  );
}
