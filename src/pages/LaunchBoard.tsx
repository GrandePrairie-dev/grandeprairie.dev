import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { parseJsonArray, type LaunchCycle, type LaunchEntry } from "@/lib/types";
import { ExternalLink, Github, Plus, Rocket, ThumbsUp, Trophy, X } from "lucide-react";

const EMPTY_FORM = {
  title: "",
  description: "",
  pitch: "",
  category: "",
  demo_url: "",
  repo_url: "",
  tags: "",
};

function LaunchCard({ entry, isOpen }: { entry: LaunchEntry; isOpen: boolean }) {
  const { user, isLoggedIn, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isOwn = user?.id === entry.author_id;
  const supportMutation = useMutation({
    mutationFn: () =>
      apiRequest(
        entry.viewer_voted ? "DELETE" : "POST",
        `/api/launches/entries/${entry.id}/vote`,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/launches/current"] }),
    onError: () => toast({ title: "Could not update support", variant: "destructive" }),
  });

  const support = () => {
    if (!isLoggedIn) {
      login("/launches");
      return;
    }
    supportMutation.mutate();
  };

  const tags = parseJsonArray(entry.tags);
  return (
    <article className="border-b border-border py-5 first:pt-0 last:border-0 last:pb-0">
      <div className="grid grid-cols-[36px_minmax(0,1fr)] items-start gap-4 sm:grid-cols-[36px_minmax(0,1fr)_auto]">
        <div className="w-9 shrink-0 text-center">
          {entry.rank === 1 ? (
            <Trophy className="mx-auto h-5 w-5 text-prairie-amber" aria-label="Current leader" />
          ) : (
            <span className="font-mono text-sm text-muted-foreground">#{entry.rank}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base font-semibold">{entry.title}</h2>
            {entry.category && <Badge variant="secondary">{entry.category}</Badge>}
          </div>
          <p className="mt-1 text-sm font-medium text-foreground/90">{entry.pitch}</p>
          {entry.description && (
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              {entry.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
            {entry.author_id && (
              <Link href={`/people/${entry.author_id}`}>
                <span className="cursor-pointer hover:text-foreground">
                  By {entry.author_name ?? "Community member"}
                </span>
              </Link>
            )}
            {entry.demo_url && (
              <a className="inline-flex items-center gap-1 hover:text-foreground" href={entry.demo_url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3 w-3" /> Live demo
              </a>
            )}
            {entry.repo_url && (
              <a className="inline-flex items-center gap-1 hover:text-foreground" href={entry.repo_url} target="_blank" rel="noreferrer">
                <Github className="h-3 w-3" /> Source
              </a>
            )}
          </div>
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant={entry.viewer_voted ? "secondary" : "outline"}
          size="sm"
          className="col-start-2 min-w-[74px] justify-self-start sm:col-start-3 sm:row-start-1"
          onClick={support}
          disabled={!isOpen || isOwn || supportMutation.isPending}
          title={isOwn ? "You cannot support your own launch" : "Support this launch"}
        >
          <ThumbsUp className="h-4 w-4" />
          {entry.votes_count}
        </Button>
      </div>
    </article>
  );
}

export default function LaunchBoard() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const { isLoggedIn, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: cycle, isLoading } = useQuery<LaunchCycle>({
    queryKey: ["/api/launches/current"],
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/launches/current", {
        ...form,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/launches/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Launch submitted" });
    },
    onError: () => toast({ title: "Could not submit launch", variant: "destructive" }),
  });

  const openForm = () => {
    if (!isLoggedIn) {
      login("/launches");
      return;
    }
    setShowForm(true);
  };

  const update = (key: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <div className="max-w-4xl space-y-6 p-4 md:p-6">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Community launches</p>
          <h1 className="font-display text-2xl font-bold">{cycle?.title ?? "Launch Board"}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            New work shipped by Peace Region builders. Rankings use community support, with earlier submissions breaking ties.
          </p>
        </div>
        <Button onClick={openForm} disabled={cycle ? !cycle.is_open : false}>
          <Plus className="h-4 w-4" /> Submit launch
        </Button>
      </header>

      {showForm && (
        <section className="border-b border-border pb-6" aria-label="Submit a launch">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Ship something new</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} title="Close form">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={form.title} onChange={update("title")} placeholder="Project name" maxLength={120} />
            <Input value={form.category} onChange={update("category")} placeholder="Category" maxLength={60} />
            <Textarea className="sm:col-span-2" value={form.pitch} onChange={update("pitch")} placeholder="What did you ship this month?" maxLength={280} />
            <Textarea className="sm:col-span-2" value={form.description} onChange={update("description")} placeholder="What does it do, and who is it for?" maxLength={1200} />
            <Input value={form.demo_url} onChange={update("demo_url")} placeholder="https://live-demo.example" />
            <Input value={form.repo_url} onChange={update("repo_url")} placeholder="https://github.com/..." />
            <Input className="sm:col-span-2" value={form.tags} onChange={update("tags")} placeholder="Tags, separated by commas" />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || !form.title.trim() || !form.description.trim() || !form.pitch.trim()}
            >
              <Rocket className="h-4 w-4" />
              {submitMutation.isPending ? "Submitting..." : "Publish launch"}
            </Button>
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => <Skeleton key={item} className="h-32 w-full" />)}
        </div>
      ) : cycle?.entries.length ? (
        <section aria-label="Launch rankings">
          {cycle.entries.map((entry) => <LaunchCard key={entry.id} entry={entry} isOpen={cycle.is_open} />)}
        </section>
      ) : (
        <div className="py-14 text-center text-muted-foreground">
          <Rocket className="mx-auto mb-3 h-10 w-10 opacity-50" />
          <p className="font-semibold text-foreground">The board is open</p>
          <p className="mt-1 text-sm">Be the first local builder to ship this month.</p>
        </div>
      )}
    </div>
  );
}
