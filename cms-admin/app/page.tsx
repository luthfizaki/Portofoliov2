import type { CSSProperties, ComponentType } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  Eye,
  FolderKanban,
  GripVertical,
  House,
  Images,
  LayoutPanelTop,
  Mail,
  PencilLine,
  Plus,
  Search,
  Star,
  Upload,
} from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cmsNavigation } from "../components/cms-workspace";
import { LogoutButton } from "../components/logout-button";
import { SectionVisibilitySwitch } from "../components/section-visibility-switch";
import { apiInternalUrl, type SessionUser } from "../lib/api";

type Icon = ComponentType<{ size?: number; strokeWidth?: number }>;

const activities = [
  { icon: Check, tone: "green", title: "Published project", detail: "Content is now live on the portfolio" },
  { icon: Images, tone: "blue", title: "Uploaded media files", detail: "Media library updated" },
  { icon: Search, tone: "purple", title: "Updated project SEO", detail: "Search metadata refreshed" },
  { icon: Mail, tone: "pink", title: "New contact message", detail: "A new inquiry needs review" },
  { icon: PencilLine, tone: "orange", title: "Updated homepage section", detail: "Homepage content was edited" },
] as const;

const messages = [
  { initials: "SL", name: "Sarah Lee", time: "10:42 AM", text: "Hi Luthfi, I love your work. Can we discuss a potential collaboration?", tone: "orange" },
  { initials: "DK", name: "Daniel Kim", time: "Yesterday", text: "Great portfolio. Are you available for a new product design project?", tone: "blue" },
  { initials: "OM", name: "Olivia Martinez", time: "May 13", text: "I’m interested in working together. Please share your process and timeline.", tone: "pink" },
] as const;

type ProjectRow = { id: string; title: string; slug: string; type: string; status: string; updatedAt: string };
type ProjectResponse = { data: ProjectRow[]; meta: { total: number; statusCounts: Record<string, number> } };
type PageSummary = { id: string; name: string; slug: string; isHomepage: boolean };
type PageSection = { id: string; type: string; name: string | null; isVisible: boolean; sortOrder: number };
type PageDetail = { id: string; name: string; slug: string; sections: PageSection[] };

const sectionMeta: Record<string, { icon: Icon; description: string; href: string }> = {
  hero: { icon: House, description: "Primary introduction", href: "/pages" },
  about: { icon: LayoutPanelTop, description: "Profile and background", href: "/pages" },
  experience: { icon: BriefcaseBusiness, description: "Career timeline", href: "/experience" },
  "selected-work": { icon: LayoutPanelTop, description: "Featured projects", href: "/pages" },
  "flagship-products": { icon: FolderKanban, description: "Highlighted case studies", href: "/projects" },
  "creative-practice": { icon: Star, description: "Practice and approach", href: "/pages" },
  "project-archive": { icon: FolderKanban, description: "All portfolio work", href: "/projects" },
  skills: { icon: Star, description: "Skills and tools", href: "/skills" },
  "how-i-work": { icon: LayoutPanelTop, description: "Process and collaboration", href: "/pages" },
  "capabilities-tools": { icon: Star, description: "Capabilities and stack", href: "/skills" },
  "collaboration-testimonials": { icon: Mail, description: "Collaboration voices", href: "/testimonials" },
  "contact-final-statement": { icon: Mail, description: "Contact CTA and CV link", href: "/contact-final" },
};

