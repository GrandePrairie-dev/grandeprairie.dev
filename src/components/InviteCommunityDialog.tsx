import { useState, type FormEvent } from "react";
import { CheckCircle, Mail, Send, UserPlus } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface InviteCommunityDialogProps {
  triggerClassName?: string;
  triggerVariant?: ButtonProps["variant"];
}

async function sendInvite(email: string, message: string) {
  const res = await fetch("/api/invites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, message: message || undefined }),
  });
  const data = await res.json().catch(() => ({})) as { error?: string; message?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Invite could not be sent.");
  }
  return data;
}

export function InviteCommunityDialog({
  triggerClassName,
  triggerVariant = "outline",
}: InviteCommunityDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSentTo("");
      setIsSending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextEmail = email.trim();
    if (!nextEmail) return;

    setIsSending(true);
    try {
      await sendInvite(nextEmail, message.trim());
      setSentTo(nextEmail);
      setEmail("");
      setMessage("");
      toast({ title: "Invite sent", description: "They will get a GrandePrairie.dev invitation by email." });
    } catch (error) {
      toast({
        title: "Could not send invite",
        description: error instanceof Error ? error.message : "Invite failed.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant={triggerVariant} className={triggerClassName}>
          <UserPlus className="h-4 w-4" />
          Invite someone
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md border-border/90 bg-card p-0 shadow-gp-3 dark:bg-deep-frost">
        <div className="border-b border-border/80 bg-boreal-spruce/10 px-5 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-display">
              <UserPlus className="h-4 w-4 text-aurora-teal" />
              Invite someone to join
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Send a GrandePrairie.dev invite to a builder, student, founder, trades worker, mentor, or local organization contact.
            </DialogDescription>
          </DialogHeader>
        </div>

        {sentTo ? (
          <div className="space-y-4 px-5 pb-5">
            <div className="rounded-md border border-aurora-teal/30 bg-aurora-teal/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-aurora-teal" />
                <div>
                  <p className="text-sm font-semibold">Invite sent</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {sentTo} will receive a community invite with a link back to GrandePrairie.dev.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" className="text-muted-foreground" onClick={() => setSentTo("")}>
                Invite another
              </Button>
              <Button type="button" variant="spruce" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-5">
            <div className="space-y-2">
              <Label htmlFor="invite-email" className="text-xs">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="builder@example.com"
                  className="pl-9"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-message" className="text-xs">
                Personal note
              </Label>
              <Textarea
                id="invite-message"
                value={message}
                onChange={(event) => setMessage(event.target.value.slice(0, 600))}
                placeholder="Thought you might want to connect with the GP builder community."
                className="min-h-[104px] resize-none"
              />
              <p className="text-right text-[10px] text-muted-foreground">{message.length}/600</p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" className="text-muted-foreground" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="spruce" disabled={isSending}>
                <Send className="h-4 w-4" />
                {isSending ? "Sending" : "Send invite"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
