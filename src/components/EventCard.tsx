import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Clock3, MapPin, Users } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@/lib/types";

interface EventCardProps {
  event: Event;
  featured?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  meetup: "bg-aurora-teal/10 text-aurora-teal",
  workshop: "bg-prairie-amber/10 text-prairie-amber",
  hackathon: "bg-rig-amber/10 text-rig-amber",
  talk: "bg-clear-sky/10 text-clear-sky",
  social: "bg-boreal-spruce/40 text-boreal-spruce-light",
  other: "bg-muted text-muted-foreground",
};

export function EventCard({ event, featured }: EventCardProps) {
  const { isLoggedIn, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const date = new Date(event.start_time);
  const day = date.getDate();
  const month = date.toLocaleDateString("en-CA", { month: "short" });
  const time = date.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
  const colorClass = CATEGORY_COLORS[event.category ?? "other"] ?? CATEGORY_COLORS.other;
  const activeRsvp = event.my_rsvp === "attending" || event.my_rsvp === "waitlist";

  const rsvp = useMutation({
    mutationFn: () => apiRequest("POST", `/api/events/${event.id}/rsvp`, {
      status: activeRsvp ? "cancelled" : "attending",
    }),
    onSuccess: async (response) => {
      const result = await response.json() as { status: string };
      queryClient.invalidateQueries({ queryKey: ["/api/events/upcoming"] });
      toast({
        title: result.status === "waitlist" ? "Added to waitlist" : result.status === "cancelled" ? "RSVP cancelled" : "You are going",
      });
    },
    onError: (error) => {
      toast({
        title: "Could not update RSVP",
        description: error instanceof Error ? error.message : "Try again shortly.",
        variant: "destructive",
      });
    },
  });

  const content = (
    <div className="flex items-start gap-4">
      <div className="text-center shrink-0 w-12">
        <div className="text-2xl font-[800] text-aurora-teal">{day}</div>
        <div className="text-[10px] text-muted-foreground uppercase">{month}</div>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-sm">{event.title}</h3>
        {featured && event.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
          {event.category && (
            <Badge variant="outline" className={`text-[10px] border-0 ${colorClass}`}>
              {event.category}
            </Badge>
          )}
          <span>{time}</span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {event.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {event.attendee_count ?? 0} going
          </span>
          {(event.waitlist_count ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Clock3 className="h-3 w-3" /> {event.waitlist_count} waiting
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {event.my_rsvp === "attending" && <Badge className="text-[10px]">Going</Badge>}
          {event.my_rsvp === "waitlist" && <Badge variant="secondary" className="text-[10px]">Waitlisted</Badge>}
          <Button
            type="button"
            size="sm"
            variant={activeRsvp ? "outline" : "default"}
            className="h-8 min-w-28 text-xs"
            disabled={rsvp.isPending}
            onClick={() => isLoggedIn ? rsvp.mutate() : login("/calendar")}
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            {rsvp.isPending
              ? "Updating..."
              : event.my_rsvp === "attending"
                ? "Cancel RSVP"
                : event.my_rsvp === "waitlist"
                  ? "Leave waitlist"
                  : "RSVP"}
          </Button>
        </div>
      </div>
    </div>
  );

  if (featured) {
    return (
      <Card className="border-l-2 border-l-aurora-teal">
        <CardContent className="p-4">{content}</CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 border-b border-border">
      {content}
    </div>
  );
}
