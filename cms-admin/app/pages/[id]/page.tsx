import { notFound, redirect } from "next/navigation";
import { PageEditor, type EditablePage } from "../../../components/page-editor";
import { getSessionUser, sessionApi } from "../../../lib/server-api";

export default async function PageDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const response = await sessionApi<{ success: boolean; data: EditablePage }>(`/api/v1/admin/pages/${id}`);
  if (!response?.data) notFound();
  return <PageEditor page={response.data} user={user} />;
}
