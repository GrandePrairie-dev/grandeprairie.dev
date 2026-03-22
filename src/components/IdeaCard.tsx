import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VoteButton } from "@/components/VoteButton";
import type { Idea } from "@/lib/types";
import { parseJsonArray, IDEA_CATEGORY_LABELS } from "@/lib/types";

interface IdeaCardProps {
  idea: Idea;
  featured?: boolean;
}

export function IdeaCard({ idea, featured }: IdeaCardProps) {
  const tags = parseJsonArray(idea.tags);
  const categoryLabel = IDEA_CATEGORY_LABELS[idea.category ?? ""] ?? idea.category;

  const content = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-sm">{idea.title}</h3>
        {featured && idea.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{idea.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-1 mt-2">
          {idea.category && <Badge variant="secondary" className="text-[10px]">{categoryLabel}</Badge>}
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
          ))}
        </div>
      </div>
      <VoteButton ideaId={idea.id} votes={idea.votes} />
    </div>
  );

  if (featured) {
    return (
      <Link href={`/ideas/${idea.id}`}>
        <Card className="cursor-pointer hover:border-boreal-spruce-light/50 transition-colors border-l-2 border-l-aurora-teal">
          <CardContent className="p-4">{content}</CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/ideas/${idea.id}`}>
      <div className="p-4 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors">
        {content}
      </div>
    </Link>
  );
}
