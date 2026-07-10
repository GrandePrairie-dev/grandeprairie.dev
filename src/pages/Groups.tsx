import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { parseJsonArray, type CommunityGroup } from "@/lib/types";
import { BrainCircuit, Code2, GraduationCap, Lightbulb, Palette, ShieldCheck, Users } from "lucide-react";

const ICONS = {
  ai: BrainCircuit,
  founders: Lightbulb,
  developers: Code2,
  students: GraduationCap,
  design: Palette,
  cybersecurity: ShieldCheck,
} as const;

export default function Groups() {
  const { data: groups, isLoading } = useQuery<CommunityGroup[]>({ queryKey: ["/api/groups"] });
  return (
    <div className="max-w-4xl space-y-6 p-4 md:p-6">
      <header className="border-b border-border pb-5">
        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Find your people</p>
        <h1 className="font-display text-2xl font-bold">Community groups</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Curated topic pages for finding collaborators and organizers. Discussions stay on the shared community board.
        </p>
      </header>
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-44 w-full" />)}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(groups ?? []).map((group) => {
            const Icon = ICONS[group.slug as keyof typeof ICONS] ?? Users;
            return (
              <Link key={group.id} href={`/groups/${group.slug}`}>
                <article className="h-full cursor-pointer rounded-md border border-border bg-card p-4 transition-colors hover:border-aurora-teal/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-aurora-teal/10 text-aurora-teal"><Icon /></div>
                    {group.viewer_role && <Badge variant="secondary">{group.viewer_role}</Badge>}
                  </div>
                  <h2 className="mt-4 font-display text-base font-semibold">{group.name}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{group.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {parseJsonArray(group.tags).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                  </div>
                  <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> {group.member_count} {group.member_count === 1 ? "member" : "members"}</p>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
