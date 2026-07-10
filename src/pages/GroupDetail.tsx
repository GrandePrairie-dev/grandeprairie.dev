import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { parseJsonArray, type CommunityGroupDetail } from "@/lib/types";
import { ArrowLeft, MessageSquare, UserRound, Users } from "lucide-react";

export default function GroupDetail() {
  const params = useParams<{ slug: string }>();
  const { isLoggedIn, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const endpoint = `/api/groups/${params.slug}`;
  const { data: group, isLoading } = useQuery<CommunityGroupDetail>({ queryKey: [endpoint] });
  const membership = useMutation({
    mutationFn: (joined: boolean) => apiRequest(joined ? "DELETE" : "POST", `${endpoint}/membership`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
    onError: () => toast({ title: "Could not update membership", variant: "destructive" }),
  });

  if (isLoading) return <div className="max-w-4xl space-y-4 p-4 md:p-6"><Skeleton className="h-8 w-40" /><Skeleton className="h-52 w-full" /></div>;
  if (!group) return <div className="p-4 md:p-6">Group not found.</div>;
  const toggleMembership = () => {
    if (!isLoggedIn) {
      login(`/groups/${group.slug}`);
      return;
    }
    membership.mutate(!!group.viewer_role);
  };

  return (
    <div className="max-w-4xl space-y-6 p-4 md:p-6">
      <Link href="/groups"><span className="inline-flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft /> All groups</span></Link>
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{group.name}</h1>
            {group.viewer_role && <Badge variant="secondary">{group.viewer_role}</Badge>}
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{group.description}</p>
          <div className="mt-3 flex flex-wrap gap-1">{parseJsonArray(group.tags).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div>
        </div>
        <Button variant={group.viewer_role ? "outline" : "default"} onClick={toggleMembership} disabled={membership.isPending}>
          <Users /> {group.viewer_role ? "Leave group" : "Join group"}
        </Button>
      </header>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">Members · {group.member_count}</h2>
          <Link href="/board"><span className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-aurora-teal hover:underline"><MessageSquare /> Open the Board</span></Link>
        </div>
        {group.members.length ? (
          <div className="divide-y divide-border">
            {group.members.map((member) => (
              <Link key={member.id} href={`/people/${member.id}`}>
                <div className="flex cursor-pointer items-center gap-3 py-3 hover:bg-muted/20">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-boreal-spruce text-boreal-spruce-light"><UserRound /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{member.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.title || member.role}</p>
                  </div>
                  {member.membership_role === "organizer" && <Badge variant="outline">Organizer</Badge>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">No members yet. Join to help shape this group.</div>
        )}
      </section>
    </div>
  );
}
