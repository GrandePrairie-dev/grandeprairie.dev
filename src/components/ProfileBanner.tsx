import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { parseJsonArray, parseJsonObject } from "@/lib/types";

export function ProfileBanner() {
  const { user, isLoggedIn } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!isLoggedIn || !user || dismissed) return null;

  const skills = parseJsonArray(user.skills);
  const links = parseJsonObject(user.links);
  const isIncomplete = !user.title || !user.bio || skills.length === 0 || Object.keys(links).length === 0;

  if (!isIncomplete) return null;

  return (
    <div className="mx-4 mt-4 p-3 rounded-md bg-prairie-amber/10 border border-prairie-amber/20 flex items-center justify-between gap-3">
      <p className="text-sm text-prairie-amber">
        <Link href={`/people/${user.id}/edit`}>
          <span className="font-semibold underline cursor-pointer">Complete your profile</span>
        </Link>
        {" — add your skills, bio, and links so the community can find you."}
      </p>
      <Button variant="ghost" size="icon" className="shrink-0 h-6 w-6" onClick={() => setDismissed(true)}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
