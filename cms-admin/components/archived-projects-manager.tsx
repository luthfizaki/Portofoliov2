"use client";

import { Archive, ArrowLeft, FolderKanban, RefreshCw, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { SessionUser } from "../lib/api";
import { apiUrl } from "../lib/api";
import { CmsWorkspace } from "./cms-workspace";

type ArchivedProject = {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  updatedAt: string;
  deletedAt: string;
};

type ArchivedProjectResponse = {
  success: boolean;
  data: ArchivedProject[];
  meta?: { total?: number };
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function ArchivedProjectsManager({ user }: { user: SessionUser }) {
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refreshProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/projects/archived?limit=100`, {
        credentials: "include",
        cache: "no-store",
      });
      const body = await response.json().catch(() => null) as ArchivedProjectResponse | null;
      if (!response.ok || !body?.success || !Array.isArray(body.data)) {
        setError("Archived projects could not be loaded. Please refresh and try again.");
        return;
      }
      setProjects(body.data);
    } catch {
      setError("CMS API is unavailable. Try again when the backend connection is available.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  async function restoreProject(project: ArchivedProject) {
    if (busyProjectId) return;
    if (!window.confirm(`Restore "${project.title}" to the active Projects list? Its existing publication status will be preserved.`)) return;

    setBusyProjectId(project.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/projects/${project.id}/restore`, {
        method: "POST",
        credentials: "include",
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Project could not be restored. Check whether the featured-project limit has been reached.");
        return;
      }
      setProjects((current) => current.filter((item) => item.id !== project.id));
      setNotice(`"${project.title}" was restored to the active Projects list.`);
    } catch {
      setError("CMS API is unavailable. The project was not confirmed as restored.");
    } finally {
      setBusyProjectId(null);
    }
  }

  return (
    <CmsWorkspace
      user={user}
      active="Projects"
      title="Archived Projects"
      subtitle="Review archived work and restore it when needed."
    >
      <div className="cms-module-body">
        <section className="cms-module-summary">
          <div>
            <span className="overview-tone overview-tone--purple"><Archive size={19} /></span>
            <p><small>Archived Projects</small><strong>{projects.length}</strong></p>
          </div>
          <Link className="cms-module-primary" href="/projects"><ArrowLeft size={16} />Back to Projects</Link>
        </section>

        {error && <p className="cms-form-message cms-form-message--error" role="alert">{error}</p>}
        {notice && <p className="cms-form-message" role="status" aria-live="polite">{notice}</p>}

        <section className="cms-module-card">
          <header className="cms-module-card__header">
            <div><h2>Archived work</h2><p>Restoring a project keeps its current draft or publication status.</p></div>
            <button className="cms-secondary-action" type="button" onClick={() => void refreshProjects()} disabled={loading || busyProjectId !== null}>
              <RefreshCw size={15} />{loading ? "Loading" : "Refresh"}
            </button>
          </header>

          <div className="cms-modern-table cms-modern-table--projects">
            <div className="cms-modern-table__head"><span>Project</span><span>Type</span><span>Status</span><span>Archived</span><span /></div>
            {projects.map((project) => (
              <div className="cms-modern-table__row" key={project.id}>
                <span className="cms-table-title">
                  <i>{project.title.slice(0, 2).toUpperCase()}</i>
                  <strong>{project.title}<small>/{project.slug}</small></strong>
                </span>
                <span>{project.type.replaceAll("_", " ")}</span>
                <em className={`status-${project.status.replaceAll("_", "-").toLowerCase()}`}>{project.status.replaceAll("_", " ")}</em>
                <time>{formatDate(project.deletedAt)}</time>
                <button className="cms-secondary-action" type="button" onClick={() => void restoreProject(project)} disabled={loading || busyProjectId !== null}>
                  <RotateCcw size={15} />{busyProjectId === project.id ? "Restoring" : "Restore"}
                </button>
              </div>
            ))}
            {!loading && projects.length === 0 && (
              <div className="cms-module-empty">
                <FolderKanban size={26} />
                <strong>No archived projects</strong>
                <p>Projects you archive will appear here so they can be restored later.</p>
                <Link href="/projects"><ArrowLeft size={15} />Back to Projects</Link>
              </div>
            )}
            {loading && projects.length === 0 && <div className="cms-module-empty"><RefreshCw size={22} /><strong>Loading archived projects…</strong></div>}
          </div>
        </section>
      </div>
    </CmsWorkspace>
  );
}
