import { BellRing, Blocks, Clock3, Construction, Database, Image, MessageSquare, Search, Settings, Sparkles, Users } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { CmsWorkspace } from "../../components/cms-workspace";
import { getSessionUser } from "../../lib/server-api";

const modules = {
  experience: { title: "Experience", description: "Manage career history, roles, companies, and contributions.", icon: Clock3 },
  skills: { title: "Skills", description: "Organize capabilities, tools, and areas of expertise.", icon: Sparkles },
  testimonials: { title: "Testimonials", description: "Review and publish collaboration testimonials.", icon: MessageSquare },
  media: { title: "Media", description: "Upload, organize, and reuse visual portfolio assets.", icon: Image },
  messages: { title: "Messages", description: "Read and manage portfolio contact inquiries.", icon: BellRing },
  navigation: { title: "Navigation", description: "Configure website navigation links and ordering.", icon: Blocks },
  seo: { title: "SEO", description: "Control metadata and search visibility across the portfolio.", icon: Search },
  users: { title: "Users", description: "Manage CMS users, roles, and access permissions.", icon: Users },
  settings: { title: "Settings", description: "Configure portfolio and CMS preferences.", icon: Settings },
} as const;

export default async function ComingSoonPage({ params }: { params: Promise<{ module: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { module } = await params;
  const item = modules[module as keyof typeof modules];
  if (!item) notFound();
  const Icon = item.icon;

  return (
    <CmsWorkspace user={user} active={item.title} title={item.title} subtitle={item.description}>
      <div className="cms-module-body">
        <section className="cms-coming-soon">
          <div className="cms-coming-soon__visual"><span><Icon size={31} strokeWidth={1.6} /></span><i /><i /><i /></div>
          <p>MODULE IN DEVELOPMENT</p>
          <h2>Coming Soon</h2>
          <span>{item.description} This module is prepared in the dashboard system and will be connected when its API is available.</span>
          <div><Construction size={17} /><strong>UI prepared</strong><b>Backend integration pending</b></div>
          <a href="/">Return to Overview</a>
        </section>
      </div>
    </CmsWorkspace>
  );
}
