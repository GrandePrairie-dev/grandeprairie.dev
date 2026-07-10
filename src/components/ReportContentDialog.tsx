import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const REASONS = [
  ["spam", "Spam or promotion"],
  ["harassment", "Harassment"],
  ["misinformation", "Misleading information"],
  ["unsafe", "Safety concern"],
  ["off_topic", "Off topic"],
  ["other", "Other"],
] as const;

interface ReportContentDialogProps {
  targetType: "board_post" | "profile" | "project" | "event";
  targetId: number;
}

export function ReportContentDialog({ targetType, targetId }: ReportContentDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const { isLoggedIn, login } = useAuth();
  const { toast } = useToast();

  const report = useMutation({
    mutationFn: () => apiRequest("POST", "/api/reports", {
      target_type: targetType,
      target_id: targetId,
      reason,
      details,
    }),
    onSuccess: () => {
      setOpen(false);
      setReason("");
      setDetails("");
      toast({ title: "Report sent", description: "A community moderator will review it." });
    },
    onError: (error) => {
      toast({
        title: "Could not send report",
        description: error instanceof Error ? error.message : "Try again shortly.",
        variant: "destructive",
      });
    },
  });

  if (!isLoggedIn) {
    return (
      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => login("/board")} title="Sign in to report">
        <Flag className="h-3.5 w-3.5" />
        Report
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" title="Report content">
          <Flag className="h-3.5 w-3.5" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report content</DialogTitle>
          <DialogDescription>
            Reports go to GP.dev community moderators. Use this for safety, spam, or conduct issues.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            report.mutate();
          }}
        >
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue placeholder="Reason" /></SelectTrigger>
            <SelectContent>
              {REASONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Add context that will help a moderator understand the issue."
            maxLength={1000}
          />
          <Button type="submit" disabled={!reason || report.isPending}>
            {report.isPending ? "Sending..." : "Send Report"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
