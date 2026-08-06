import { redirect } from "next/navigation";
import { ProjectEditor } from "../../../components/project-editor";
import { getSessionUser } from "../../../lib/server-api";

export default async function NewProjectPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <ProjectEditor user={user} />;
}
