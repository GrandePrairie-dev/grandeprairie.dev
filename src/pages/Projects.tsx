import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RoleFilter } from "@/components/RoleFilter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, ExternalLink } from "lucide-react";
import type { Project } from "@/lib/types";
import { parseJsonArray } from "@/lib/types";

const STAGE_LABELS: Record<string, string> = {
  all: "All",
  concept: "Concept",
  recruiting: "Recruiting",
  building: "Building",
  testing: "Testing",
  launched: "Launched",
};

const STAGE_COLORS: Record<string, string> = {
  concept: "bg-muted text-muted-foreground",
  recruiting: "bg-prairie-amber/10 text-prairie-amber",
  building: "bg-aurora-teal/10 text-aurora-teal",
  testing: "bg-rig-amber/10 text-rig-amber",
  launched: "bg-green-500/10 text-green-700 dark:text-green-400",
};

const filterOptions = Object.entries(STAGE_LABELS).map(([value, label]) => ({ value, label }));

function StageBadge({ stage }: { stage: string | null }) {
  const colorClass = STAGE_COLORS[stage ?? ""] ?? "bg-muted text-muted-foreground";
  const label = STAGE_LABELS[stage ?? ""] ?? stage ?? "Unknown";
  return (
    <span className={`inline-flex items-center rounded-[6px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colorClass}`}>
      {label}
    </span>
  );
}

interface ProjectCardProps {
  project: Project;
  featured: boolean;
}

function ProjectCard({ project, featured }: ProjectCardProps) {
  const tags = parseJsonArray(project.tags);

  const content = (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <h3 className="font-semibold text-sm">{project.title}</h3>
        <StageBadge stage={project.status} />
      </div>
      {featured && project.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
      )}
      {featured && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      {!featured && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      {featured && project.repo_url && (
        <a
          href={project.repo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3 h-3" />
          {project.repo_url.replace(/^https?:\/\//, "")}
        </a>
      )}
    </div>
  );

  if (featured) {
    return (
      <Card className="mb-2 border-l-2 border-l-aurora-teal hover:border-boreal-spruce-light/50 transition-colors">
        <CardContent className="p-4">{content}</CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 border-b border-border hover:bg-muted/30 transition-colors">
      {content}
    </div>
  );
}

export default function Projects() {
  const [stage, setStage] = useState("all");

  const { data: projects, isLoading } = useQuery<Project[]>({ queryKey: ["/api/projects"] });

  const filtered = (projects ?? []).filter(
    (p) => stage === "all" || p.status === stage
  );

  const sorted = [...filtered].sort((a, b) => {
    if (b.is_featured !== a.is_featured) return b.is_featured - a.is_featured;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold">Projects</h1>
      </div>

      <RoleFilter options={filterOptions} value={stage} onChange={setStage} />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-semibold mb-1">No projects yet</p>
          <p className="text-sm">Start one from an idea.</p>
        </div>
      ) : (
        <div>
          {sorted.map((project) => (
            <ProjectCard key={project.id} project={project} featured={!!project.is_featured} />
          ))}
        </div>
      )}
    </div>
  );
}
