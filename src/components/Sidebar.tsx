import { useState } from "react";
import { useLocation } from "wouter";
import {
  Home,
  MapPin,
  Users,
  Lightbulb,
  Calendar,
  Sun,
  Moon,
  FolderOpen,
  Newspaper,
  Wrench,
  GraduationCap,
  Building2,
  Cpu,
  Heart,
  Settings,
  Github,
  LogOut,
  Mail,
  Send,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

import type { ComponentType, SVGProps } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  isMobile: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

/* ------------------------------------------------------------------ */
/*  Navigation structure                                               */
/* ------------------------------------------------------------------ */

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Explore",
    items: [
      { label: "Home", href: "/", icon: Home },
      { label: "Map", href: "/map", icon: MapPin },
      { label: "People", href: "/people", icon: Users },
    ],
  },
  {
    title: "Build",
    items: [
      { label: "Ideas", href: "/ideas", icon: Lightbulb },
      { label: "Projects", href: "/projects", icon: FolderOpen },
    ],
  },
  {
    title: "Learn",
    items: [
      { label: "Intel", href: "/intel", icon: Newspaper },
      { label: "Tech Hub", href: "/tech-hub", icon: Wrench },
      { label: "Students", href: "/students", icon: GraduationCap },
    ],
  },
  {
    title: "Connect",
    items: [
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Business", href: "/business", icon: Building2 },
      { label: "Organizations", href: "/orgs", icon: Building2 },
      { label: "AI Hub", href: "/ai-hub", icon: Cpu },
    ],
  },
];

const STANDALONE_ITEMS: NavItem[] = [
  { label: "About", href: "/about", icon: Heart },
  { label: "Admin", href: "/admin", icon: Settings },
];

/* ------------------------------------------------------------------ */
/*  Google icon (inline SVG)                                           */
/* ------------------------------------------------------------------ */

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Inner sidebar content (shared between desktop & mobile)            */
/* ------------------------------------------------------------------ */

function SidebarContent({
  theme,
  toggleTheme,
}: {
  theme: "dark" | "light";
  toggleTheme: () => void;
}) {
  const [location] = useLocation();
  const { user, isLoggedIn, login, logout } = useAuth();
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValue.trim()) return;
    setEmailSending(true);
    try {
      await fetch("/api/auth/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue.trim() }),
      });
      setEmailSent(true);
    } catch {
      // silent fail — anti-enumeration
      setEmailSent(true);
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-[210px] bg-sidebar border-r border-sidebar-border">
      {/* Logo area */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex items-center justify-center w-7 h-7 rounded-[6px] bg-boreal-spruce border border-boreal-spruce-light text-white text-xs font-bold shrink-0">
          &#9670;
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-white text-[12px] font-bold tracking-[0.02em]">
            GRANDEPRAIRIE
          </span>
          <span className="text-boreal-spruce-light text-[9px] font-bold tracking-[0.02em]">
            .DEV
          </span>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-5 mt-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <span className="block px-2.5 mb-1.5 text-river-slate text-[9px] uppercase tracking-[0.08em] font-semibold select-none">
              {group.title}
            </span>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? location === "/"
                    : location.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 text-[12px] py-[7px] px-[10px] rounded-md transition-colors",
                        isActive
                          ? "border-l-2 border-aurora-teal bg-boreal-spruce/40 text-aurora-teal"
                          : "text-[#8B95A5] hover:bg-white/5"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {/* Standalone nav items */}
        <div className="border-t border-sidebar-border mt-4 pt-3">
          <ul className="space-y-0.5">
            {STANDALONE_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? location === "/"
                  : location.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 text-[12px] py-[7px] px-[10px] rounded-md transition-colors",
                      isActive
                        ? "border-l-2 border-aurora-teal bg-boreal-spruce/40 text-aurora-teal"
                        : "text-[#8B95A5] hover:bg-white/5"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 space-y-3 border-t border-sidebar-border">
        {/* User profile / sign-in */}
        {isLoggedIn && user ? (
          <div className="flex items-center gap-2.5 px-1">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-boreal-spruce text-boreal-spruce-light text-[10px] font-semibold shrink-0">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
            )}
            <div className="flex flex-col leading-none min-w-0 flex-1">
              <span className="text-[12px] text-sidebar-foreground font-medium truncate">
                {user.name}
              </span>
              <span className="text-[10px] text-[#8B95A5] capitalize">
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="shrink-0 text-[#8B95A5] hover:text-sidebar-foreground transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* GitHub — primary (contributor path) */}
            <button
              onClick={() => login()}
              className="flex items-center gap-2 w-full px-2.5 py-[7px] rounded-md text-[11px] text-sidebar-foreground bg-boreal-spruce/30 hover:bg-boreal-spruce/50 transition-colors"
            >
              <Github className="h-3.5 w-3.5 shrink-0" />
              Sign in with GitHub
            </button>
            <span className="block px-2.5 text-[9px] text-[#8B95A5]">For contributors</span>

            {/* Google */}
            <button
              onClick={() => login(undefined, "google")}
              className="flex items-center gap-2 w-full px-2.5 py-[7px] rounded-md text-[11px] text-[#8B95A5] hover:bg-white/5 hover:text-sidebar-foreground transition-colors"
            >
              <GoogleIcon className="h-3.5 w-3.5 shrink-0" />
              Sign in with Google
            </button>

            {/* Email magic link */}
            {emailSent ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-aurora-teal">
                <CheckCircle className="h-3 w-3 shrink-0" />
                Check your email!
              </div>
            ) : showEmailInput ? (
              <form onSubmit={handleEmailSubmit} className="px-1 space-y-1.5">
                <Input
                  type="email"
                  placeholder="you@email.com"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  className="h-7 text-[11px] bg-white/5 border-sidebar-border"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={emailSending}
                  className="w-full h-7 text-[10px]"
                >
                  <Send className="h-3 w-3 mr-1" />
                  {emailSending ? "Sending..." : "Send link"}
                </Button>
              </form>
            ) : (
              <button
                onClick={() => setShowEmailInput(true)}
                className="flex items-center gap-2 w-full px-2.5 py-[7px] rounded-md text-[11px] text-[#8B95A5] hover:bg-white/5 hover:text-sidebar-foreground transition-colors"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                Email sign in
              </button>
            )}

            <p className="px-2.5 pt-1 text-[9px] text-[#8B95A5] leading-tight">
              GitHub accounts can submit ideas and create events.
            </p>
          </div>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-[#8B95A5] hover:text-sidebar-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported Sidebar — desktop or mobile sheet                         */
/* ------------------------------------------------------------------ */

export function Sidebar({
  isMobile,
  open,
  onOpenChange,
  theme,
  toggleTheme,
}: SidebarProps) {
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="p-0 w-[210px]">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent theme={theme} toggleTheme={toggleTheme} />
        </SheetContent>
      </Sheet>
    );
  }

  return <SidebarContent theme={theme} toggleTheme={toggleTheme} />;
}
