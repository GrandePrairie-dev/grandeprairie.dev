import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";

export default function BusinessDetail() {
  const params = useParams<{ id: string }>();
  const { isLoggedIn, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const { data: request, isLoading } = useQuery<any>({
    queryKey: [`/api/business-requests/${params.id}`],
  });

  const interestMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/business-requests/${params.id}/interests`, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/business-requests/${params.id}`] });
      toast({ title: "Interest submitted!" });
      setNote("");
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => fetch(`/api/business-requests/${params.id}/interests/me`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/business-requests/${params.id}`] });
      toast({ title: "Interest withdrawn" });
    },
  });

  if (isLoading) return <div className="p-4 md:p-6 max-w-3xl space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /></div>;
  if (!request) return <div className="p-4 md:p-6 max-w-3xl"><p className="text-muted-foreground">Request not found.</p></div>;

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      <Link href="/business">
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back
        </span>
      </Link>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-display font-bold">{request.business_name}</h1>
              <div className="flex items-center gap-2 mt-2">
                {request.category && <Badge variant="secondary" className="text-xs capitalize">{request.category}</Badge>}
                <Badge variant="outline" className="text-xs capitalize">{request.status?.replace(/_/g, " ")}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(request.created_at)}</span>
              </div>
            </div>
            {request.interest_count > 0 && (
              <span className="text-xs text-muted-foreground">{request.interest_count} interested</span>
            )}
          </div>
          <p className="text-sm leading-relaxed">{request.problem}</p>
        </CardContent>
      </Card>

      {/* Interest section */}
      {request.status !== "completed" && (
        <Card>
          <CardContent className="p-4 space-y-3">
            {!isLoggedIn ? (
              <Button variant="outline" onClick={() => login(`/business/${params.id}`)}>Sign in to express interest</Button>
            ) : request.user_has_interest ? (
              <div className="space-y-2">
                <p className="text-sm text-aurora-teal font-medium">You've expressed interest in this request.</p>
                <Button variant="outline" size="sm" onClick={() => withdrawMutation.mutate()}>Withdraw Interest</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Interested in helping?</h3>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional: tell them about your relevant experience..." className="min-h-[60px]" />
                <Button onClick={() => interestMutation.mutate()} disabled={interestMutation.isPending}>
                  {interestMutation.isPending ? "Submitting..." : "Express Interest"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
