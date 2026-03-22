import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/lib/types";
import { parseJsonArray } from "@/lib/types";

interface PersonCardProps {
  profile: Profile;
  featured?: boolean;
}

export function PersonCard({ profile, featured }: PersonCardProps) {
  const skills = parseJsonArray(profile.skills);
  const content = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-md bg-boreal-spruce flex items-center justify-center text-boreal-spruce-light font-bold text-sm shrink-0">
        {profile.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm">{profile.name}</div>
        <div className="text-xs text-muted-foreground truncate">{profile.title || profile.role}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="outline" className="text-[10px]">{skill}</Badge>
          ))}
          {skills.length > 4 && (
            <Badge variant="outline" className="text-[10px]">+{skills.length - 4}</Badge>
          )}
        </div>
      </div>
      <Badge variant="secondary" className="text-[10px] shrink-0 capitalize">{profile.role}</Badge>
    </div>
  );

  if (featured) {
    return (
      <Link href={`/people/${profile.id}`}>
        <Card className="cursor-pointer hover:border-boreal-spruce-light/50 transition-colors">
          <CardContent className="p-4">{content}</CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/people/${profile.id}`}>
      <div className="p-4 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors">
        {content}
      </div>
    </Link>
  );
}
