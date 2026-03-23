import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BusinessRequest } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const BUSINESS_CATEGORIES = ["automation", "website", "data", "ai", "other"] as const;

const STATUS_BADGE_CLASSES: Record<string, string> = {
  new: "bg-prairie-amber/10 text-prairie-amber",
  reviewed: "bg-aurora-teal/10 text-aurora-teal",
  matched: "bg-boreal-spruce/40 text-boreal-spruce-light",
  in_progress: "bg-rig-amber/10 text-rig-amber",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
};

export default function Business() {
  const [submitted, setSubmitted] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [problem, setProblem] = useState("");
  const [category, setCategory] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery<BusinessRequest[]>({
    queryKey: ["/api/business-requests"],
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/business-requests", {
        business_name: businessName,
        contact_name: contactName || null,
        contact_email: contactEmail || null,
        problem,
        category,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-requests"] });
      setSubmitted(true);
      toast({ title: "Request submitted!" });
    },
  });

  function resetForm() {
    setSubmitted(false);
    setBusinessName("");
    setContactName("");
    setContactEmail("");
    setProblem("");
    setCategory("");
  }

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">
          Small Business
        </p>
        <h1 className="text-2xl font-display font-bold mb-1">Small Business</h1>
        <p className="font-display font-semibold text-muted-foreground mb-2">
          Got a problem? We have builders.
        </p>
        <p className="text-sm text-muted-foreground">
          Tell us what your business needs help with. We'll connect you with local tech talent from
          the Grande Prairie community who can build solutions.
        </p>
      </div>

      {/* Inline Request Form */}
      <Card className="border border-border bg-card">
        <CardContent className="p-5 space-y-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Submit a Request
          </p>

          {submitted ? (
            <div className="flex flex-col items-center py-6 text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-aurora-teal" />
              <p className="font-display font-bold text-lg">Request submitted!</p>
              <p className="text-sm text-muted-foreground">
                We'll review it and match you with builders.
              </p>
              <Button variant="outline" size="sm" onClick={resetForm}>
                Submit Another
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
              className="space-y-3"
            >
              <Input
                placeholder="Business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Your name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <Textarea
                placeholder="Describe your problem or what you need built..."
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                required
                rows={4}
              />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="submit"
                disabled={mutation.isPending || !businessName || !problem}
              >
                {mutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Open Requests */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Open Requests
        </p>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (requests ?? []).filter((r) => r.status !== "completed").length === 0 ? (
          <p className="text-sm text-muted-foreground">No open requests yet.</p>
        ) : (
          <div className="space-y-3">
            {(requests ?? []).filter((r) => r.status !== "completed").map((req) => (
              <Link key={req.id} href={`/business/${req.id}`}>
                <Card className="border border-border bg-card hover:border-aurora-teal/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-semibold text-sm">{req.business_name}</h3>
                      <div className="flex gap-1 shrink-0">
                        {req.category && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {req.category}
                          </Badge>
                        )}
                        {req.status && (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              STATUS_BADGE_CLASSES[req.status] ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {req.status.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{req.problem}</p>
                    <p className="text-xs text-muted-foreground/60">{formatDate(req.created_at)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
