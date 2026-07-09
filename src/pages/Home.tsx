import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AuroraHero } from "@/components/AuroraHero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, Users, Lightbulb, ExternalLink, GraduationCap, Rocket, UserPlus, MessageSquare } from "lucide-react";
import type { Idea, Profile, Event } from "@/lib/types";
import { parseJsonArray } from "@/lib/types";

const LOCAL_ANSWERS = [
  {
    question: "What is GrandePrairie.dev?",
    answer:
      "GrandePrairie.dev is a digital commons for builders in Grande Prairie and the Peace Region. It connects developers, trades workers, founders, students, mentors, organizations, and small businesses.",
  },
  {
    question: "Who is GrandePrairie.dev for?",
    answer:
      "Anyone building practical technology locally: software developers, electricians, welders, operators, NWP students, startup founders, mentors, and business owners.",
  },
  {
    question: "What industries does it serve?",
    answer:
      "The platform focuses on regional industries including oil and gas field operations, pipeline services, agriculture, forestry, logistics, construction, and local services.",
  },
  {
    question: "Is GrandePrairie.dev connected to Northwestern Polytechnic?",
    answer:
      "Students can find beginner-friendly projects, mentors, community profiles, events, and local paths connected to Northwestern Polytechnic and the wider Peace Region ecosystem.",
  },
  {
    question: "How can a small business get tech help in Grande Prairie?",
    answer:
      "A business can post a request for help with automation, websites, data, or AI so local builders can review the problem and express interest.",
  },
];

