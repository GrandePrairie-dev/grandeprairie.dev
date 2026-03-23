import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleFilter } from "@/components/RoleFilter";
import { ExternalLink, Building2 } from "lucide-react";

interface Organization {
  id: number;
  slug: string;
  name: string;
  type: string | null;
  description: string | null;
  website_url: string | null;
  location: string | null;
}

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "education", label: "Education" },
  { value: "company", label: "Company" },
  { value: "community", label: "Community" },
  { value: "government", label: "Government" },
];

const TYPE_BADGE_CLASSES: Record<string, string> = {
  education: "bg-aurora-teal/10 text-aurora-teal",
  company: "bg-boreal-spruce/40 text-boreal-spruce-light",
  community: "bg-prairie-amber/10 text-prairie-amber",
  government: "bg-rig-amber/10 text-rig-amber",
};

export default function Organizations() {
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: orgs, isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const filtered = (orgs ?? []).filter((org) => {
    if (typeFilter === "all") return true;
    return org.type === typeFilter;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-display font-bold">Organizations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Local organizations in the Peace Region tech ecosystem.
        </p>
      </div>

      <RoleFilter options={TYPE_FILTER_OPTIONS} value={typeFilter} onChange={setTypeFilter} />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-semibold mb-1">No organizations found</p>
          <p className="text-sm">Try adjusting your filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((org) => (
            <Link key={org.id} href={`/orgs/${org.slug}`}>
              <Card className="hover:border-aurora-teal/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col gap-2 h-full">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-semibold text-sm leading-snug">{org.name}</h3>
                    {org.type && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 capitalize ${
                          TYPE_BADGE_CLASSES[org.type] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {org.type}
                      </span>
                    )}
                  </div>

                  {org.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                      {org.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                    {org.location && (
                      <span className="text-xs text-muted-foreground/60">{org.location}</span>
                    )}
                    {org.website_url && (
                      <a
                        href={org.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {org.website_url.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
