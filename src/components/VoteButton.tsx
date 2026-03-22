import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface VoteButtonProps {
  ideaId: number;
  votes: number;
}

export function VoteButton({ ideaId, votes }: VoteButtonProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/ideas/${ideaId}/vote`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas/featured"] });
      queryClient.invalidateQueries({ queryKey: [`/api/ideas/${ideaId}`] });
    },
  });

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); mutation.mutate(); }}
      className="flex flex-col items-center gap-0.5 text-prairie-amber hover:text-prairie-amber/80 transition-colors shrink-0"
      disabled={mutation.isPending}
    >
      <span className="text-sm">▲</span>
      <span className="text-sm font-bold">{votes + (mutation.isSuccess ? 1 : 0)}</span>
    </button>
  );
}
