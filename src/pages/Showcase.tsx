import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MapPin, ArrowUpRight, Rocket, Trophy } from "lucide-react";
import type { LaunchCycle } from "@/lib/types";

interface AffiliatedDemo {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  url: string;
  location: string;
  orgSlug?: string;
  logo?: string;
  accent: "rig-amber" | "prairie-amber" | "aurora-teal" | "boreal-spruce";
  status: "live" | "preview" | "pitch";
}

const ACCENT_CLASSES: Record<AffiliatedDemo["accent"], { border: string; bg: string; text: string }> = {
  "rig-amber": {
    border: "hover:border-rig-amber/50",
    bg: "bg-rig-amber/10",
    text: "text-rig-amber",
  },
  "prairie-amber": {
    border: "hover:border-prairie-amber/50",
    bg: "bg-prairie-amber/10",
    text: "text-prairie-amber",
  },
  "aurora-teal": {
    border: "hover:border-aurora-teal/50",
    bg: "bg-aurora-teal/10",
    text: "text-aurora-teal",
  },
  "boreal-spruce": {
    border: "hover:border-boreal-spruce-light/50",
    bg: "bg-boreal-spruce/30",
    text: "text-boreal-spruce-light",
  },
};

const STATUS_LABEL: Record<AffiliatedDemo["status"], string> = {
  live: "Live",
  preview: "Preview",
  pitch: "Awaiting owner sign-off",
};

const DEMOS: AffiliatedDemo[] = [
  {
    slug: "bull-oilfield",
    name: "Bull Oilfield Instrumentation",
    tagline:
      "NIST-traceable calibration, chart recorder and Hawk digital data logger rentals, Baker pump repair. Serving Northern Alberta's oil & gas sector.",
    category: "Oilfield Services",
    url: "https://bulloilfield.grandeprairie.dev",
    location: "Grande Prairie, AB",
    orgSlug: "bull-oilfield",
    logo: "/showcase/bull-oilfield.png",
    accent: "rig-amber",
    status: "pitch",
  },
  {
    slug: "bestkind",
    name: "Best Kind Baking",
    tagline:
      "Newfoundland-rooted home baking in Grande Prairie — fresh bread, dinner rolls, cinnamon buns and pull-aparts. Sat–Sun–Mon pickup.",
    category: "Local Food",
    url: "https://bestkind.grandeprairie.dev",
    location: "Grande Prairie, AB",
    accent: "prairie-amber",
    status: "live",
  },
];

const NETWORK_FEATURES = [
  {
    title: "Free landing page",
    description:
      "Hand-built marketing site on a memorable .grandeprairie.dev subdomain. No monthly hosting fee while affiliated.",
  },
  {
    title: "SEO / GEO / AEO out of the box",
    description:
      "LocalBusiness + FAQ structured data, geo meta tags, Open Graph cards, llms.txt — your business cited in AI search.",
  },
  {
    title: "Community visibility",
    description:
      "Cross-listed on /orgs, pinned on /map, and matched to incoming /business requests from locals looking for what you do.",
  },
  {
    title: "60-day kill switch",
    description:
      "Try the network with zero commitment. If it isn't driving calls in two months, we shut it down — no questions, no charge.",
  },
];

export default function Showcase() {
  const { data: launchCycle } = useQuery<LaunchCycle>({
    queryKey: ["/api/launches/current"],
  });

  return (
    <div className="p-4 md:p-6 space-y-10 max-w-5xl">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">
          Network
        </p>
        <h1 className="text-2xl font-display font-bold mb-1">Showcase</h1>
        <p className="text-muted-foreground max-w-2xl">
          Local Peace Region businesses with free landing pages, real SEO, and community visibility
          through the grandeprairie.dev network. Each gets a memorable subdomain, structured data
          designed to rank in AI search, and crosslinks from the main platform.
        </p>
      </div>

      <section className="border-y border-border py-5">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Community launches</p>
            <h2 className="mt-1 font-display text-lg font-semibold">Built here, shipped this month</h2>
          </div>
          <Link href="/launches">
            <span className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-aurora-teal hover:underline">
              Open Launch Board <ArrowUpRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
        {launchCycle?.entries.length ? (
          <div className="divide-y divide-border">
            {launchCycle.entries.slice(0, 3).map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                {entry.rank === 1
                  ? <Trophy className="h-4 w-4 shrink-0 text-prairie-amber" />
                  : <span className="w-4 shrink-0 text-center font-mono text-xs text-muted-foreground">#{entry.rank}</span>}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{entry.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{entry.pitch}</p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{entry.votes_count} support</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Rocket className="h-5 w-5 text-aurora-teal" />
            <span>The monthly board is open for its first community launch.</span>
          </div>
        )}
      </section>

      {/* Affiliated demos */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Affiliated businesses
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {DEMOS.map((demo) => {
            const accent = ACCENT_CLASSES[demo.accent];
            return (
              <Card
                key={demo.slug}
                className={`border border-border bg-card transition-colors ${accent.border}`}
              >
                <CardContent className="p-5 flex flex-col gap-4 h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-14 h-14 rounded-md ${accent.bg} flex items-center justify-center shrink-0 overflow-hidden`}
                    >
                      {demo.logo ? (
                        <img
                          src={demo.logo}
                          alt={`${demo.name} logo`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className={`font-display font-bold text-lg ${accent.text}`}>
                          {demo.name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {demo.category}
                      </Badge>
                      <span className={`text-[10px] uppercase tracking-wider font-semibold ${accent.text}`}>
                        {STATUS_LABEL[demo.status]}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-display font-semibold text-base leading-snug">
                      {demo.name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{demo.tagline}</p>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                    <MapPin className="w-3 h-3" />
                    <span>{demo.location}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-auto pt-2 border-t border-border">
                    {demo.orgSlug ? (
                      <Link href={`/orgs/${demo.orgSlug}`}>
                        <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center gap-1">
                          Org profile <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">No org profile yet</span>
                    )}
                    <a
                      href={demo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${accent.text} hover:underline`}
                    >
                      Visit site <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* What's included */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          What's included on the network
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {NETWORK_FEATURES.map((feature) => (
            <Card key={feature.title} className="border border-border bg-card">
              <CardContent className="p-4 space-y-1.5">
                <h4 className="font-display font-semibold text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Card className="border border-aurora-teal/30 bg-aurora-teal/5">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 space-y-1">
            <h3 className="font-display font-semibold text-base">Run a Peace Region business?</h3>
            <p className="text-xs text-muted-foreground">
              We're piloting affiliated landing pages with a small group of GP-area businesses. No
              fee while we're proving the model — your only commitment is verifying the content is
              accurate.
            </p>
          </div>
          <Link href="/business">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-aurora-teal hover:underline cursor-pointer shrink-0">
              Get on the list <ArrowUpRight className="w-4 h-4" />
            </span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
