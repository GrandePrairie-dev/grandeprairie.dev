import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function CommunityDigestSignup() {
  const [email, setEmail] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);
  const { toast } = useToast();

  const subscribe = useMutation({
    mutationFn: () => apiRequest("POST", "/api/digest/subscriptions", { email }),
    onSuccess: () => {
      setConfirmationSent(true);
      setEmail("");
    },
    onError: (error) => {
      toast({
        title: "Could not subscribe",
        description: error instanceof Error ? error.message : "Try again shortly.",
        variant: "destructive",
      });
    },
  });

  return (
    <section className="border-y border-border bg-boreal-spruce/10 px-4 py-5 md:px-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-boreal-spruce text-aurora-teal">
            {confirmationSent ? <Check className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-sm font-semibold">The GP.dev Weekly</h2>
            <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground">
              One useful email with local events, questions, projects, and regional tech signals.
            </p>
          </div>
        </div>
        {confirmationSent ? (
          <p className="text-sm font-medium text-aurora-teal">Check your email to confirm.</p>
        ) : (
          <form
            className="flex w-full gap-2 md:w-auto"
            onSubmit={(event) => {
              event.preventDefault();
              subscribe.mutate();
            }}
          >
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-w-0 md:w-64"
              required
            />
            <Button type="submit" disabled={subscribe.isPending || !email.trim()}>
              {subscribe.isPending ? "Joining..." : "Subscribe"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
