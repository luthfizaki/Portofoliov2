import type { ComponentType, ReactNode } from "react";
import {
  Bell,
  BriefcaseBusiness,
  ContactRound,
  Eye,
  FileText,
  FolderKanban,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  Menu,
  Search,
  Settings,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { SessionUser } from "../lib/api";
import { LogoutButton } from "./logout-button";

type Icon = ComponentType<{ size?: number; strokeWidth?: number }>;

export const cmsNavigation: Array<{ icon: Icon; label: string; href: string; badge?: string }> = [
  { icon: LayoutDashboard, label: "Overview", href: "/" },
  { icon: FolderKanban, label: "Projects", href: "/projects" },
  { icon: FileText, label: "Pages", href: "/pages" },
  { icon: BriefcaseBusiness, label: "Experience", href: "/experience" },
  { icon: Star, label: "Skills", href: "/skills" },
  { icon: GalleryHorizontalEnd, label: "Testimonials", href: "/testimonials" },
  { icon: ContactRound, label: "Contact Final", href: "/contact-final" },
  { icon: ImageIcon, label: "Media", href: "/media" },
  { icon: Mail, label: "Messages", href: "/messages", badge: "3" },
  { icon: Menu, label: "Navigation", href: "/navigation" },
  { icon: Search, label: "SEO", href: "/seo" },
  { icon: Users, label: "Users", href: "/users" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "LA";
}

export function CmsWorkspace({
  user,
  active,
  title,
  subtitle,
  children,
  headerAction,
}: {
  user: SessionUser;
  active: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  headerAction?: ReactNode;
}) {
  const role = user.role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <main className="overview-dashboard cms-workspace">
      <aside className="overview-sidebar" aria-label="CMS navigation">
        <Link className="overview-brand" href="/">
          <span className="overview-brand__mark">P</span>
          <span><strong>Portfolio V2 CMS</strong><small>Manage your portfolio</small></span>
        </Link>
        <nav className="overview-nav">
          {cmsNavigation.map(({ icon: IconComponent, label, href, badge }) => (
            <Link className={active === label ? "is-active" : ""} href={href} key={label}>
              <IconComponent size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {badge && <em>{badge}</em>}
            </Link>
          ))}
        </nav>
        <div className="overview-storage-mini">
          <div><strong>Storage Used</strong><b>61%</b></div>
          <span><i /></span>
          <small>30.6 GB / 50 GB</small>
          <Link href="/media">Manage Storage</Link>
        </div>
        <LogoutButton />
      </aside>

      <section className="overview-main">
        <header className="overview-topbar">
          <div className="overview-heading">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <label className="overview-search">
            <Search size={18} strokeWidth={1.8} />
            <input aria-label="Search CMS" placeholder="Search projects, pages, media..." />
            <kbd>⌘K</kbd>
          </label>
          <div className="overview-account">
            {headerAction}
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
        {children}
      </section>
    </main>
  );
}
