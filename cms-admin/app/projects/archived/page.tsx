import { redirect } from "next/navigation";
import { ArchivedProjectsManager } from "../../../components/archived-projects-manager";
import { getSessionUser } from "../../../lib/server-api";

export default async function ArchivedProjectsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <ArchivedProjectsManager user={user} />;
}
