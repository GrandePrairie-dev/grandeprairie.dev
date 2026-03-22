import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { VoteButton } from "@/components/VoteButton";
import { CommentThread } from "@/components/CommentThread";
import { ArrowLeft } from "lucide-react";
import type { Idea, Profile } from "@/lib/types";
import { parseJsonArray, IDEA_CATEGORY_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function IdeaDetail() {
  const params = useParams<{ id: string }>();
  const { data: idea, isLoading } = useQuery<Idea>({ queryKey: [`/api/ideas/${params.id}`] });
  const { data: profiles } = useQuery<Profile[]>({ queryKey: ["/api/profiles"] });

  if (isLoading) {
    return <div className="p-4 md:p-6 max-w-3xl space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /></div>;
  }

  if (!idea) {
    return <div className="p-4 md:p-6 max-w-3xl"><p className="text-muted-foreground">Idea not found.</p></div>;
  }

  const tags = parseJsonArray(idea.tags);
  const author = profiles?.find(p => p.id === idea.author_id);
  const categoryLabel = IDEA_CATEGORY_LABELS[idea.category ?? ""] ?? idea.category;

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      <Link href="/ideas">
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Ideas
        </span>
      </Link>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-display font-bold">{idea.title}</h1>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                {author && <span>By {author.name}</span>}
                <span>·</span>
                <span>{formatDate(idea.created_at)}</span>
                {idea.category && <Badge variant="secondary" className="text-[10px]">{categoryLabel}</Badge>}
              </div>
            </div>
            <VoteButton ideaId={idea.id} votes={idea.votes} />
          </div>

          {idea.description && (
            <p className="text-sm leading-relaxed">{idea.description}</p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CommentThread ideaId={idea.id} />
    </div>
  );
}