async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  try {
    const response = await fetch(`${apiInternalUrl}/api/v1/auth/me`, {
      headers: { Cookie: cookieStore.toString() },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = await response.json().catch(() => null);
    return body?.success ? body.data.user : null;
  } catch {
    return null;
  }
}

async function getProjects(): Promise<ProjectResponse> {
  const cookieStore = await cookies();
  const fallback = { data: [], meta: { total: 0, statusCounts: {} } };
  try {
    const response = await fetch(`${apiInternalUrl}/api/v1/admin/projects?limit=50`, {
      headers: { Cookie: cookieStore.toString() },
      cache: "no-store",
    });
    if (!response.ok) return fallback;
    const body = await response.json().catch(() => null);
    return body?.success ? body : fallback;
  } catch {
    return fallback;
  }
}

async function getHomepage(): Promise<PageDetail | null> {
  const cookieStore = await cookies();
  try {
    const pagesResponse = await fetch(`${apiInternalUrl}/api/v1/admin/pages`, {
      headers: { Cookie: cookieStore.toString() },
      cache: "no-store",
    });
    if (!pagesResponse.ok) return null;
    const pagesBody = await pagesResponse.json().catch(() => null) as { success?: boolean; data?: PageSummary[] } | null;
    const homepage = pagesBody?.data?.find((page) => page.isHomepage) ?? pagesBody?.data?.find((page) => page.slug === "home");
    if (!homepage) return null;

    const pageResponse = await fetch(`${apiInternalUrl}/api/v1/admin/pages/${homepage.id}`, {
      headers: { Cookie: cookieStore.toString() },
      cache: "no-store",
    });
    if (!pageResponse.ok) return null;
    const pageBody = await pageResponse.json().catch(() => null) as { success?: boolean; data?: PageDetail } | null;
    return pageBody?.success ? pageBody.data ?? null : null;
  } catch {
    return null;
  }
}

function displayStatus(status: string) {
  return status.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displaySectionName(section: PageSection) {
  return (section.name || section.type)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "LA";
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [projectResponse, homepage] = await Promise.all([getProjects(), getHomepage()]);
  const projectRows = projectResponse.data.slice(0, 5);
  const homepageSections = (homepage?.sections ?? [])
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((section) => ({
      id: section.id,
      name: displaySectionName(section),
      description: sectionMeta[section.type]?.description ?? "Homepage content section",
      href: sectionMeta[section.type]?.href ?? "/pages",
      icon: sectionMeta[section.type]?.icon ?? LayoutPanelTop,
      isVisible: section.isVisible,
    }));
  const counts = projectResponse.meta.statusCounts;
  const total = projectResponse.meta.total;
  const published = counts.PUBLISHED ?? 0;
  const drafts = counts.DRAFT ?? 0;
  const scheduled = counts.SCHEDULED ?? counts.IN_REVIEW ?? 0;
  const archived = counts.ARCHIVED ?? 0;
  const safeTotal = Math.max(total, 1);
  const publishedPercent = (published / safeTotal) * 100;
  const draftPercent = (drafts / safeTotal) * 100;
  const scheduledPercent = (scheduled / safeTotal) * 100;
  const donutStyle = {
    "--published-stop": `${publishedPercent}%`,
    "--draft-stop": `${publishedPercent + draftPercent}%`,
    "--scheduled-stop": `${publishedPercent + draftPercent + scheduledPercent}%`,
  } as CSSProperties;
  const role = user.role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

  const metrics = [
    { icon: FolderKanban, tone: "purple", label: "Total Projects", value: total, note: "↑ 12% from last month", noteTone: "positive" },
    { icon: Check, tone: "green", label: "Published", value: published, note: "↑ 10% from last month", noteTone: "positive" },
    { icon: PencilLine, tone: "blue", label: "Draft", value: drafts, note: "↓ 16% from last month", noteTone: "negative" },
    { icon: CalendarDays, tone: "purple", label: "Scheduled", value: scheduled, note: "↑ 50% from last month", noteTone: "positive" },
    { icon: Images, tone: "orange", label: "Homepage Sections", value: homepageSections.length, note: "Synced from Pages API", noteTone: "neutral" },
    { icon: Mail, tone: "pink", label: "Unread Messages", value: 3, note: "New inquiries", noteTone: "neutral" },
  ] as const;

  return (
    <main className="overview-dashboard">
      <aside className="overview-sidebar" aria-label="CMS navigation">
        <a className="overview-brand" href="/">
          <span className="overview-brand__mark">P</span>
          <span><strong>Portfolio V2 CMS</strong><small>Manage your portfolio</small></span>
        </a>

        <nav className="overview-nav">
          {cmsNavigation.map(({ icon: IconComponent, label, href, badge }) => (
            <a className={label === "Overview" ? "is-active" : ""} href={href} key={label}>
              <IconComponent size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {badge && <em>{badge}</em>}
            </a>
          ))}
        </nav>

        <div className="overview-storage-mini">
          <div><strong>Storage Used</strong><b>61%</b></div>
          <span><i /></span>
          <small>30.6 GB / 50 GB</small>
          <a href="#media">Manage Storage</a>
        </div>
        <LogoutButton />
      </aside>

      <section className="overview-main">
        <header className="overview-topbar">
          <div className="overview-heading">
            <h1>Overview</h1>
            <p>Monitor your portfolio website and content at a glance.</p>
          </div>

          <label className="overview-search">
            <Search size={18} strokeWidth={1.8} />
            <input aria-label="Search projects, pages, and media" placeholder="Search projects, pages, media..." />
            <kbd>⌘K</kbd>
          </label>

          <div className="overview-account">
            <button className="overview-icon-button" type="button" aria-label="Notifications" title="Notifications">
              <Bell size={18} strokeWidth={1.8} /><i />
            </button>
            <a className="overview-preview" href="http://localhost:3100" target="_blank" rel="noreferrer">
              <Eye size={19} strokeWidth={1.8} />Preview Website
            </a>
            <span className="overview-avatar">{initials(user.name)}</span>
            <span className="overview-user"><strong>{user.name}</strong><small>{role}</small></span>
          </div>
        </header>

        <div className="overview-body">
          <section className="overview-metrics" aria-label="Portfolio statistics">
            {metrics.map(({ icon: IconComponent, tone, label, value, note, noteTone }) => (
              <article className="overview-metric" key={label}>
                <span className={`overview-tone overview-tone--${tone}`}><IconComponent size={19} strokeWidth={1.8} /></span>
                <div><small>{label}</small><strong>{value}</strong></div>
                <p className={`is-${noteTone}`}>{note}</p>
              </article>
            ))}
          </section>

          <section className="overview-grid overview-grid--primary">
            <article className="overview-card overview-status-card">
              <header><h2>Content Status Overview</h2><button type="button">This Month <ChevronDown size={12} /></button></header>
              <div className="overview-status-content">
                <div className="overview-donut" style={donutStyle}><span><strong>{total}</strong><small>Total Items</small></span></div>
                <ul>
                  <li><i className="is-green" /><span><strong>Published</strong><small>{published} ({Math.round(publishedPercent)}%)</small></span></li>
                  <li><i className="is-blue" /><span><strong>Draft</strong><small>{drafts} ({Math.round(draftPercent)}%)</small></span></li>
                  <li><i className="is-purple" /><span><strong>Scheduled</strong><small>{scheduled} ({Math.round(scheduledPercent)}%)</small></span></li>
                  <li><i className="is-gray" /><span><strong>Archived</strong><small>{archived} ({Math.round((archived / safeTotal) * 100)}%)</small></span></li>
                </ul>
              </div>
              <footer><strong>Content health is stable</strong><span>Most content is published and up to date.</span></footer>
            </article>

            <article className="overview-card overview-recent-projects">
              <header><h2>Recent Projects</h2><a href="/projects">View all</a></header>
              <div className="overview-project-head"><span>Title</span><span>Status</span><span>Updated</span><span>Category</span></div>
              <div className="overview-project-list">
                {projectRows.map((project, index) => (
                  <a href={`/projects/${project.id}`} key={project.id}>
                    <span className={`overview-project-icon tone-${index % 5}`}>{initials(project.title)}</span>
                    <span className="overview-project-title"><strong>{project.title}</strong><small>{project.slug}</small></span>
                    <em className={`status-${project.status.replaceAll("_", "-").toLowerCase()}`}>{displayStatus(project.status)}</em>
                    <time>{displayUpdatedAt(project.updatedAt)}<small>10:24 AM</small></time>
                    <span className="overview-project-type">{displayStatus(project.type)}</span>
                  </a>
                ))}
                {!projectRows.length && <p className="overview-empty">No projects yet. Add your first project to populate this overview.</p>}
              </div>
            </article>

            <article className="overview-card overview-homepage-card">
              <header><h2>Homepage Sections</h2><a href="/pages">Manage</a></header>
              <div className="overview-section-list">
                {homepageSections.map(({ id, icon: IconComponent, name, description, href, isVisible }) => (
                  <a href={href} key={id}>
                    <GripVertical size={14} strokeWidth={1.6} />
                    <span className="overview-tone overview-tone--purple"><IconComponent size={16} strokeWidth={1.7} /></span>
                    <span><strong>{name}</strong><small>{description}</small></span>
                    <SectionVisibilitySwitch sectionId={id} label={name} initialVisible={isVisible} compact />
                  </a>
                ))}
                {!homepageSections.length && <p className="overview-empty">No homepage sections found. Check the Pages module or backend API.</p>}
              </div>
              <a className="overview-add-section" href="/contact-final"><Plus size={14} /> Edit Contact Final</a>
            </article>
          </section>

          <section className="overview-grid overview-grid--secondary">
            <article className="overview-card overview-activity-card">
              <header><h2>Recent Activity</h2><a href="#activity">View all</a></header>
              <div className="overview-activity-list">
                {activities.map(({ icon: IconComponent, tone, title, detail }, index) => (
                  <div key={title}>
                    <span className={`overview-tone overview-tone--${tone}`}><IconComponent size={17} strokeWidth={1.8} /></span>
                    <span><strong>{index === 0 && projectRows[0] ? `Published project “${projectRows[0].title}”` : title}</strong><small>{detail}</small></span>
                  </div>
                ))}
              </div>
              <button className="overview-muted-action" type="button">View full audit log</button>
            </article>

            <article className="overview-card overview-quick-card">
              <header><h2>Quick Actions</h2></header>
              <div className="overview-quick-grid">
                <a href="/projects/new"><span><Plus size={20} /></span><strong>Add Project</strong><small>Create a new project</small></a>
                <a href="#media"><span><Upload size={20} /></span><strong>Upload Media</strong><small>Add images or files</small></a>
                <a href="/pages"><span><House size={20} /></span><strong>Edit Homepage</strong><small>Customize sections</small></a>
                <a href="/contact-final"><span><Mail size={20} /></span><strong>Contact Final</strong><small>CV and contact links</small></a>
                <a href="http://localhost:3100" target="_blank" rel="noreferrer"><span><Eye size={20} /></span><strong>View Preview</strong><small>Open site preview</small></a>
              </div>
              <div className="overview-tip"><span><strong>Keep your portfolio fresh</strong><small>Update projects and content regularly.</small></span><button type="button">View Tips</button></div>
            </article>

            <article className="overview-card overview-inbox-card" id="messages">
              <header><h2>Contact Inbox</h2><a href="#messages">View all</a></header>
              <div className="overview-message-list">
                {messages.map((message) => (
                  <div key={message.name}>
                    <span className={`overview-message-avatar is-${message.tone}`}>{message.initials}</span>
                    <span><strong>{message.name}</strong><small>{message.text}</small></span>
                    <time>{message.time}</time><i />
                  </div>
                ))}
              </div>
              <button className="overview-muted-action" type="button">Open all messages</button>
            </article>

            <article className="overview-card overview-media-card" id="media">
              <header><h2>Media / Storage</h2></header>
              <div className="overview-storage-donut"><span><strong>61%</strong><small>Used</small></span></div>
              <dl><div><dt>30.6 GB</dt><dd>Used Storage</dd></div><div><dt>1,248</dt><dd>Total Files</dd></div><div><dt>19.4 GB</dt><dd>Available</dd></div></dl>
              <a href="#media">Manage Media</a>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
