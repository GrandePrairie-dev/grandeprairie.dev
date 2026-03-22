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
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Stats, Idea, Profile, Event, IntelPost, BusinessRequest } from "@/lib/types";

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

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/business-requests/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-requests"] });
    },
  });

  const statCards = [
    { icon: Users, label: "Profiles", value: stats?.profiles ?? 0, color: "text-aurora-teal" },
    { icon: Lightbulb, label: "Ideas", value: stats?.ideas ?? 0, color: "text-prairie-amber" },
    { icon: Calendar, label: "Events", value: stats?.events ?? 0, color: "text-rig-amber" },
    { icon: FolderOpen, label: "Projects", value: stats?.projects ?? 0, color: "text-boreal-spruce-light" },
  ];

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
                <CardContent className="p-3">
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
                <CardContent className="p-3">
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
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm">{event.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {event.category} &middot; {formatDate(event.start_time)}
                  </p>
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
                <CardContent className="p-3">
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
                      <h3 className="font-semibold text-sm truncate">{req.business_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {req.contact_name} &middot; {req.category} &middot; {formatDate(req.created_at)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                      {req.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {STATUS_OPTIONS.map((status) => (
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
                  </div>
                </CardContent>
              </Card>
            ))
          )
        )}
      </div>
    </div>
  );
}
