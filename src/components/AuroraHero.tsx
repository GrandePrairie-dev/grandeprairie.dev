import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { Stats } from "@/lib/types";

export function AuroraHero() {
  const { data: stats } = useQuery<Stats>({ queryKey: ["/api/stats"] });

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Aurora gradient effects */}
      <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-[500px] h-[180px] bg-[radial-gradient(ellipse,rgba(61,191,168,0.12)_0%,rgba(45,74,62,0.06)_40%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-[-30px] right-[15%] w-[300px] h-[120px] bg-[radial-gradient(ellipse,rgba(212,162,78,0.08)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative text-center px-4">
        {/* Badges */}
        <div className="inline-flex gap-2 mb-6">
          <span className="px-3 py-1 rounded bg-boreal-spruce text-boreal-spruce-light text-[9px] font-bold uppercase tracking-[0.06em] border border-boreal-spruce-light/30">
            55°N · 118°W
          </span>
          <span className="px-3 py-1 rounded bg-prairie-amber/15 text-prairie-amber text-[9px] font-bold uppercase tracking-[0.06em]">
            Now Open
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-display font-[800] tracking-tight uppercase mb-3">
          Build Real Things
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto mb-8 leading-relaxed">
          The Peace Region's open platform for developers, founders, trades, and students.
        </p>

        {/* CTAs */}
        <div className="inline-flex gap-3 mb-10">
          <Link href="/people">
            <Button className="bg-boreal-spruce text-aurora-teal border border-boreal-spruce-light font-bold">
              Join the Community
            </Button>
          </Link>
          <Link href="/ideas">
            <Button variant="outline" className="text-muted-foreground">
              Explore Ideas →
            </Button>
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-8 md:gap-12 pt-6 border-t border-border">
          <StatItem value={stats?.profiles ?? 0} label="builders" color="text-aurora-teal" />
          <StatItem value={stats?.ideas ?? 0} label="ideas" color="text-prairie-amber" />
          <StatItem value={stats?.projects ?? 0} label="projects" color="text-foreground" />
          <StatItem value={stats?.events ?? 0} label="events" color="text-rig-amber" />
        </div>
      </div>
    </section>
  );
}

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div>
      <span className={`text-xl md:text-2xl font-[800] ${color}`}>{value}</span>
      <span className="text-muted-foreground text-[10px] block uppercase tracking-[0.05em] mt-1">{label}</span>
    </div>
  );
}
