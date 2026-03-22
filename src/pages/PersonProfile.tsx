import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Github, Linkedin, Globe } from "lucide-react";
import type { Profile } from "@/lib/types";
import { parseJsonArray, parseJsonObject } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function PersonProfile() {
  const params = useParams<{ id: string }>();
  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: [`/api/profiles/${params.id}`],
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-3xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 md:p-6 max-w-3xl">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  const skills = parseJsonArray(profile.skills);
  const badges = parseJsonArray(profile.badges);
  const links = parseJsonObject(profile.links);

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      <Link href="/people">
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back
        </span>
      </Link>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-md bg-boreal-spruce flex items-center justify-center text-boreal-spruce-light font-bold text-xl shrink-0">
              {profile.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">{profile.name}</h1>
              <p className="text-sm text-muted-foreground">{profile.title || profile.role}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs capitalize">{profile.role}</Badge>
                {badges.map((b) => (
                  <Badge key={b} className="text-xs">{b}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Bio</h3>
              <p className="text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Skills</h3>
              <div className="flex flex-wrap gap-1">
                {skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {Object.keys(links).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Links</h3>
              <div className="flex flex-wrap gap-3">
                {links.github && (
                  <a href={`https://github.com/${links.github}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <Github className="w-4 h-4" /> GitHub
                  </a>
                )}
                {links.linkedin && (
                  <a href={`https://linkedin.com/in/${links.linkedin}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                )}
                {links.website && (
                  <a href={links.website.startsWith("http") ? links.website : `https://${links.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <Globe className="w-4 h-4" /> Website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Joined */}
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Joined {formatDate(profile.created_at)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
