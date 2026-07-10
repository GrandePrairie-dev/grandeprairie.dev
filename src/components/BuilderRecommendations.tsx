import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import type { BuilderRecommendationRun } from "@/lib/types";

interface Props {
  requestId: number;
  matchedProfileId: number | null;
  isMatching: boolean;
  onMatch: (profileId: number, runId: string, rationale: string) => void;
}

export function BuilderRecommendations({ requestId, matchedProfileId, isMatching, onMatch }: Props) {
  const queryClient = useQueryClient();
  const queryKey = [`/api/business-requests/${requestId}/recommendations`];
  const { data: run, isLoading } = useQuery<BuilderRecommendationRun | null>({ queryKey });

  const generate = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/business-requests/${requestId}/recommendations`);
      return response.json() as Promise<BuilderRecommendationRun>;
    },
    onSuccess: (result) => queryClient.setQueryData(queryKey, result),
  });

  const dismiss = useMutation({
    mutationFn: (args: { runId: string; profileId: number }) =>
      apiRequest("POST", `/api/recommendations/${args.runId}/feedback`, {
        feedback_type: "dismissed",
        item_type: "profile",
        item_id: args.profileId,
      }),
  });

  if (isLoading) return <Skeleton className="h-20 w-full" />;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-aurora-teal" />
          <h4 className="text-xs font-semibold">Builder suggestions</h4>
          {run && <Badge variant="outline" className="text-[10px]">Rules {run.algorithm_version}</Badge>}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={run ? "Refresh builder suggestions" : "Generate builder suggestions"}
          disabled={generate.isPending}
          onClick={() => generate.mutate()}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${generate.isPending ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {!run ? (
        <Button type="button" variant="outline" size="sm" disabled={generate.isPending} onClick={() => generate.mutate()}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Generate suggestions
        </Button>
      ) : run.items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No eligible builder profiles found.</p>
      ) : (
        <div className="divide-y divide-border rounded border border-border">
          {run.items.map((candidate) => (
            <div key={candidate.profile_id} className="flex items-start gap-3 p-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-aurora-teal/10 font-mono text-xs font-bold text-aurora-teal">
                {candidate.score}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium">{candidate.name}</span>
                  <Badge variant="secondary" className="text-[10px] capitalize">{candidate.role}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{candidate.explanation}</p>
                {candidate.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-[10px]">{skill}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant={matchedProfileId === candidate.profile_id ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-[10px]"
                  disabled={isMatching}
                  onClick={() => onMatch(candidate.profile_id, run.id, candidate.explanation)}
                >
                  {matchedProfileId === candidate.profile_id ? "Matched" : "Match"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Mark suggestion as not suitable"
                  disabled={dismiss.isPending}
                  onClick={() => dismiss.mutate({ runId: run.id, profileId: candidate.profile_id })}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
