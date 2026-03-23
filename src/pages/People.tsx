import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchInput } from "@/components/SearchInput";
import { RoleFilter } from "@/components/RoleFilter";
import { PersonCard } from "@/components/PersonCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import type { Profile } from "@/lib/types";
import { ROLE_LABELS, parseJsonArray } from "@/lib/types";

const filterOptions = [
  ...Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
  { value: "mentors_available", label: "Available Mentors" },
];

export default function People() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const { data: profiles, isLoading } = useQuery<Profile[]>({ queryKey: ["/api/profiles"] });

  const filtered = (profiles ?? []).filter((p) => {
    if (role === "mentors_available") {
      if (!(p as any).mentor_available) return false;
    } else if (role !== "all" && p.role !== role) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const skills = parseJsonArray(p.skills).join(" ").toLowerCase();
      return p.name.toLowerCase().includes(q) || skills.includes(q);
    }
    return true;
  });

  // Featured profiles first
  const sorted = [...filtered].sort((a, b) => b.is_featured - a.is_featured);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <h1 className="text-xl font-display font-bold">People</h1>
      <div className="space-y-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or skill..." />
        <RoleFilter options={filterOptions} value={role} onChange={setRole} />
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-semibold mb-1">No members found</p>
          <p className="text-sm">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div>
          {sorted.map((profile) => (
            <PersonCard key={profile.id} profile={profile} featured={!!profile.is_featured} />
          ))}
        </div>
      )}
    </div>
  );
}
