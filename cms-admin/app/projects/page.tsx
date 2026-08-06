import { ArrowUpRight, Filter, FolderKanban, Plus, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CmsWorkspace } from "../../components/cms-workspace";
import { type ProjectRow } from "../../lib/projects";
import { getSessionUser, sessionApi } from "../../lib/server-api";

type ProjectListResponse = { success: boolean; data: ProjectRow[] };

export default async function ProjectsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const response = await sessionApi<ProjectListResponse>("/api/v1/admin/projects?limit=100");
  const projects = response?.data ?? [];
  const published = projects.filter((project) => project.status === "PUBLISHED").length;
  const drafts = projects.filter((project) => project.status === "DRAFT").length;

  return (
    <CmsWorkspace user={user} active="Projects" title="Projects" subtitle="Manage your portfolio projects and case studies.">
      <div className="cms-module-body">
        <section className="cms-module-summary">
          <div><span className="overview-tone overview-tone--purple"><FolderKanban size={19} /></span><p><small>Total Projects</small><strong>{projects.length}</strong></p></div>
          <div><i className="is-green" /><p><small>Published</small><strong>{published}</strong></p></div>
          <div><i className="is-blue" /><p><small>Draft</small><strong>{drafts}</strong></p></div>
          <Link className="cms-module-primary" href="/projects/new"><Plus size={17} />Add Project</Link>
        </section>

        <section className="cms-module-card">
          <header className="cms-module-card__header">
            <div><h2>All Projects</h2><p>Organize, publish, and update portfolio work.</p></div>
            <div className="cms-module-tools"><label><Search size={16} /><input aria-label="Search projects" placeholder="Search projects..." /></label><button type="button"><Filter size={16} />Filter</button></div>
          </header>
          <div className="cms-modern-table cms-modern-table--projects">
            <div className="cms-modern-table__head"><span>Project</span><span>Type</span><span>Status</span><span>Updated</span><span /></div>
            {projects.map((project) => (
              <Link href={`/projects/${project.id}`} className="cms-modern-table__row" key={project.id}>
                <span className="cms-table-title"><i>{project.title.slice(0, 2).toUpperCase()}</i><strong>{project.title}<small>/{project.slug}</small></strong></span>
                <span>{project.type.replaceAll("_", " ")}</span>
                <em className={`status-${project.status.replaceAll("_", "-").toLowerCase()}`}>{project.status.replaceAll("_", " ")}</em>
                <time>{new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(project.updatedAt))}</time>
                <ArrowUpRight size={16} />
              </Link>
            ))}
            {!projects.length && <div className="cms-module-empty"><FolderKanban size={26} /><strong>No projects yet</strong><p>Create your first portfolio project to get started.</p><Link href="/projects/new"><Plus size={15} />Add Project</Link></div>}
          </div>
        </section>
      </div>
    </CmsWorkspace>
  );
}
