import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface VoteButtonProps {
  ideaId: number;
  votes: number;
}

export function VoteButton({ ideaId, votes }: VoteButtonProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const { isLoggedIn, login } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ideas/${ideaId}/vote`, { method: "POST" });
      if (res.status === 409) {
        setHasVoted(true);
        throw new Error("Already voted");
      }
      if (!res.ok) throw new Error(`Vote failed: ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      setHasVoted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/featured"] });
      queryClient.invalidateQueries({ queryKey: [`/api/ideas/${ideaId}`] });
    },
  });

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      login(window.location.pathname);
      return;
    }
    if (!hasVoted) mutation.mutate();
  }, [hasVoted, isLoggedIn, login, mutation]);

  return (
    <button
      onClick={handleClick}
      className={`flex flex-col items-center gap-0.5 transition-colors shrink-0 ${
        hasVoted
          ? "text-prairie-amber cursor-default"
          : "text-prairie-amber/60 hover:text-prairie-amber"
      }`}
      disabled={mutation.isPending || hasVoted}
      title={hasVoted ? "You've voted on this idea" : isLoggedIn ? "Upvote this idea" : "Sign in to vote"}
    >
      <span className="text-sm">{hasVoted ? "▲" : "△"}</span>
      <span className="text-sm font-bold">{votes + (hasVoted && mutation.isSuccess ? 1 : 0)}</span>
    </button>
  );
}
