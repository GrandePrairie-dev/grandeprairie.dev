import { ShieldCheck } from "lucide-react";

const PRINCIPLES = [
  ["Be useful", "Share practical context, ask clear questions, and make room for people at different experience levels."],
  ["Be local without gatekeeping", "Grande Prairie and the Peace Region are the focus. New residents, students, remote contributors, and curious neighbours are welcome."],
  ["Disagree with the work, not the person", "Challenge ideas with evidence. Harassment, threats, discrimination, doxxing, and targeted hostility are not permitted."],
  ["Protect trust", "Do not post private information, impersonate others, manipulate votes, or use the community primarily for spam and unsolicited promotion."],
  ["Report problems", "Use the report action on community content. Moderators prioritize safety concerns and document the outcome in the moderation queue."],
] as const;

export default function Conduct() {
  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <header className="border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-aurora-teal" />
          <h1 className="text-2xl font-display font-bold">Community conduct</h1>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          GP.dev is a working commons for local builders. Participation should make the community safer, more useful, and easier to enter.
        </p>
      </header>
      <div className="divide-y divide-border">
        {PRINCIPLES.map(([title, body]) => (
          <section key={title} className="py-5">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </section>
        ))}
      </div>
      <p className="border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
        Moderators may remove content, limit participation, or suspend accounts when needed to protect people or platform integrity. Reports made in good faith do not reduce reputation.
      </p>
    </div>
  );
}
