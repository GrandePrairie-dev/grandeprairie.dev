import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink } from "lucide-react";

interface OrgMember {
  id: number;
  name: string;
  username: string;
  title: string | null;
  role: string | null;
  avatar_url: string | null;
  skills: string;
  org_title: string | null;
}

interface OrgProject {
  id: number;
  title: string;
  description: string | null;
  status: string | null;
  tags: string;
}

interface OrgDetail {
  id: number;
  slug: string;
  name: string;
  type: string | null;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  location: string | null;
  members: OrgMember[];
  projects: OrgProject[];
}

const TYPE_BADGE_CLASSES: Record<string, string> = {
  education: "bg-aurora-teal/10 text-aurora-teal",
  company: "bg-boreal-spruce/40 text-boreal-spruce-light",
  community: "bg-prairie-amber/10 text-prairie-amber",
  government: "bg-rig-amber/10 text-rig-amber",
};

export default function OrgDetail() {
  const params = useParams<{ slug: string }>();

  const { data: org, isLoading } = useQuery<OrgDetail>({
    queryKey: [`/api/organizations/${params.slug}`],
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-3xl space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-4 md:p-6 max-w-3xl">
        <p className="text-muted-foreground">Organization not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      <Link href="/orgs">
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back
        </span>
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-2xl font-display font-bold">{org.name}</h1>
          {org.type && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize mt-1 ${
                TYPE_BADGE_CLASSES[org.type] ?? "bg-muted text-muted-foreground"
              }`}
            >
              {org.type}
            </span>
          )}
        </div>

        {org.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{org.description}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {org.location && (
            <span className="text-xs text-muted-foreground/60">{org.location}</span>
          )}
          {org.website_url && (
            <a
              href={org.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {org.website_url.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>

      {/* Members */}
      {org.members.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Members
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {org.members.map((member) => (
              <Link key={member.id} href={`/people/${member.id}`}>
                <Card className="hover:border-aurora-teal/50 transition-colors cursor-pointer">
                  <CardContent className="p-3 flex items-center gap-3">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-boreal-spruce flex items-center justify-center text-boreal-spruce-light text-xs font-semibold shrink-0">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{member.name}</p>
                      {(member.org_title || member.title) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {member.org_title ?? member.title}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {org.projects.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Projects
          </p>
          <div className="space-y-2">
            {org.projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:border-aurora-teal/50 transition-colors cursor-pointer">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{project.title}</p>
                      {project.status && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {project.status}
                        </Badge>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {org.members.length === 0 && org.projects.length === 0 && (
        <p className="text-sm text-muted-foreground">No members or projects linked yet.</p>
      )}
    </div>
  );
}
