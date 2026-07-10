import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { CheckCircle2, CircleHelp, MessageSquare, Pin, Reply, Send, Sparkles, ThumbsUp, UserRoundSearch } from "lucide-react";
import { RoleFilter } from "@/components/RoleFilter";
import { ReportContentDialog } from "@/components/ReportContentDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import type { BoardPost } from "@/lib/types";
import { BOARD_CATEGORIES, BOARD_CATEGORY_LABELS } from "@/lib/types";

const filterOptions = Object.entries(BOARD_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const boardViews = [
  ["all", "All posts"],
  ["questions", "Questions"],
  ["unanswered", "Unanswered"],
  ["needs_mentor", "Needs mentor"],
] as const;

function invalidateBoardQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    predicate: (query) => String(query.queryKey[0]).startsWith("/api/board-posts"),
  });
}

function authorInitial(name: string | null | undefined) {
  return (name ?? "?").charAt(0).toUpperCase();
}

function categoryLabel(category: string) {
  return BOARD_CATEGORY_LABELS[category] ?? category.replace(/_/g, " ");
}

export default function Board() {
  const [category, setCategory] = useState("all");
  const [view, setView] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState<"discussion" | "question">("discussion");
  const [needsMentor, setNeedsMentor] = useState(false);
  const [postCategory, setPostCategory] = useState<(typeof BOARD_CATEGORIES)[number]>("general");
  const queryClient = useQueryClient();
  const { isLoggedIn, login } = useAuth();
  const { toast } = useToast();
  const queryParams = new URLSearchParams();
  if (category !== "all") queryParams.set("category", category);
  if (view !== "all") queryParams.set("view", view);
  const queryKey = `/api/board-posts${queryParams.size > 0 ? `?${queryParams.toString()}` : ""}`;

  const { data: posts, isLoading } = useQuery<BoardPost[]>({ queryKey: [queryKey] });

  const createThread = useMutation({
    mutationFn: () => apiRequest("POST", "/api/board-posts", {
      title,
      body,
      category: postCategory,
      post_type: postType,
      needs_mentor: postType === "question" && needsMentor,
    }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      setPostCategory("general");
      setPostType("discussion");
      setNeedsMentor(false);
      invalidateBoardQueries(queryClient);
      toast({ title: "Thread posted" });
    },
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="relative overflow-hidden rounded-lg border border-border bg-card/70 p-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-aurora-teal via-prairie-amber to-rig-amber" />
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded bg-aurora-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-aurora-teal">
              <MessageSquare className="h-3.5 w-3.5" />
              Message Board
            </div>
            <h1 className="text-2xl font-display font-[800] uppercase">Ask, Share, Coordinate</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A public board for Grande Prairie builders to ask for help, share openings, coordinate events, and post field notes.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md border border-border bg-background/60 p-3">
              <p className="text-lg font-bold text-aurora-teal">{posts?.length ?? 0}</p>
              <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground">threads</p>
            </div>
            <div className="rounded-md border border-border bg-background/60 p-3">
              <p className="text-lg font-bold text-prairie-amber">
                {(posts ?? []).reduce((count, post) => count + (post.reply_count ?? 0), 0)}
              </p>
              <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground">replies</p>
            </div>
            <div className="rounded-md border border-border bg-background/60 p-3">
              <p className="text-lg font-bold text-rig-amber">{BOARD_CATEGORIES.length}</p>
              <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground">channels</p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {isLoggedIn ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                createThread.mutate();
              }}
              className="space-y-3"
            >
              <div className="inline-flex rounded-md border border-border bg-background p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={postType === "discussion" ? "default" : "ghost"}
                  className="h-8"
                  onClick={() => {
                    setPostType("discussion");
                    setNeedsMentor(false);
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Discussion
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={postType === "question" ? "default" : "ghost"}
                  className="h-8"
                  onClick={() => setPostType("question")}
                >
                  <CircleHelp className="h-3.5 w-3.5" />
                  Question
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Thread title"
                  maxLength={140}
                  required
                />
                <Select value={postCategory} onValueChange={(value) => setPostCategory(value as typeof postCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOARD_CATEGORIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {categoryLabel(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Ask a question, share an update, or coordinate something local..."
                maxLength={3000}
                required
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {postType === "question" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant={needsMentor ? "secondary" : "ghost"}
                    className="justify-start"
                    onClick={() => setNeedsMentor((value) => !value)}
                  >
                    <UserRoundSearch className="h-3.5 w-3.5" />
                    {needsMentor ? "Mentor requested" : "Needs a mentor"}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Keep it practical, local, and useful for people building in the Peace Region.
                  </p>
                )}
                <Button type="submit" disabled={createThread.isPending || title.trim().length < 3 || !body.trim()}>
                  <Send className="h-4 w-4" />
                  {createThread.isPending ? "Posting..." : "Post Thread"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold">Sign in to post</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Anyone can read the board. Signed-in members can start threads and reply.
                </p>
              </div>
              <Button onClick={() => login("/board")}>Sign in</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <RoleFilter options={filterOptions} value={category} onChange={setCategory} />
        <p className="text-xs text-muted-foreground">
          {category === "all" ? "Showing all channels" : `Showing ${categoryLabel(category)}`}
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        {boardViews.map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={view === value ? "default" : "secondary"}
            className="text-xs"
            onClick={() => setView(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-32 w-full" />
          ))}
        </div>
      ) : (posts ?? []).length === 0 ? (
        <Card className="border-dashed border-aurora-teal/40 bg-aurora-teal/5">
          <CardContent className="p-8 text-center">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-aurora-teal" />
            <h2 className="font-semibold">No threads yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Start with a field question, a tool you need, a job lead, or a project update from around Grande Prairie.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(posts ?? []).map((post) => (
            <BoardThread key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function BoardThread({ post }: { post: BoardPost }) {
  const [expanded, setExpanded] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const queryClient = useQueryClient();
  const { user, isLoggedIn, isAdmin, login } = useAuth();
  const { toast } = useToast();

  const { data: replies, isLoading } = useQuery<BoardPost[]>({
    queryKey: [`/api/board-posts?parent_id=${post.id}`],
    enabled: expanded,
  });

  const createReply = useMutation({
    mutationFn: () => apiRequest("POST", "/api/board-posts", {
      parent_id: post.id,
      body: replyBody,
    }),
    onSuccess: () => {
      setReplyBody("");
      setExpanded(true);
      invalidateBoardQueries(queryClient);
      toast({ title: "Reply posted" });
    },
  });

  const helpfulMutation = useMutation({
    mutationFn: ({ replyId, helpful }: { replyId: number; helpful: boolean }) =>
      apiRequest(helpful ? "DELETE" : "POST", `/api/board-posts/${replyId}/helpful`),
    onSuccess: () => invalidateBoardQueries(queryClient),
  });

  const acceptMutation = useMutation({
    mutationFn: (replyId: number) => apiRequest("PATCH", `/api/board-posts/${replyId}/accept`),
    onSuccess: () => {
      invalidateBoardQueries(queryClient);
      toast({ title: "Answer accepted" });
    },
  });

  return (
    <Card className={post.is_pinned ? "border-l-2 border-l-prairie-amber" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-boreal-spruce text-sm font-bold text-aurora-teal">
            {post.author_avatar_url ? (
              <img src={post.author_avatar_url} alt="" className="h-full w-full rounded-md object-cover" />
            ) : (
              authorInitial(post.author_name)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {categoryLabel(post.category)}
              </Badge>
              {post.post_type === "question" && (
                <Badge variant="secondary" className="text-[10px]">
                  <CircleHelp className="mr-1 h-3 w-3" />
                  Question
                </Badge>
              )}
              {post.needs_mentor > 0 && !post.accepted_reply_id && (
                <Badge variant="outline" className="text-[10px] text-prairie-amber">
                  <UserRoundSearch className="mr-1 h-3 w-3" />
                  Needs mentor
                </Badge>
              )}
              {post.accepted_reply_id && (
                <Badge variant="outline" className="text-[10px] text-aurora-teal">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Answered
                </Badge>
              )}
              {post.is_pinned ? (
                <Badge variant="secondary" className="text-[10px]">
                  <Pin className="mr-1 h-3 w-3" />
                  Pinned
                </Badge>
              ) : null}
              <span className="text-[10px] text-muted-foreground">{formatDate(post.created_at)}</span>
            </div>
            <h2 className="text-base font-semibold">{post.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{post.body}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                {post.author_name ? (
                  <Link href={`/people/${post.author_id}`}>
                    <span className="cursor-pointer font-medium text-foreground hover:text-aurora-teal">
                      {post.author_name}
                    </span>
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">Deleted user</span>
                )}
                {post.author_role ? ` · ${post.author_role}` : ""}
              </span>
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="inline-flex items-center gap-1 text-aurora-teal hover:text-aurora-teal/80"
              >
                <Reply className="h-3.5 w-3.5" />
                {expanded ? "Hide replies" : `${post.reply_count ?? 0} replies`}
              </button>
              <ReportContentDialog targetType="board_post" targetId={post.id} />
            </div>
          </div>
        </div>

        {expanded ? (
          <div className="mt-4 border-t border-border pt-4">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((item) => (
                  <Skeleton key={item} className="h-16 w-full" />
                ))}
              </div>
            ) : (replies ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No replies yet.</p>
            ) : (
              <div className="space-y-3">
                {(replies ?? []).map((reply) => {
                  const accepted = post.accepted_reply_id === reply.id;
                  const canAccept = post.post_type === "question" && (post.author_id === user?.id || isAdmin);
                  return (
                  <div key={reply.id} className={`rounded-md border bg-background/50 p-3 ${accepted ? "border-aurora-teal/70" : "border-border"}`}>
                    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{reply.author_name ?? "Deleted user"}</span>
                      <span>{formatDate(reply.created_at)}</span>
                      {accepted && <Badge className="text-[10px]">Accepted answer</Badge>}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{reply.body}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={reply.viewer_found_helpful ? "secondary" : "ghost"}
                        className="h-7 text-xs"
                        disabled={helpfulMutation.isPending || reply.author_id === user?.id}
                        title={reply.author_id === user?.id ? "You cannot mark your own reply helpful" : "Mark this answer helpful"}
                        onClick={() => {
                          if (!isLoggedIn) return login("/board");
                          helpfulMutation.mutate({ replyId: reply.id, helpful: Boolean(reply.viewer_found_helpful) });
                        }}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        Helpful {reply.helpful_count > 0 ? reply.helpful_count : ""}
                      </Button>
                      {canAccept && !accepted && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={acceptMutation.isPending}
                          onClick={() => acceptMutation.mutate(reply.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Accept answer
                        </Button>
                      )}
                      <ReportContentDialog targetType="board_post" targetId={reply.id} />
                    </div>
                  </div>
                );})}
              </div>
            )}

            {isLoggedIn ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  createReply.mutate();
                }}
                className="mt-4 space-y-2"
              >
                <Textarea
                  value={replyBody}
                  onChange={(event) => setReplyBody(event.target.value)}
                  placeholder="Write a reply..."
                  maxLength={3000}
                  required
                />
                <Button type="submit" size="sm" disabled={createReply.isPending || !replyBody.trim()}>
                  <Send className="h-4 w-4" />
                  {createReply.isPending ? "Posting..." : "Reply"}
                </Button>
              </form>
            ) : (
              <div className="mt-4 flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">Sign in to reply to this thread.</p>
                <Button size="sm" onClick={() => login("/board")}>Sign in</Button>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
