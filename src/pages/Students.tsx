import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { RoleFilter } from "@/components/RoleFilter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap } from "lucide-react";
import type { StudentResource, Profile } from "@/lib/types";
import { parseJsonArray } from "@/lib/types";

const STUDENT_TYPES = ["beginner_project", "learning_path", "internship", "spotlight"] as const;

const STUDENT_TYPE_LABELS: Record<string, string> = {
  all: "All",
  beginner_project: "Beginner Projects",
  learning_path: "Learning Paths",
  internship: "Internships",
  spotlight: "Spotlights",
};

const filterOptions = [
  { value: "all", label: "All" },
  ...STUDENT_TYPES.map((t) => ({ value: t, label: STUDENT_TYPE_LABELS[t] as string })),
];

export default function Students() {
  const [resourceType, setResourceType] = useState("all");

  const { data: resources, isLoading: resourcesLoading } = useQuery<StudentResource[]>({
    queryKey: ["/api/student-resources"],
  });

  const { data: profiles, isLoading: profilesLoading } = useQuery<Profile[]>({
    queryKey: ["/api/profiles"],
  });

  const filtered = (resources ?? []).filter(
    (r) => resourceType === "all" || r.resource_type === resourceType
  );

  const mentors = (profiles ?? []).filter((p) => {
    const badges = parseJsonArray(p.badges);
    return badges.includes("mentor") || p.role === "mentor";
  });

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">
          Student Corner
        </p>
        <h1 className="text-2xl font-display font-bold mb-1">Student Corner</h1>
        <p className="text-muted-foreground">
          Resources, projects, and mentorship for students getting into tech.
        </p>
      </div>

      {/* Resource Type Filter */}
      <RoleFilter options={filterOptions} value={resourceType} onChange={setResourceType} />

      {/* Resources */}
      {resourcesLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-semibold mb-1">Nothing here yet</p>
          <p className="text-sm">Resources for this category are coming soon.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((resource) => {
            const tags = parseJsonArray(resource.tags);
            return (
              <Card key={resource.id} className="border border-border bg-card">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-semibold text-sm">{resource.title}</h3>
                    <div className="flex gap-1 shrink-0">
                      {resource.difficulty && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {resource.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {resource.link && (
                    <a
                      href={resource.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-aurora-teal hover:underline inline-block"
                    >
                      Open →
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Mentors Section */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Mentors
        </p>
        {profilesLoading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : mentors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No mentors listed yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {mentors.map((mentor) => {
              const skills = parseJsonArray(mentor.skills).slice(0, 3);
              const initial = mentor.name.charAt(0).toUpperCase();
              return (
                <Link key={mentor.id} href={`/people/${mentor.id}`}>
                  <Card className="border border-border bg-card hover:border-aurora-teal/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-aurora-teal/20 flex items-center justify-center shrink-0">
                        <span className="text-aurora-teal font-display font-bold text-sm">
                          {initial}
                        </span>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="font-display font-semibold text-sm truncate">{mentor.name}</p>
                        {mentor.title && (
                          <p className="text-xs text-muted-foreground truncate">{mentor.title}</p>
                        )}
                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {skills.map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="border-t border-border pt-6">
        <Link href="/people">
          <Button size="sm">I'm a Student — Create Profile</Button>
        </Link>
      </div>
    </div>
  );
}
