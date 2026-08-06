import { redirect } from "next/navigation";
import { CmsWorkspace } from "../../components/cms-workspace";
import { SkillManager, type SkillRow } from "../../components/skill-manager";
import { getSessionUser, sessionApi } from "../../lib/server-api";

type SkillsResponse = { success: boolean; data: SkillRow[] };

export default async function SkillsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const response = await sessionApi<SkillsResponse>("/api/v1/admin/skills");
  const rows = response?.success ? response.data : [];

  return (
    <CmsWorkspace user={user} active="Skills" title="Skills" subtitle="Organize capabilities, tools, levels, and areas of expertise.">
      <div className="cms-module-body">
        <SkillManager initialRows={rows} />
      </div>
    </CmsWorkspace>
  );
}
