import { useLocation } from "wouter";
import {
  Home,
  MapPin,
  Users,
  Lightbulb,
  Calendar,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

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
    items: [{ label: "Ideas", href: "/ideas", icon: Lightbulb }],
  },
  {
    title: "Connect",
    items: [{ label: "Calendar", href: "/calendar", icon: Calendar }],
  },
];

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
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 space-y-3 border-t border-sidebar-border">
        {/* User profile */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-boreal-spruce text-boreal-spruce-light text-[10px] font-semibold shrink-0">
            CJ
          </div>
          <div className="flex flex-col leading-none min-w-0">
            <span className="text-[12px] text-sidebar-foreground font-medium truncate">
              CJ Elliott
            </span>
            <span className="text-[10px] text-[#8B95A5]">Founder</span>
          </div>
        </div>

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
