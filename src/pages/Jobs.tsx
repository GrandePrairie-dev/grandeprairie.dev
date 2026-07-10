import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EMPLOYMENT_LABELS, WORKPLACE_LABELS, formatCompensation } from "@/lib/jobs";
import { parseJsonArray, type Job } from "@/lib/types";
import { BriefcaseBusiness, MapPin, Plus, Search, X } from "lucide-react";

const EMPTY_FORM = {
  title: "",
  organization: "",
  description: "",
  employment_type: "full_time",
  workplace_type: "onsite",
  location: "Grande Prairie, AB",
  compensation_min: "",
  compensation_max: "",
  compensation_period: "year",
  application_url: "",
  tags: "",
};

export default function Jobs() {
  const [employmentType, setEmploymentType] = useState("all");
  const [workplaceType, setWorkplaceType] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const { isLoggedIn, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (employmentType !== "all") params.set("employment_type", employmentType);
    if (workplaceType !== "all") params.set("workplace_type", workplaceType);
    if (search.trim()) params.set("q", search.trim());
    const value = params.toString();
    return value ? `/api/jobs?${value}` : "/api/jobs";
  }, [employmentType, workplaceType, search]);
  const { data: jobs, isLoading } = useQuery<Job[]>({ queryKey: [queryUrl] });

  const submission = useMutation({
    mutationFn: () => apiRequest("POST", "/api/jobs", {
      ...form,
      compensation_min: form.compensation_min ? Number(form.compensation_min) : null,
      compensation_max: form.compensation_max ? Number(form.compensation_max) : null,
      compensation_period: form.compensation_min || form.compensation_max ? form.compensation_period : null,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast({ title: "Job published" });
    },
    onError: () => toast({ title: "Could not publish job", variant: "destructive" }),
  });

  const openForm = () => {
    if (!isLoggedIn) {
      login("/jobs");
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
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Local opportunities</p>
          <h1 className="font-display text-2xl font-bold">Jobs & gigs</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Structured opportunities for Peace Region builders. Informal leads and referrals still belong on the community board.
          </p>
        </div>
        <Button onClick={openForm}><Plus className="h-4 w-4" /> Post a job</Button>
      </header>

      {showForm && (
        <section className="border-b border-border pb-6" aria-label="Post a job">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Publish an opportunity</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} title="Close form"><X /></Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={form.title} onChange={update("title")} placeholder="Role title" maxLength={120} />
            <Input value={form.organization} onChange={update("organization")} placeholder="Organization" maxLength={120} />
            <Select value={form.employment_type} onValueChange={(value) => setForm((current) => ({ ...current, employment_type: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.workplace_type} onValueChange={(value) => setForm((current) => ({ ...current, workplace_type: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(WORKPLACE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input value={form.location} onChange={update("location")} placeholder="Location" />
            <Input value={form.application_url} onChange={update("application_url")} placeholder="https://application-link.example" />
            <Input type="number" min="0" value={form.compensation_min} onChange={update("compensation_min")} placeholder="Compensation minimum" />
            <Input type="number" min="0" value={form.compensation_max} onChange={update("compensation_max")} placeholder="Compensation maximum" />
            <Select value={form.compensation_period} onValueChange={(value) => setForm((current) => ({ ...current, compensation_period: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">Per hour</SelectItem>
                <SelectItem value="year">Per year</SelectItem>
                <SelectItem value="project">Per project</SelectItem>
              </SelectContent>
            </Select>
            <Input value={form.tags} onChange={update("tags")} placeholder="Skills, separated by commas" />
            <Textarea className="sm:col-span-2" value={form.description} onChange={update("description")} placeholder="Responsibilities, requirements, and what success looks like" maxLength={4000} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => submission.mutate()}
              disabled={submission.isPending || !form.title || !form.organization || !form.description || !form.application_url}
            >
              {submission.isPending ? "Publishing..." : "Publish for 30 days"}
            </Button>
          </div>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_180px_150px]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles, organizations, skills" />
        </div>
        <Select value={employmentType} onValueChange={setEmploymentType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All opportunity types</SelectItem>
            {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={workplaceType} onValueChange={setWorkplaceType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any workplace</SelectItem>
            {Object.entries(WORKPLACE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-32 w-full" />)}</div>
      ) : jobs?.length ? (
        <div className="divide-y divide-border">
          {jobs.map((job) => {
            const compensation = formatCompensation(job);
            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <article className="cursor-pointer py-5 first:pt-0 hover:bg-muted/20">
                  <div className="flex items-start gap-3">
                    <BriefcaseBusiness className="mt-0.5 h-5 w-5 shrink-0 text-aurora-teal" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-base font-semibold">{job.title}</h2>
                        <Badge variant="secondary">{EMPLOYMENT_LABELS[job.employment_type]}</Badge>
                        {job.source === "careerlynx" && <Badge variant="outline">CareerLynx</Badge>}
                      </div>
                      <p className="mt-1 text-sm font-medium">{job.organization}</p>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{job.description}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{WORKPLACE_LABELS[job.workplace_type]}</span>
                        {job.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                        {compensation && <span className="font-medium text-prairie-amber">{compensation}</span>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {parseJsonArray(job.tags).slice(0, 6).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-14 text-center text-muted-foreground">
          <BriefcaseBusiness className="mx-auto mb-3 h-10 w-10 opacity-50" />
          <p className="font-semibold text-foreground">No matching opportunities</p>
          <p className="mt-1 text-sm">Try a broader filter or post the first local role.</p>
        </div>
      )}
    </div>
  );
}
