import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface VoteButtonProps {
  ideaId: number;
  votes: number;
}

// Track voted ideas in session to prevent spam
const votedIdeas = new Set<number>();

export function VoteButton({ ideaId, votes }: VoteButtonProps) {
  const [hasVoted, setHasVoted] = useState(() => votedIdeas.has(ideaId));
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/ideas/${ideaId}/vote`),
    onSuccess: () => {
      votedIdeas.add(ideaId);
      setHasVoted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/featured"] });
      queryClient.invalidateQueries({ queryKey: [`/api/ideas/${ideaId}`] });
    },
  });

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasVoted) mutation.mutate();
  }, [hasVoted, mutation]);

  return (
    <button
      onClick={handleClick}
      className={`flex flex-col items-center gap-0.5 transition-colors shrink-0 ${
        hasVoted
          ? "text-prairie-amber cursor-default"
          : "text-prairie-amber/60 hover:text-prairie-amber"
      }`}
      disabled={mutation.isPending || hasVoted}
      title={hasVoted ? "You've voted on this idea" : "Upvote this idea"}
    >
      <span className="text-sm">{hasVoted ? "▲" : "△"}</span>
      <span className="text-sm font-bold">{votes + (hasVoted && mutation.isSuccess ? 1 : 0)}</span>
    </button>
  );
}
