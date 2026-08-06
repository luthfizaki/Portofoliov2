import { redirect } from "next/navigation";
import { CmsWorkspace } from "../../components/cms-workspace";
import { TestimonialManager, type TestimonialRow } from "../../components/testimonial-manager";
import { getSessionUser, sessionApi } from "../../lib/server-api";

type TestimonialsResponse = { success: boolean; data: TestimonialRow[] };

export default async function TestimonialsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const response = await sessionApi<TestimonialsResponse>("/api/v1/admin/testimonials");
  const rows = response?.success ? response.data : [];

  return (
    <CmsWorkspace user={user} active="Testimonials" title="Testimonials" subtitle="Manage collaboration voices, featured quote, tags, and public testimonial ordering.">
      <div className="cms-module-body">
        <TestimonialManager initialRows={rows} />
      </div>
    </CmsWorkspace>
  );
}
