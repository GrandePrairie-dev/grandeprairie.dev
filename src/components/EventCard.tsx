import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
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
  const date = new Date(event.start_time);
  const day = date.getDate();
  const month = date.toLocaleDateString("en-CA", { month: "short" });
  const time = date.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
  const colorClass = CATEGORY_COLORS[event.category ?? "other"] ?? CATEGORY_COLORS.other;

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
