import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Hammer,
  Rocket,
  Heart,
  Check,
} from "lucide-react";

const PILLARS = [
  {
    icon: BookOpen,
    color: "text-aurora-teal",
    bg: "bg-aurora-teal/10",
    title: "Learn Together",
    description: "Share knowledge, mentor newcomers, and grow skills across disciplines.",
  },
  {
    icon: Hammer,
    color: "text-prairie-amber",
    bg: "bg-prairie-amber/10",
    title: "Build Together",
    description: "Collaborate on real projects that solve real Peace Region problems.",
  },
  {
    icon: Rocket,
    color: "text-rig-amber",
    bg: "bg-rig-amber/10",
    title: "Launch Together",
    description: "Ship useful things. Start small. Iterate in public.",
  },
  {
    icon: Heart,
    color: "text-boreal-spruce-light",
    bg: "bg-boreal-spruce/20",
    title: "Support Together",
    description: "Welcome students, respect collaborators, and celebrate wins.",
  },
];

const NORMS = [
  "Share practical ideas",
  "Contribute in public where possible",
  "Start small",
  "Ship useful things",
  "Respect collaborators",
  "Document progress",
  "Welcome students and newcomers",
];

const ALL_ROLES = [
  "Developer",
  "Trades",
  "Student",
  "Founder",
  "Operator",
  "Mentor",
  "Educator",
  "Organizer",
];

const GET_INVOLVED = [
  { label: "Join the Community", href: "/people" },
  { label: "Share an Idea", href: "/ideas" },
  { label: "View the Calendar", href: "/calendar" },
];

export default function About() {
  return (
    <div className="p-4 md:p-6 space-y-10 max-w-4xl">
      <div className="relative h-32 -mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-6 overflow-hidden rounded-b-lg">
        <img src="/images/night-downtown.webp" alt="" className="w-full h-full object-cover opacity-45 dark:opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">
          About
        </p>
        <h1 className="text-2xl font-display font-bold mb-1">Build Together</h1>
        <p className="text-muted-foreground">
          The collaboration philosophy behind GrandePrairie.dev
        </p>
      </div>

      {/* Hero Statement */}
      <Card className="border border-border bg-card">
        <CardContent className="p-6">
          <p className="text-base md:text-lg font-display font-medium leading-relaxed">
            GrandePrairie.dev is the digital commons for builders in Grande Prairie and the Peace
            Region — connecting people, projects, ideas, and practical technology opportunity.
          </p>
        </CardContent>
      </Card>

      {/* Four Pillars */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Four Pillars
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {PILLARS.map(({ icon: Icon, color, bg, title, description }) => (
            <Card key={title} className="border border-border bg-card">
              <CardContent className="p-4 space-y-2">
                <div className={`w-8 h-8 rounded-md ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <h3 className="font-display font-semibold text-sm">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Community Norms */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Community Norms
        </p>
        <ul className="space-y-2">
          {NORMS.map((norm) => (
            <li key={norm} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-aurora-teal shrink-0" />
              <span>{norm}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Who Belongs Here */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Who Belongs Here
        </p>
        <p className="text-sm text-muted-foreground">
          Whether you write code, weld pipe, run heavy equipment, or manage projects — if you build
          things, you belong here.
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.map((role) => (
            <Badge key={role} variant="secondary" className="text-xs">
              {role}
            </Badge>
          ))}
        </div>
      </div>

      {/* Get Involved */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Get Involved
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {GET_INVOLVED.map(({ label, href }) => (
            <Link key={href} href={href}>
              <Card className="border border-border bg-card hover:border-aurora-teal/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="font-display font-semibold text-sm">{label}</span>
                  <span className="text-muted-foreground text-sm">→</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
