import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Mail, Pause, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { parseJsonArray } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface DigestSubscription {
  email: string;
  frequency: "weekly" | "paused";
  topics: string;
  status: "active" | "unsubscribed";
}

const TOPICS = [
  ["events", "Events"],
  ["board", "Board discussions"],
  ["projects", "Projects"],
  ["intel", "Regional intel"],
] as const;

export default function DigestPreferences() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") ?? "", []);
  const confirmed = useMemo(() => new URLSearchParams(window.location.search).get("confirmed") === "1", []);
  const [topics, setTopics] = useState<string[]>([]);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const { toast } = useToast();
  const endpoint = `/api/digest/subscriptions?token=${encodeURIComponent(token)}`;
  const { data, isLoading, isError, refetch } = useQuery<DigestSubscription>({
    queryKey: [endpoint],
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (data) setTopics(parseJsonArray(data.topics));
  }, [data]);

  const update = useMutation({
    mutationFn: (frequency: "weekly" | "paused") => apiRequest("PATCH", "/api/digest/subscriptions", {
      token,
      topics,
      frequency,
    }),
    onSuccess: (_, frequency) => {
      refetch();
      toast({ title: frequency === "paused" ? "Digest paused" : "Preferences saved" });
    },
  });

  const unsubscribe = useMutation({
    mutationFn: () => apiRequest("DELETE", endpoint),
    onSuccess: () => setUnsubscribed(true),
  });

  if (!token || isError) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-display font-bold">Digest preferences</h1>
        <p className="mt-3 text-sm text-muted-foreground">This preference link is missing or no longer valid.</p>
      </div>
    );
  }

  if (unsubscribed || data?.status === "unsubscribed") {
    return (
      <div className="mx-auto max-w-xl p-6 text-center">
        <Check className="mx-auto h-10 w-10 text-aurora-teal" />
        <h1 className="mt-4 text-xl font-display font-bold">Unsubscribed</h1>
        <p className="mt-2 text-sm text-muted-foreground">You will no longer receive the GP.dev weekly digest.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-4 md:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-boreal-spruce text-aurora-teal">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Digest preferences</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose what appears in your weekly GP.dev update.</p>
        </div>
      </div>

      {confirmed && (
        <div className="mb-4 flex items-center gap-2 border-y border-aurora-teal/30 bg-aurora-teal/5 px-3 py-3 text-sm text-aurora-teal">
          <Check className="h-4 w-4 shrink-0" />
          Subscription confirmed.
        </div>
      )}

      {isLoading ? <Skeleton className="h-64 w-full" /> : (
        <Card>
          <CardContent className="space-y-5 p-5">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Delivering to</p>
              <p className="mt-1 text-sm font-medium break-all">{data?.email}</p>
            </div>
            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-semibold">Topics</legend>
              {TOPICS.map(([value, label]) => (
                <label key={value} className="flex min-h-11 items-center gap-3 border-b border-border py-2 text-sm last:border-0">
                  <input
                    type="checkbox"
                    checked={topics.includes(value)}
                    onChange={(event) => setTopics((current) => event.target.checked
                      ? [...current, value]
                      : current.filter((item) => item !== value))}
                    className="h-4 w-4 accent-aurora-teal"
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <div className="flex flex-wrap gap-2">
              <Button disabled={topics.length === 0 || update.isPending} onClick={() => update.mutate("weekly")}>
                Save Preferences
              </Button>
              <Button variant="outline" disabled={update.isPending} onClick={() => update.mutate("paused")}>
                <Pause className="h-4 w-4" /> Pause
              </Button>
              <Button variant="ghost" className="text-destructive" disabled={unsubscribe.isPending} onClick={() => unsubscribe.mutate()}>
                <Trash2 className="h-4 w-4" /> Unsubscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
