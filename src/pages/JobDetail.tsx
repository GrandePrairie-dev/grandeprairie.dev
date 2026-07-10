import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EMPLOYMENT_LABELS, WORKPLACE_LABELS, formatCompensation } from "@/lib/jobs";
import { parseJsonArray, type Job } from "@/lib/types";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";

export default function JobDetail() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: job, isLoading } = useQuery<Job>({ queryKey: [`/api/jobs/${params.id}`] });
  const statusMutation = useMutation({
    mutationFn: (status: "published" | "closed") => apiRequest("PATCH", `/api/jobs/${params.id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${params.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
    onError: () => toast({ title: "Could not update listing", variant: "destructive" }),
  });

  if (isLoading) return <div className="max-w-3xl space-y-4 p-4 md:p-6"><Skeleton className="h-8 w-40" /><Skeleton className="h-64 w-full" /></div>;
  if (!job) return <div className="p-4 md:p-6">Job not found.</div>;
  const compensation = formatCompensation(job);

  return (
    <div className="max-w-3xl space-y-6 p-4 md:p-6">
      <Link href="/jobs"><span className="inline-flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft /> Back to jobs</span></Link>
      <header className="border-b border-border pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{EMPLOYMENT_LABELS[job.employment_type]}</Badge>
          <Badge variant="outline">{WORKPLACE_LABELS[job.workplace_type]}</Badge>
          {job.status === "closed" && <Badge variant="destructive">Closed</Badge>}
          {job.source === "careerlynx" && <Badge variant="outline">CareerLynx</Badge>}
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold">{job.title}</h1>
        <p className="mt-1 text-base font-medium">{job.organization}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {job.location && <span className="inline-flex items-center gap-1"><MapPin /> {job.location}</span>}
          {compensation && <span className="font-medium text-prairie-amber">{compensation}</span>}
        </div>
      </header>
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Opportunity</h2>
        <p className="whitespace-pre-wrap text-sm leading-7">{job.description}</p>
      </section>
      {parseJsonArray(job.tags).length > 0 && (
        <div className="flex flex-wrap gap-1.5">{parseJsonArray(job.tags).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        {job.status === "published" && (
          <Button asChild><a href={job.application_url} target="_blank" rel="noreferrer">Apply <ExternalLink /></a></Button>
        )}
        {job.viewer_can_manage === 1 && (
          <Button
            variant="outline"
            onClick={() => statusMutation.mutate(job.status === "published" ? "closed" : "published")}
            disabled={statusMutation.isPending}
          >
            {job.status === "published" ? "Close listing" : "Reopen listing"}
          </Button>
        )}
        <span className="text-xs text-muted-foreground">Expires {new Date(job.expires_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>
      </div>
    </div>
  );
}
