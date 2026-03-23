import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RoleFilter } from "@/components/RoleFilter";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@/lib/types";
import { EVENT_CATEGORY_LABELS, EVENT_CATEGORIES } from "@/lib/types";

const filterOptions = Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

export default function Calendar() {
  const [category, setCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventCategory, setEventCategory] = useState("");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const { toast } = useToast();
  const { isLoggedIn, isContributor, login } = useAuth();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery<Event[]>({ queryKey: ["/api/events/upcoming"] });

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/events", {
      title,
      description,
      category: eventCategory,
      start_time: startTime,
      location,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/upcoming"] });
      setDialogOpen(false);
      setTitle(""); setDescription(""); setEventCategory(""); setStartTime(""); setLocation("");
      toast({ title: "Event created!" });
    },
  });

  const filtered = (events ?? []).filter(
    (event) => category === "all" || event.category === category
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold">Calendar</h1>
        {isContributor ? (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add Event</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-3">
                <Input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
                <Select value={eventCategory} onValueChange={setEventCategory}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {EVENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
                <Button type="submit" disabled={mutation.isPending || !title || !startTime}>
                  {mutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        ) : isLoggedIn ? (
          <Button size="sm" variant="outline" onClick={() => login("/calendar")}>
            Sign in with GitHub to add events
          </Button>
        ) : (
          <Button size="sm" onClick={() => login("/calendar")}>Add Event</Button>
        )}
      </div>

      <RoleFilter options={filterOptions} value={category} onChange={setCategory} />

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-semibold mb-1">No upcoming events</p>
          <p className="text-sm">Create one to get the community together.</p>
        </div>
      ) : (
        <div>
          {filtered.map((event, i) => (
            <EventCard key={event.id} event={event} featured={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
