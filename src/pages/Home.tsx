import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AuroraHero } from "@/components/AuroraHero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, Users, Lightbulb } from "lucide-react";
import type { Idea, Profile, Event } from "@/lib/types";
import { parseJsonArray } from "@/lib/types";

export default function Home() {
  const { data: ideas, isLoading: ideasLoading } = useQuery<Idea[]>({ queryKey: ["/api/ideas/featured"] });
  const { data: profiles, isLoading: profilesLoading } = useQuery<Profile[]>({ queryKey: ["/api/profiles/featured"] });
  const { data: events } = useQuery<Event[]>({ queryKey: ["/api/events/upcoming"] });

  const nextEvent = events?.[0];

  return (
    <div className="max-w-4xl mx-auto">
      <AuroraHero />

      <div className="px-4 md:px-6 pb-12 space-y-10">
        {/* Featured Ideas */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold">Featured Ideas</h2>
            <Link href="/ideas">
              <span className="text-aurora-teal text-sm font-medium cursor-pointer">View all →</span>
            </Link>
          </div>
          {ideasLoading ? (
            <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : (
            <div className="space-y-3">
              {(ideas ?? []).slice(0, 3).map((idea) => (
                <Link key={idea.id} href={`/ideas/${idea.id}`}>
                  <Card className="cursor-pointer hover:border-boreal-spruce-light/50 transition-colors border-l-2 border-l-aurora-teal">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm">{idea.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{idea.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {parseJsonArray(idea.tags).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                        <span className="text-prairie-amber font-bold text-sm shrink-0">▲ {idea.votes}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Featured Builders */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold">Featured Builders</h2>
            <Link href="/people">
              <span className="text-aurora-teal text-sm font-medium cursor-pointer">View all →</span>
            </Link>
          </div>
          {profilesLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">{[1,2].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(profiles ?? []).slice(0, 4).map((profile) => (
                <Link key={profile.id} href={`/people/${profile.id}`}>
                  <Card className="cursor-pointer hover:border-boreal-spruce-light/50 transition-colors">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-boreal-spruce flex items-center justify-center text-boreal-spruce-light font-bold text-sm shrink-0">
                        {profile.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">{profile.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{profile.title || profile.role}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {parseJsonArray(profile.skills).slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-[10px]">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Next Event */}
        {nextEvent && (
          <section className="space-y-4">
            <h2 className="text-lg font-display font-bold">Next Event</h2>
            <Link href="/calendar">
              <Card className="cursor-pointer hover:border-boreal-spruce-light/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="text-center shrink-0">
                      <div className="text-2xl font-[800] text-aurora-teal">
                        {new Date(nextEvent.start_time).getDate()}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        {new Date(nextEvent.start_time).toLocaleDateString("en-CA", { month: "short" })}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm">{nextEvent.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{nextEvent.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {nextEvent.category && <Badge variant="secondary" className="text-[10px]">{nextEvent.category}</Badge>}
                        {nextEvent.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {nextEvent.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </section>
        )}

        {/* Quick Links */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/people", icon: Users, label: "People", color: "text-aurora-teal" },
              { href: "/ideas", icon: Lightbulb, label: "Ideas", color: "text-prairie-amber" },
              { href: "/map", icon: MapPin, label: "Map", color: "text-boreal-spruce-light" },
              { href: "/calendar", icon: Calendar, label: "Calendar", color: "text-rig-amber" },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href}>
                <Card className="cursor-pointer hover:border-boreal-spruce-light/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <span className="text-sm font-semibold">{label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
