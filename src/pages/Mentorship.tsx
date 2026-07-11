import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { parseJsonArray, type MentorRecommendation, type MentorRequest, type MentorRoutingResult, type Profile } from "@/lib/types";
import { Check, CircleX, MessageSquare, UserRoundSearch } from "lucide-react";

function RequestRow({
  request,
  incoming,
  onUpdate,
}: {
  request: MentorRequest;
  incoming: boolean;
  onUpdate: (id: number, status: string, outcome?: string, notes?: string) => void;
}) {
  const complete = () => {
    const successful = window.confirm("Did this mentorship successfully address the request?");
    const notes = window.prompt("Optional outcome notes") ?? "";
    onUpdate(request.id, "completed", successful ? "successful" : "unsuccessful", notes);
  };
  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">{incoming ? request.mentee_name : request.mentor_name}</p>
        <Badge variant="outline">{request.status}</Badge>
        {request.topic && <Badge variant="secondary">{request.topic}</Badge>}
      </div>
      {request.question_title && <p className="mt-1 text-xs font-medium">{request.question_title}</p>}
      {request.message && <p className="mt-1 text-xs text-muted-foreground">{request.message}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {incoming && request.status === "pending" && (
          <>
            <Button size="sm" onClick={() => onUpdate(request.id, "accepted")}><Check /> Accept</Button>
            <Button size="sm" variant="outline" onClick={() => onUpdate(request.id, "declined")}><CircleX /> Decline</Button>
          </>
        )}
        {!incoming && request.status === "pending" && (
          <Button size="sm" variant="outline" onClick={() => onUpdate(request.id, "cancelled")}>Cancel request</Button>
        )}
        {request.status === "accepted" && <Button size="sm" variant="outline" onClick={complete}>Record outcome</Button>}
        {request.question_id && <Link href="/board"><Button size="sm" variant="ghost"><MessageSquare /> View question</Button></Link>}
      </div>
    </div>
  );
}

export default function Mentorship() {
  const questionId = useMemo(() => Number(new URLSearchParams(window.location.search).get("question")) || null, []);
  const [message, setMessage] = useState("");
  const { isLoggedIn, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: mentors, isLoading: mentorsLoading } = useQuery<Profile[]>({ queryKey: ["/api/mentors"] });
  const { data: routing } = useQuery<MentorRoutingResult>({
    queryKey: [`/api/mentor-routing/${questionId}`],
    enabled: !!questionId && isLoggedIn,
    retry: false,
  });
  const { data: incoming } = useQuery<MentorRequest[]>({
    queryKey: ["/api/mentor-requests/incoming"],
    enabled: isLoggedIn,
  });
  const { data: outgoing } = useQuery<MentorRequest[]>({
    queryKey: ["/api/mentor-requests/outgoing"],
    enabled: isLoggedIn,
  });

  const requestMentor = useMutation({
    mutationFn: (mentorId: number) => apiRequest("POST", `/api/mentors/${mentorId}/request`, {
      message: message || undefined,
      question_id: questionId,
      topic: routing?.topic,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor-requests/outgoing"] });
      setMessage("");
      toast({ title: "Mentor request sent" });
    },
    onError: () => toast({ title: "Could not send mentor request", variant: "destructive" }),
  });
  const updateRequest = useMutation({
    mutationFn: ({ id, status, outcome, notes }: { id: number; status: string; outcome?: string; notes?: string }) =>
      apiRequest("PATCH", `/api/mentor-requests/${id}`, {
        status,
        outcome_status: outcome,
        outcome_notes: notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor-requests/incoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mentor-requests/outgoing"] });
      toast({ title: "Mentorship updated" });
    },
  });
  const update = (id: number, status: string, outcome?: string, notes?: string) =>
    updateRequest.mutate({ id, status, outcome, notes });

  const routedMentors = routing?.mentors ?? mentors ?? [];
  return (
    <div className="max-w-4xl space-y-7 p-4 md:p-6">
      <header className="border-b border-border pb-5">
        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Community support</p>
        <h1 className="font-display text-2xl font-bold">Mentorship</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Route a specific question to an available local mentor, or manage introductions already in progress.
        </p>
      </header>

      {questionId && routing && (
        <section className="border-b border-border pb-6">
          <Badge variant="secondary">Routing question</Badge>
          <h2 className="mt-2 font-display text-lg font-semibold">{routing.question.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{routing.question.body}</p>
          <Textarea className="mt-4" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add context for the mentor..." />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
          {questionId ? "Recommended mentors" : "Available mentors"}
        </h2>
        {mentorsLoading ? <Skeleton className="h-36 w-full" /> : routedMentors.length ? (
          <div className="divide-y divide-border">
            {routedMentors.map((mentor) => {
              const topics = parseJsonArray(mentor.mentor_topics);
              const recommendation = "capacity_remaining" in mentor ? mentor as MentorRecommendation : null;
              return (
                <div key={mentor.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <Link href={`/people/${mentor.id}`}><span className="cursor-pointer font-semibold hover:text-aurora-teal">{mentor.name}</span></Link>
                    <p className="text-xs text-muted-foreground">{mentor.title || mentor.role}</p>
                    <div className="mt-2 flex flex-wrap gap-1">{topics.map((topic) => <Badge key={topic} variant="outline">{topic}</Badge>)}</div>
                    {recommendation && <p className="mt-2 text-xs text-muted-foreground">{recommendation.capacity_remaining} spaces available{recommendation.matched_topics.length ? ` · matches ${recommendation.matched_topics.join(", ")}` : ""}</p>}
                  </div>
                  {questionId && (
                    <Button onClick={() => isLoggedIn ? requestMentor.mutate(mentor.id) : login(`/mentorship?question=${questionId}`)} disabled={requestMentor.isPending}>
                      <UserRoundSearch /> Request support
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : <p className="text-sm text-muted-foreground">No mentors currently have capacity for this topic.</p>}
      </section>

      {isLoggedIn && !!incoming?.length && (
        <section><h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Requests for you</h2>{incoming.map((request) => <RequestRow key={request.id} request={request} incoming onUpdate={update} />)}</section>
      )}
      {isLoggedIn && !!outgoing?.length && (
        <section><h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Your requests</h2>{outgoing.map((request) => <RequestRow key={request.id} request={request} incoming={false} onUpdate={update} />)}</section>
      )}
      {!isLoggedIn && <Button variant="outline" onClick={() => login("/mentorship")}>Sign in to manage mentorship</Button>}
    </div>
  );
}
