import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import type { Comment } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface CommentThreadProps {
  ideaId: number;
}

export function CommentThread({ ideaId }: CommentThreadProps) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/comments?idea_id=${ideaId}`],
  });

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/comments", { content, idea_id: ideaId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comments?idea_id=${ideaId}`] });
      setContent("");
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Comments</h3>
      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (comments ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts.</p>
      ) : (
        <div className="space-y-3">
          {(comments ?? []).map((comment) => (
            <div key={comment.id} className="border-b border-border pb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">{comment.author_name ?? "Anonymous"}</span>
                <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); if (content.trim()) mutation.mutate(); }} className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[60px]"
        />
        <Button type="submit" size="sm" disabled={mutation.isPending || !content.trim()}>
          {mutation.isPending ? "Posting..." : "Post Comment"}
        </Button>
      </form>
    </div>
  );
}
