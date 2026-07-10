import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, ArrowLeft, Award, Github, Linkedin, Globe, Pencil, ShieldCheck } from "lucide-react";
import type { CommunityGroup, Profile, ReputationSummary } from "@/lib/types";
import { parseJsonArray, parseJsonObject } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const TRUST_LABELS = ["New member", "Contributor", "Trusted contributor", "Community steward"];
const BADGE_LABELS: Record<string, string> = {
  first_contribution: "First Contribution",
  community_host: "Community Host",
  shows_up: "Shows Up",
  neighbour: "Good Neighbour",
  problem_solver: "Problem Solver",
  helpful_neighbour: "Helpful Neighbour",
  shipped_it: "Shipped It",
};
const ACTION_LABELS: Record<string, string> = {
  board_post: "Posts",
  board_reply: "Replies",
  event_created: "Events hosted",
  event_rsvp: "Events attended",
  helpful_answer: "Helpful answers",
  accepted_answer: "Accepted answers",
  project_launched: "Projects launched",
};

export default function PersonProfile() {
  const params = useParams<{ id: string }>();
  const { user, isLoggedIn, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showMentorForm, setShowMentorForm] = useState(false);
  const [mentorMessage, setMentorMessage] = useState("");

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: [`/api/profiles/${params.id}`],
  });
  const { data: reputation } = useQuery<ReputationSummary>({
    queryKey: [`/api/profiles/${params.id}/reputation`],
  });
  const { data: groups } = useQuery<CommunityGroup[]>({
    queryKey: [`/api/profiles/${params.id}/groups`],
  });

  const isOwnProfile = user?.id === Number(params.id);
  const isMentor = !!(profile as any)?.mentor_available;
  const mentorTopics = parseJsonArray((profile as any)?.mentor_topics);

  // Check if current user has a pending request to this mentor
  const { data: outgoingRequests } = useQuery<any[]>({
    queryKey: ["/api/mentor-requests/outgoing"],
    enabled: isLoggedIn && isMentor && !isOwnProfile,
  });

  const hasPendingRequest = (outgoingRequests ?? []).some(
    (r: any) => r.mentor_profile_id === Number(params.id) && r.status === "pending"
  );

  const mentorRequestMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/mentors/${params.id}/request`, { message: mentorMessage || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor-requests/outgoing"] });
      toast({ title: "Mentor request sent!" });
      setShowMentorForm(false);
      setMentorMessage("");
    },
    onError: () => {
      toast({ title: "Could not send request", variant: "destructive" });
    },
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
      <div className="flex items-center justify-between">
        <Link href="/people">
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back
          </span>
        </Link>
        {user?.id === profile.id && (
          <Link href={`/people/${profile.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1">
              <Pencil className="w-3 h-3" /> Edit Profile
            </Button>
          </Link>
        )}
      </div>

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
                {isMentor && (
                  <Badge className="text-xs bg-aurora-teal/20 text-aurora-teal border-aurora-teal/30">Mentor</Badge>
                )}
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

          {/* Mentor Topics */}
          {isMentor && mentorTopics.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Mentor Topics</h3>
              <div className="flex flex-wrap gap-1">
                {mentorTopics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="text-xs">{topic}</Badge>
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

      {!!groups?.length && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Community groups</h2>
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <Link key={group.id} href={`/groups/${group.slug}`}>
                <Badge variant="outline" className="cursor-pointer hover:border-aurora-teal/60">
                  {group.name}{group.viewer_role === "organizer" ? " · Organizer" : ""}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {reputation && (
        <Card>
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-aurora-teal/10 text-aurora-teal">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Community reputation</p>
                  <h2 className="font-display text-base font-semibold">
                    {TRUST_LABELS[reputation.trust_level] ?? "Community member"}
                  </h2>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-mono text-xl font-bold text-prairie-amber">{reputation.points}</p>
                <p className="text-xs text-muted-foreground">contribution points</p>
              </div>
            </div>

            {reputation.next_level_points && (
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>Level {reputation.trust_level}</span>
                  <span>{reputation.next_level_points - reputation.points} points to next level</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded bg-muted">
                  <div
                    className="h-full bg-aurora-teal"
                    style={{
                      width: `${Math.min(100, (reputation.points / reputation.next_level_points) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {reputation.badges.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                  <Award className="h-3.5 w-3.5" /> Earned badges
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {reputation.badges.map((badge) => (
                    <Badge key={badge.key} variant="outline">
                      {BADGE_LABELS[badge.key] ?? badge.key.replaceAll("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {reputation.contributions.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" /> Contributions
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                  {reputation.contributions
                    .filter((item) => item.count > 0 && ACTION_LABELS[item.event_type])
                    .map((item) => (
                      <div key={item.event_type} className="flex items-baseline justify-between gap-2 border-b border-border py-1">
                        <span className="text-xs text-muted-foreground">{ACTION_LABELS[item.event_type]}</span>
                        <span className="font-mono text-xs font-semibold">{item.count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mentor Request Section */}
      {isMentor && !isOwnProfile && (
        <Card>
          <CardContent className="p-4 space-y-3">
            {!isLoggedIn ? (
              <Button variant="outline" onClick={() => login(`/people/${params.id}`)}>
                Sign in to request an intro
              </Button>
            ) : hasPendingRequest ? (
              <p className="text-sm text-aurora-teal font-medium">Request Pending -- you've already requested an intro with this mentor.</p>
            ) : showMentorForm ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Request an intro with {profile.name}</h3>
                <Textarea
                  value={mentorMessage}
                  onChange={(e) => setMentorMessage(e.target.value)}
                  placeholder="Tell them what you'd like help with..."
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button onClick={() => mentorRequestMutation.mutate()} disabled={mentorRequestMutation.isPending}>
                    {mentorRequestMutation.isPending ? "Sending..." : "Send Request"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowMentorForm(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowMentorForm(true)}>Request Intro</Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
