import { ArrowUpRight, FileText, Home, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CmsWorkspace } from "../../components/cms-workspace";
import { getSessionUser, sessionApi } from "../../lib/server-api";

type PageSummary = { id: string; name: string; slug: string; status: string; isHomepage: boolean; updatedAt: string };

export default async function PagesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const response = await sessionApi<{ success: boolean; data: PageSummary[] }>("/api/v1/admin/pages");
  const pages = response?.data ?? [];

  return (
    <CmsWorkspace user={user} active="Pages" title="Pages" subtitle="Edit page content and homepage sections.">
      <div className="cms-module-body">
        <section className="cms-module-summary cms-module-summary--pages">
          <div><span className="overview-tone overview-tone--purple"><FileText size={19} /></span><p><small>Total Pages</small><strong>{pages.length}</strong></p></div>
          <div><span className="overview-tone overview-tone--green"><Home size={19} /></span><p><small>Homepage</small><strong>{pages.filter((page) => page.isHomepage).length}</strong></p></div>
          <div className="cms-module-note"><strong>Structured content</strong><span>Changes are delivered directly through the portfolio API.</span></div>
        </section>

        <section className="cms-module-card">
          <header className="cms-module-card__header">
            <div><h2>Website Pages</h2><p>Select a page to manage its content sections.</p></div>
            <div className="cms-module-tools"><label><Search size={16} /><input aria-label="Search pages" placeholder="Search pages..." /></label></div>
          </header>
          <div className="cms-modern-table cms-modern-table--pages">
            <div className="cms-modern-table__head"><span>Page</span><span>URL</span><span>Status</span><span>Updated</span><span /></div>
            {pages.map((page) => (
              <Link href={`/pages/${page.id}`} className="cms-modern-table__row" key={page.id}>
                <span className="cms-table-title"><i><FileText size={16} /></i><strong>{page.name}<small>{page.isHomepage ? "Primary homepage" : "Website page"}</small></strong></span>
                <span>/{page.slug}</span>
                <em className={`status-${page.status.toLowerCase()}`}>{page.status}</em>
                <time>{new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(page.updatedAt))}</time>
                <ArrowUpRight size={16} />
              </Link>
            ))}
            {!pages.length && <div className="cms-module-empty"><FileText size={26} /><strong>No pages available</strong><p>Page management will appear here when content is created.</p></div>}
          </div>
        </section>
      </div>
    </CmsWorkspace>
  );
}