export default function Home() {
  const { data: ideas, isLoading: ideasLoading } = useQuery<Idea[]>({ queryKey: ["/api/ideas/featured"] });
  const { data: allProfiles, isLoading: profilesLoading } = useQuery<Profile[]>({ queryKey: ["/api/profiles"] });
  const sortedProfiles = [...(allProfiles ?? [])]
    .sort((a, b) => b.is_featured - a.is_featured)
  const displayProfiles = sortedProfiles.slice(0, 4);
  const featuredIdeas = (ideas ?? []).slice(0, 3);
  const { data: events } = useQuery<Event[]>({ queryKey: ["/api/events/upcoming"] });
  const { data: activity } = useQuery<any[]>({ queryKey: ["/api/activity?limit=5"] });

  const leadIdea = featuredIdeas[0];
  const leadProfile = sortedProfiles[0];
  const nextEvent = events?.[0];
  const pulseItems = [
    {
      href: leadIdea ? `/ideas/${leadIdea.id}` : "/ideas",
      icon: Lightbulb,
      label: "Idea board",
      title: leadIdea?.title ?? "First field problem wanted",
      detail: leadIdea ? `${leadIdea.votes} votes` : "Add a local problem builders can solve",
      color: "text-prairie-amber",
    },
    {
      href: leadProfile ? `/people/${leadProfile.id}` : "/people",
      icon: Users,
      label: "Builder network",
      title: leadProfile?.name ?? "First builders welcome",
      detail: leadProfile ? leadProfile.title || leadProfile.role : "Create a profile and get discoverable",
      color: "text-aurora-teal",
    },
    {
      href: "/calendar",
      icon: Calendar,
      label: "Next meetup",
      title: nextEvent?.title ?? "Events forming",
      detail: nextEvent
        ? new Date(nextEvent.start_time).toLocaleDateString("en-CA", { month: "short", day: "numeric" })
        : "Put a workshop or demo night on the calendar",
      color: "text-rig-amber",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <AuroraHero />

      <div className="px-4 md:px-6 pb-12 space-y-10">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold">Community Pulse</h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
              Live from GP
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {pulseItems.map(({ href, icon: Icon, label, title, detail, color }) => (
              <Link key={label} href={href}>
                <Card className="h-full cursor-pointer border-border/80 bg-card/70 transition-colors hover:border-boreal-spruce-light/50">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <Icon className={`h-5 w-5 ${color}`} />
                      <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                        {label}
                      </span>
                    </div>
                    <h3 className="line-clamp-1 text-sm font-semibold">{title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{detail}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

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
          ) : featuredIdeas.length === 0 ? (
            <Card className="border-dashed border-aurora-teal/40 bg-aurora-teal/5">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-aurora-teal/10 text-aurora-teal">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">No featured ideas yet</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Start with a local problem, a half-built tool, or a field workflow that needs better software.
                    </p>
                  </div>
                </div>
                <Link href="/ideas">
                  <Button size="sm" variant="outline" className="w-full shrink-0 text-muted-foreground sm:w-auto">
                    Open Ideas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {featuredIdeas.map((idea) => (
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

        {/* Builders */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold">Builders</h2>
            <Link href="/people">
              <span className="text-aurora-teal text-sm font-medium cursor-pointer">View all →</span>
            </Link>
          </div>
          {profilesLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">{[1,2].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : displayProfiles.length === 0 ? (
            <Card className="border-dashed border-prairie-amber/40 bg-prairie-amber/5">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-prairie-amber/10 text-prairie-amber">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Be one of the first builders listed</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Add a profile so founders, students, trades teams, and local organizations can find you.
                    </p>
                  </div>
                </div>
                <Link href="/people">
                  <Button size="sm" variant="outline" className="w-full shrink-0 text-muted-foreground sm:w-auto">
                    Open People
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {displayProfiles.map((profile) => (
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
                      <p className="text-[10px] text-aurora-teal/80 mt-1 italic">All levels welcome. Show up with a project or just curiosity.</p>
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

        {/* Recent Activity */}
        {activity && activity.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-display font-bold">Recent Activity</h2>
            <div className="space-y-2">
              {activity.map((item: any) => {
                const Icon = item.type === "new_member" ? UserPlus
                  : item.type === "new_idea" ? Lightbulb
                  : item.type === "new_event" ? Calendar
                  : MessageSquare;
                return (
                  <div key={item.id} className="flex items-center gap-3 text-sm py-2 border-b border-border last:border-0">
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-medium">{item.profile_name}</span>
                      {" "}
                      {item.type === "new_member" ? "joined the community"
                        : item.type === "new_idea" ? `submitted "${item.summary}"`
                        : item.type === "new_event" ? `created "${item.summary}"`
                        : item.summary}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold">Peace Region Answers</h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
              Local context
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {LOCAL_ANSWERS.map((item) => (
              <Card key={item.question} className="border-border/80 bg-card/70">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold">{item.question}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Local Resources */}
        <section className="space-y-4">
          <h2 className="text-lg font-display font-bold">Local Resources</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href="https://www.nwpolytech.ca/program/computing-science-degree" target="_blank" rel="noopener noreferrer">
              <Card className="cursor-pointer hover:border-boreal-spruce-light/50 transition-colors h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-aurora-teal shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-1">
                        Northwestern Polytechnic <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">CS degree with AI, cloud, and big data tracks. Venture AI events. Trades apprenticeships. The primary talent pipeline for GP tech.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
            <a href="https://www.innovatenorthwest.ca" target="_blank" rel="noopener noreferrer">
              <Card className="cursor-pointer hover:border-boreal-spruce-light/50 transition-colors h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Rocket className="w-5 h-5 text-prairie-amber shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-1">
                        Innovate Northwest <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Mentorship, accelerators, and ecosystem access for Peace Region startups and tech businesses.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { href: "/people", icon: Users, label: "People", color: "text-aurora-teal" },
              { href: "/ideas", icon: Lightbulb, label: "Ideas", color: "text-prairie-amber" },
              { href: "/board", icon: MessageSquare, label: "Board", color: "text-rig-amber" },
              { href: "/map", icon: MapPin, label: "Map", color: "text-boreal-spruce-light" },
              { href: "/calendar", icon: Calendar, label: "Calendar", color: "text-river-slate" },
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
