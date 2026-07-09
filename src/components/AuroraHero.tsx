import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle,
  Code2,
  Github,
  GraduationCap,
  HardHat,
  Mail,
  MapPin,
  Rocket,
  Send,
  Store,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import type { Stats } from "@/lib/types";

const SIGNUP_ROLES = [
  { id: "developer", label: "Developer", icon: Code2 },
  { id: "trades", label: "Trades", icon: HardHat },
  { id: "founder", label: "Founder", icon: Rocket },
  { id: "student", label: "Student", icon: GraduationCap },
  { id: "business", label: "Business", icon: Store },
] as const;

export function AuroraHero() {
  const { data: stats } = useQuery<Stats>({ queryKey: ["/api/stats"] });
  const { user, isLoggedIn, isLoading, login } = useAuth();
  const [emailValue, setEmailValue] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [selectedRole, setSelectedRole] = useState<(typeof SIGNUP_ROLES)[number]["id"]>("developer");
  const selectedRoleLabel = SIGNUP_ROLES.find((role) => role.id === selectedRole)?.label ?? "Builder";

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = emailValue.trim();
    if (!email) return;

    setEmailSending(true);
    try {
      await fetch("/api/auth/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, return_to: "/people" }),
      });
      setEmailSent(true);
    } catch {
      setEmailSent(true);
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <section className="relative overflow-hidden py-12 md:py-16 lg:py-20 gp-glow">
      {/* Hero background image — dark: aurora, light: golden hour */}
      <img
        src="/images/hero-aurora.webp"
        alt=""
        className="absolute inset-0 z-0 w-full h-full object-cover pointer-events-none hidden dark:block dark:opacity-35"
      />
      <img
        src="/images/hero-golden-hour.webp"
        alt=""
        className="absolute inset-0 z-0 w-full h-full object-cover pointer-events-none block dark:hidden opacity-40"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-background/40 to-background dark:via-background/60 pointer-events-none" />
      <neural-net
        color="#3DBFA8"
        density="0.00008"
        opacity="0.32"
        speed="0.12"
        link="140"
        aria-hidden="true"
        className="absolute inset-0 z-[2]"
      />

      <div className="relative z-10 px-4 md:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[1fr_360px]">
          <div className="text-center lg:text-left">
            {/* Badges */}
            <div className="mb-6 inline-flex flex-wrap justify-center gap-2 lg:justify-start">
              <Link href="/map">
                <span className="px-3 py-1 rounded bg-boreal-spruce text-boreal-spruce-light text-[9px] font-bold uppercase tracking-[0.06em] border border-boreal-spruce-light/30 cursor-pointer hover:border-boreal-spruce-light/60 transition-colors">
                  55°N · 118°W
                </span>
              </Link>
              <span className="px-3 py-1 rounded bg-prairie-amber/15 text-prairie-amber text-[9px] font-bold uppercase tracking-[0.06em]">
                Launched Mar 2026
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-3 text-3xl font-display font-[800] uppercase md:text-4xl">
              Build Real Things
            </h1>
            <p className="mx-auto mb-4 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base lg:mx-0">
              The Peace Region's open platform for developers, trades, founders, and builders. Oil & gas country meets open source.
            </p>
            <p className="mx-auto mb-8 max-w-md text-xs leading-relaxed text-muted-foreground/70 lg:mx-0">
              Whether you write code, weld pipe, run heavy equipment, or manage projects — if you build things, you belong here.
            </p>

            <div className="mb-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/ideas">
                <Button variant="outline" className="text-muted-foreground">
                  Explore Ideas <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/business">
                <Button variant="ghost" className="text-muted-foreground">
                  Bring a Problem
                </Button>
              </Link>
            </div>

            <div className="mx-auto mb-8 flex max-w-lg items-center gap-3 rounded-lg border border-border/70 bg-background/55 p-3 text-left backdrop-blur-sm lg:mx-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-boreal-spruce/80 text-aurora-teal">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-aurora-teal">
                  Peace Region Signal
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Grande Prairie builders across energy, ag, construction, education, and local business.
                </p>
              </div>
            </div>

            {/* Stats row — hide zero-value stats */}
            <div className="flex flex-wrap justify-center gap-6 border-t border-border pt-6 md:gap-10 lg:justify-start">
              <StatItem value={stats?.profiles ?? 0} label="builders" color="text-aurora-teal" />
              <StatItem value={stats?.ideas ?? 0} label="ideas" color="text-prairie-amber" />
              {(stats?.projects ?? 0) > 0 && (
                <StatItem value={stats?.projects ?? 0} label="projects" color="text-foreground" />
              )}
              <StatItem value={stats?.events ?? 0} label="events" color="text-rig-amber" />
              <StatItem value={5} label="industries" color="text-river-slate" />
            </div>
          </div>

          <div className="mx-auto w-full max-w-[360px] rounded-lg border border-border/80 bg-card/90 p-4 text-left shadow-gp-2 backdrop-blur-md dark:bg-deep-frost/80">
            {isLoggedIn && user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-boreal-spruce text-sm font-bold text-aurora-teal">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-aurora-teal">
                      You're in
                    </p>
                    <h2 className="truncate text-base font-display font-bold">
                      {user.name}
                    </h2>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Jump into the community directory, update your profile, or find a problem worth building around.
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <Link href={`/people/${user.id}`}>
                    <Button variant="spruce" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                  <Link href="/ideas">
                    <Button variant="outline" className="w-full text-muted-foreground">
                      Browse Ideas
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.06em] text-aurora-teal">
                    Join the build list
                  </p>
                  <h2 className="text-lg font-display font-bold">
                    Create your builder profile
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Start as a {selectedRoleLabel}. You can tune your profile after signing in.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {SIGNUP_ROLES.map(({ id, label, icon: Icon }) => {
                    const selected = selectedRole === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedRole(id)}
                        className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-[11px] font-semibold transition-colors ${
                          selected
                            ? "border-aurora-teal/70 bg-aurora-teal/10 text-aurora-teal"
                            : "border-border bg-background/60 text-muted-foreground hover:border-boreal-spruce-light/50 hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-2">
                  <Button
                    variant="spruce"
                    className="w-full"
                    disabled={isLoading}
                    onClick={() => login("/people")}
                  >
                    <Github className="h-4 w-4" />
                    Continue with GitHub
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-center text-muted-foreground"
                    disabled={isLoading}
                    onClick={() => login("/people", "google")}
                  >
                    <GoogleIcon className="h-4 w-4" />
                    Continue with Google
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-2 text-[10px] uppercase tracking-[0.06em] text-muted-foreground dark:bg-deep-frost">
                      or email
                    </span>
                  </div>
                </div>

                {emailSent ? (
                  <div className="rounded-md border border-aurora-teal/30 bg-aurora-teal/10 p-3 text-sm">
                    <div className="flex items-start gap-2 text-aurora-teal">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-semibold">Magic link sent</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          Check your inbox, then come back to shape your {selectedRoleLabel.toLowerCase()} profile.
                        </p>
                      </div>
                    </div>
                    <Link href="/ideas">
                      <Button variant="outline" size="sm" className="mt-3 w-full text-muted-foreground">
                        Browse ideas while you wait
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleEmailSubmit} className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        value={emailValue}
                        onChange={(event) => setEmailValue(event.target.value)}
                        placeholder="you@email.com"
                        className="pl-9"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full"
                      disabled={emailSending}
                    >
                      {emailSending ? (
                        <>
                          <Send className="h-4 w-4" />
                          Sending link
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" />
                          Send magic link
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div>
      <span className={`text-xl md:text-2xl font-[800] ${color}`}>{value}</span>
      <span className="text-muted-foreground text-[10px] block uppercase tracking-[0.05em] mt-1">{label}</span>
    </div>
  );
}
