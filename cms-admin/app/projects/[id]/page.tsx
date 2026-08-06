import { notFound, redirect } from "next/navigation";
import { ProjectEditor, type EditableProject } from "../../../components/project-editor";
import { getSessionUser, sessionApi } from "../../../lib/server-api";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const response = await sessionApi<{ success: boolean; data: EditableProject }>(`/api/v1/admin/projects/${id}`);
  if (!response?.data) notFound();
  return <ProjectEditor project={response.data} user={user} />;
}
