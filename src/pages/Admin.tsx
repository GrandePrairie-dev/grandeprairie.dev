import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Lightbulb,
  Calendar,
  FolderOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Stats, Idea, Profile, Event, IntelPost, BusinessRequest } from "@/lib/types";
import { parseJsonArray } from "@/lib/types";

const TABS = [
  { value: "ideas", label: "Ideas" },
  { value: "profiles", label: "Profiles" },
  { value: "events", label: "Events" },
  { value: "intel", label: "Intel" },
  { value: "requests", label: "Requests" },
];

const STATUS_OPTIONS = ["reviewed", "matched", "in_progress", "completed"] as const;

export default function Admin() {
  const [tab, setTab] = useState("ideas");
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: ideas, isLoading: ideasLoading } = useQuery<Idea[]>({
    queryKey: ["/api/ideas"],
    enabled: tab === "ideas",
  });

  const { data: profiles, isLoading: profilesLoading } = useQuery<Profile[]>({
    queryKey: ["/api/profiles"],
    enabled: tab === "profiles",
  });

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events/upcoming"],
    enabled: tab === "events",
  });

  const { data: intel, isLoading: intelLoading } = useQuery<IntelPost[]>({
    queryKey: ["/api/intel"],
    enabled: tab === "intel",
  });

  const { data: requests, isLoading: requestsLoading } = useQuery<BusinessRequest[]>({
    queryKey: ["/api/business-requests"],
    enabled: tab === "requests",
  });

  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null);

  const statusMutation = useMutation({
    mutationFn: ({ id, status, matched_profile_id }: { id: number; status: string; matched_profile_id?: number }) =>
      apiRequest("PATCH", `/api/business-requests/${id}/status`, { status, matched_profile_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-requests"] });
      toast({ title: "Status updated" });
    },
  });

  const { data: expandedInterests, isLoading: interestsLoading } = useQuery<any[]>({
    queryKey: [`/api/business-requests/${expandedRequestId}/interests`],
    enabled: expandedRequestId !== null,
  });

  const toggleIdeaFeatured = useMutation({
    mutationFn: (args: { id: number; value: boolean }) =>
      apiRequest("PATCH", `/api/admin/ideas/${args.id}`, { is_featured: args.value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      toast({ title: "Idea updated" });
    },
  });

  const toggleIdeaStatus = useMutation({
    mutationFn: (args: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/ideas/${args.id}`, { status: args.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      toast({ title: "Idea status updated" });
    },
  });

  const toggleProfileFeatured = useMutation({
    mutationFn: (args: { id: number; value: boolean }) =>
      apiRequest("PATCH", `/api/admin/profiles/${args.id}`, { is_featured: args.value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({ title: "Profile updated" });
    },
  });

  const toggleProfileAdmin = useMutation({
    mutationFn: (args: { id: number; value: boolean }) =>
      apiRequest("PATCH", `/api/admin/profiles/${args.id}`, { is_admin: args.value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({ title: "Profile admin status updated" });
    },
  });

  const toggleIntelPinned = useMutation({
    mutationFn: (args: { id: number; value: boolean }) =>
      apiRequest("PATCH", `/api/admin/intel/${args.id}`, { is_pinned: args.value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intel"] });
      toast({ title: "Intel updated" });
    },
  });

  const toggleIntelFeatured = useMutation({
    mutationFn: (args: { id: number; value: boolean }) =>
      apiRequest("PATCH", `/api/admin/intel/${args.id}`, { is_featured: args.value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intel"] });
      toast({ title: "Intel updated" });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/admin/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/upcoming"] });
      toast({ title: "Event deleted" });
    },
  });

  const statCards = [
    { icon: Users, label: "Profiles", value: stats?.profiles ?? 0, color: "text-aurora-teal" },
    { icon: Lightbulb, label: "Ideas", value: stats?.ideas ?? 0, color: "text-prairie-amber" },
    { icon: Calendar, label: "Events", value: stats?.events ?? 0, color: "text-rig-amber" },
    { icon: FolderOpen, label: "Projects", value: stats?.projects ?? 0, color: "text-boreal-spruce-light" },
  ];

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-display font-bold mb-4">Admin</h1>
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <h1 className="text-xl font-display font-bold">Admin</h1>

      {/* Stats Row */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map(({ icon: Icon, label, value, color }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${color} shrink-0`} />
                <div>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab Strip */}
      <div className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <Button
            key={t.value}
            variant={tab === t.value ? "default" : "secondary"}
            size="sm"
            className="text-xs"
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-2">
        {/* Ideas Tab */}
        {tab === "ideas" && (
          ideasLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            (ideas ?? []).map((idea) => (
              <Card key={idea.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{idea.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {idea.category} &middot; {idea.votes} votes &middot; {idea.status}
                      </p>
                    </div>
                    <Badge variant={idea.is_featured ? "default" : "secondary"} className="text-[10px] shrink-0">
                      {idea.is_featured ? "Featured" : "Normal"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant={idea.is_featured ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      disabled={toggleIdeaFeatured.isPending}
                      onClick={() => toggleIdeaFeatured.mutate({ id: idea.id, value: !idea.is_featured })}
                    >
                      {idea.is_featured ? "Featured" : "Feature"}
                    </Button>
                    {["open", "closed"].map((status) => (
                      <Button
                        key={status}
                        variant={idea.status === status ? "default" : "outline"}
                        size="sm"
                        className="text-[10px] h-7 px-2 capitalize"
                        disabled={toggleIdeaStatus.isPending}
                        onClick={() => toggleIdeaStatus.mutate({ id: idea.id, status })}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )
        )}

        {/* Profiles Tab */}
        {tab === "profiles" && (
          profilesLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            (profiles ?? []).map((profile) => (
              <Card key={profile.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{profile.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {profile.role} &middot; {profile.username}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Badge variant={profile.is_featured ? "default" : "secondary"} className="text-[10px]">
                        {profile.is_featured ? "Featured" : "Normal"}
                      </Badge>
                      {!!profile.is_admin && (
                        <Badge variant="destructive" className="text-[10px]">Admin</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant={profile.is_featured ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      disabled={toggleProfileFeatured.isPending}
                      onClick={() => toggleProfileFeatured.mutate({ id: profile.id, value: !profile.is_featured })}
                    >
                      {profile.is_featured ? "Featured" : "Feature"}
                    </Button>
                    <Button
                      variant={profile.is_admin ? "destructive" : "outline"}
                      size="sm"
                      className="text-xs"
                      disabled={toggleProfileAdmin.isPending}
                      onClick={() => toggleProfileAdmin.mutate({ id: profile.id, value: !profile.is_admin })}
                    >
                      {profile.is_admin ? "Remove Admin" : "Make Admin"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )
        )}

        {/* Events Tab */}
        {tab === "events" && (
          eventsLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            (events ?? []).map((event) => (
              <Card key={event.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm">{event.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {event.category} &middot; {formatDate(event.start_time)}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-xs shrink-0"
                      disabled={deleteEvent.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete event "${event.title}"?`)) {
                          deleteEvent.mutate(event.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )
        )}

        {/* Intel Tab */}
        {tab === "intel" && (
          intelLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            (intel ?? []).map((post) => (
              <Card key={post.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{post.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {post.category} &middot; {formatDate(post.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!!post.is_pinned && (
                        <Badge variant="outline" className="text-[10px]">Pinned</Badge>
                      )}
                      <Badge variant={post.is_featured ? "default" : "secondary"} className="text-[10px]">
                        {post.is_featured ? "Featured" : "Normal"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant={post.is_pinned ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      disabled={toggleIntelPinned.isPending}
                      onClick={() => toggleIntelPinned.mutate({ id: post.id, value: !post.is_pinned })}
                    >
                      {post.is_pinned ? "Pinned" : "Pin"}
                    </Button>
                    <Button
                      variant={post.is_featured ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      disabled={toggleIntelFeatured.isPending}
                      onClick={() => toggleIntelFeatured.mutate({ id: post.id, value: !post.is_featured })}
                    >
                      {post.is_featured ? "Featured" : "Feature"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )
        )}

        {/* Requests Tab */}
        {tab === "requests" && (
          requestsLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            (requests ?? []).map((req) => (
              <Card key={req.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{req.business_name}</h3>
                        {(req as any).interest_count > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {(req as any).interest_count} interested
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {req.contact_name} &middot; {req.category} &middot; {formatDate(req.created_at)}
                        {req.matched_profile_id && (
                          <span className="text-aurora-teal"> &middot; Matched: #{req.matched_profile_id}</span>
                        )}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                      {req.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {STATUS_OPTIONS.filter(s => s !== "matched").map((status) => (
                      <Button
                        key={status}
                        variant={req.status === status ? "default" : "outline"}
                        size="sm"
                        className="text-[10px] h-6 px-2 capitalize"
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: req.id, status })}
                      >
                        {status.replace(/_/g, " ")}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] h-6 px-2 ml-auto"
                      onClick={() => setExpandedRequestId(expandedRequestId === req.id ? null : req.id)}
                    >
                      {expandedRequestId === req.id ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                      View Interests
                    </Button>
                  </div>

                  {/* Expanded Interests Section */}
                  {expandedRequestId === req.id && (
                    <div className="border-t border-border pt-2 mt-2 space-y-2">
                      {interestsLoading ? (
                        <Skeleton className="h-12 w-full" />
                      ) : (expandedInterests ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No interests yet.</p>
                      ) : (
                        (expandedInterests ?? []).map((interest: any) => {
                          const skills = parseJsonArray(interest.skills);
                          return (
                            <div key={interest.id} className="flex items-start justify-between gap-2 p-2 rounded bg-muted/50">
                              <div className="min-w-0 space-y-1">
                                <p className="text-sm font-medium">{interest.profile_name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{interest.role}</p>
                                {skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {skills.slice(0, 5).map((skill: string) => (
                                      <Badge key={skill} variant="outline" className="text-[10px]">{skill}</Badge>
                                    ))}
                                  </div>
                                )}
                                {interest.note && (
                                  <p className="text-xs text-muted-foreground italic">"{interest.note}"</p>
                                )}
                                <p className="text-[10px] text-muted-foreground/60">{formatDate(interest.created_at)}</p>
                              </div>
                              <Button
                                variant={req.matched_profile_id === interest.profile_id ? "default" : "outline"}
                                size="sm"
                                className="text-[10px] h-6 px-2 shrink-0"
                                disabled={statusMutation.isPending}
                                onClick={() => statusMutation.mutate({
                                  id: req.id,
                                  status: "matched",
                                  matched_profile_id: interest.profile_id,
                                })}
                              >
                                {req.matched_profile_id === interest.profile_id ? "Matched" : "Assign Match"}
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )
        )}
      </div>
    </div>
  );
}
