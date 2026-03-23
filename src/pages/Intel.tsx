import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RoleFilter } from "@/components/RoleFilter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Pin, ExternalLink, Bot } from "lucide-react";
import type { IntelPost } from "@/lib/types";
import { parseJsonArray, INTEL_CATEGORY_LABELS } from "@/lib/types";

const filterOptions = Object.entries(INTEL_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

interface IntelCardProps {
  post: IntelPost;
}

function AutoBadge({ sourceFeed }: { sourceFeed: string | null }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
      <Bot className="w-3 h-3 shrink-0" />
      via {sourceFeed ?? "pipeline"}
    </span>
  );
}

function IntelCard({ post }: IntelCardProps) {
  const tags = parseJsonArray(post.tags);
  const categoryLabel = INTEL_CATEGORY_LABELS[post.category ?? ""] ?? post.category;
  const isPinned = !!post.is_pinned;
  const isFeatured = !!post.is_featured;
  const isAutomated = !!post.is_automated;

  const meta = (
    <div className="flex flex-wrap items-center gap-1 mt-2">
      {post.category && (
        <Badge variant="secondary" className="text-[10px]">
          {categoryLabel}
        </Badge>
      )}
      {tags.map((tag) => (
        <Badge key={tag} variant="outline" className="text-[10px]">
          {tag}
        </Badge>
      ))}
      <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(post.created_at)}</span>
    </div>
  );

  // Non-featured: divider row
  if (!isPinned && !isFeatured) {
    return (
      <div className="p-4 border-b border-border hover:bg-muted/30 transition-colors">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm">{post.title}</h3>
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {post.category && (
                <Badge variant="secondary" className="text-[10px]">
                  {categoryLabel}
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground">{formatDate(post.created_at)}</span>
            </div>
            {isAutomated && <AutoBadge sourceFeed={post.source_feed} />}
          </div>
        </div>
      </div>
    );
  }

  // Pinned: dashed border Card
  if (isPinned) {
    return (
      <Card className="mb-2 border-dashed hover:border-boreal-spruce-light/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Pin className="w-3.5 h-3.5 mt-0.5 text-prairie-amber shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm">{post.title}</h3>
              {post.body && (
                <p className="text-xs text-muted-foreground line-clamp-3 mt-1">{post.body}</p>
              )}
              {post.source_url && (
                <a
                  href={post.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  via {post.source_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
              {meta}
              {isAutomated && <AutoBadge sourceFeed={post.source_feed} />}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Featured (not pinned): bordered Card
  return (
    <Card className="mb-2 border-l-2 border-l-aurora-teal hover:border-boreal-spruce-light/50 transition-colors">
      <CardContent className="p-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm">{post.title}</h3>
          {post.body && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{post.body}</p>
          )}
          {post.source_url && (
            <a
              href={post.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              via {post.source_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          )}
          {meta}
          {isAutomated && <AutoBadge sourceFeed={post.source_feed} />}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Intel() {
  const [category, setCategory] = useState("all");

  const { data: posts, isLoading } = useQuery<IntelPost[]>({ queryKey: ["/api/intel"] });

  const filtered = (posts ?? []).filter(
    (p) => category === "all" || p.category === category
  );

  const sorted = [...filtered].sort((a, b) => {
    if (b.is_pinned !== a.is_pinned) return b.is_pinned - a.is_pinned;
    if (b.is_featured !== a.is_featured) return b.is_featured - a.is_featured;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold">Intel Feed</h1>
      </div>

      <RoleFilter options={filterOptions} value={category} onChange={setCategory} />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Newspaper className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-semibold mb-1">No intel posts</p>
          <p className="text-sm">Check back for community updates.</p>
        </div>
      ) : (
        <div>
          {sorted.map((post) => (
            <IntelCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
