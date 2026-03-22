import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  Building2,
  Wrench,
  BookOpen,
  Globe,
  ExternalLink,
} from "lucide-react";

interface ResourceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: string;
}

function ResourceCard({ icon, title, description, link }: ResourceCardProps) {
  return (
    <Card className="hover:border-boreal-spruce-light/50 transition-colors">
      <CardContent className="p-4 flex flex-col gap-2 h-full">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground flex-1">{description}</p>
        {link && (
          <a
            href={link.startsWith("http") ? link : `https://${link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            {link.replace(/^https?:\/\//, "")}
          </a>
        )}
      </CardContent>
    </Card>
  );
}

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

function Section({ label, children }: SectionProps) {
  return (
    <section className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

export default function TechHub() {
  return (
    <div className="p-4 md:p-6 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-display font-bold">Tech Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resources, organizations, and tools for the Peace Region tech ecosystem.
        </p>
      </div>

      <Section label="Local Organizations">
        <ResourceCard
          icon={<GraduationCap className="w-4 h-4" />}
          title="Northwestern Polytechnic"
          description="CS degree with AI, cloud, big data tracks. Venture AI events. Trades apprenticeships."
          link="nwpolytech.ca"
        />
        <ResourceCard
          icon={<Building2 className="w-4 h-4" />}
          title="Innovate Northwest"
          description="Mentorship, accelerators, and ecosystem access for Peace Region startups."
          link="innovatenorthwest.ca"
        />
        <ResourceCard
          icon={<Building2 className="w-4 h-4" />}
          title="GP Chamber of Commerce"
          description="Business network, advocacy, and community events."
          link="grandeprairiechamber.com"
        />
        <ResourceCard
          icon={<Building2 className="w-4 h-4" />}
          title="InvestNW Alberta"
          description="Regional investment attraction and economic development."
          link="investnwalberta.ca"
        />
      </Section>

      <Section label="Learning Resources">
        <ResourceCard
          icon={<GraduationCap className="w-4 h-4" />}
          title="NWP Computing Science Degree"
          description="4-year degree with AI, cloud computing, networking, and big data specializations."
        />
        <ResourceCard
          icon={<BookOpen className="w-4 h-4" />}
          title="freeCodeCamp"
          description="Free, self-paced web development curriculum."
          link="freecodecamp.org"
        />
        <ResourceCard
          icon={<BookOpen className="w-4 h-4" />}
          title="The Odin Project"
          description="Full-stack open-source curriculum."
          link="theodinproject.com"
        />
      </Section>

      <Section label="Tools & Platforms">
        <ResourceCard
          icon={<Globe className="w-4 h-4" />}
          title="GitHub"
          description="Code hosting, collaboration, and project management."
          link="github.com"
        />
        <ResourceCard
          icon={<Wrench className="w-4 h-4" />}
          title="Cloudflare"
          description="Edge computing, DNS, and deployment platform."
          link="cloudflare.com"
        />
        <ResourceCard
          icon={<Wrench className="w-4 h-4" />}
          title="Vercel"
          description="Frontend deployment and serverless functions."
          link="vercel.com"
        />
      </Section>
    </div>
  );
}
