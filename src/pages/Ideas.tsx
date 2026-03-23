import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RoleFilter } from "@/components/RoleFilter";
import { IdeaCard } from "@/components/IdeaCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Idea } from "@/lib/types";
import { IDEA_CATEGORY_LABELS, IDEA_CATEGORIES } from "@/lib/types";

const filterOptions = Object.entries(IDEA_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

export default function Ideas() {
  const [category, setCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ideaCategory, setIdeaCategory] = useState("");
  const [tags, setTags] = useState("");
  const { toast } = useToast();
  const { isLoggedIn, login } = useAuth();
  const queryClient = useQueryClient();

  const { data: ideas, isLoading } = useQuery<Idea[]>({ queryKey: ["/api/ideas"] });

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ideas", {
      title,
      description,
      category: ideaCategory,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      setDialogOpen(false);
      setTitle(""); setDescription(""); setIdeaCategory(""); setTags("");
      toast({ title: "Idea submitted!" });
    },
  });

  const filtered = (ideas ?? []).filter(
    (idea) => category === "all" || idea.category === category
  );
  const sorted = [...filtered].sort((a, b) => b.is_featured - a.is_featured || b.votes - a.votes);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold">Ideas</h1>
        {isLoggedIn ? (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Submit Idea</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit an Idea</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-3">
                <Input placeholder="Idea title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <Textarea placeholder="Describe the idea..." value={description} onChange={(e) => setDescription(e.target.value)} />
                <Select value={ideaCategory} onValueChange={setIdeaCategory}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {IDEA_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
                <Button type="submit" disabled={mutation.isPending || !title}>
                  {mutation.isPending ? "Submitting..." : "Submit Idea"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <Button size="sm" onClick={() => login("/ideas")}>Submit Idea</Button>
        )}
      </div>

      <RoleFilter options={filterOptions} value={category} onChange={setCategory} />

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Lightbulb className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-semibold mb-1">No ideas yet</p>
          <p className="text-sm">Be the first to submit one.</p>
        </div>
      ) : (
        <div>
          {sorted.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} featured={!!idea.is_featured} />
          ))}
        </div>
      )}
    </div>
  );
}
