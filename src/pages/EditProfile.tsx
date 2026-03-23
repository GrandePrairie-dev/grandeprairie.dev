import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Profile } from "@/lib/types";
import { ROLES, ROLE_LABELS, parseJsonArray, parseJsonObject } from "@/lib/types";

export default function EditProfile() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: [`/api/profiles/${params.id}`],
  });

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState("member");
  const [skillsText, setSkillsText] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setTitle(profile.title ?? "");
      setBio(profile.bio ?? "");
      setRole(profile.role ?? "member");
      setSkillsText(parseJsonArray(profile.skills).join(", "));
      const links = parseJsonObject(profile.links);
      setGithub(links.github ?? "");
      setLinkedin(links.linkedin ?? "");
      setWebsite(links.website ?? "");
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/profiles/${params.id}/edit`, {
        name,
        title: title || null,
        bio: bio || null,
        role,
        skills: skillsText.split(",").map(s => s.trim()).filter(Boolean),
        links: {
          ...(github ? { github } : {}),
          ...(linkedin ? { linkedin } : {}),
          ...(website ? { website } : {}),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profiles/${params.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profile updated!" });
      navigate(`/people/${params.id}`);
    },
  });

  // Only owner can edit
  if (user && user.id !== Number(params.id)) {
    return (
      <div className="p-4 md:p-6 max-w-3xl">
        <p className="text-muted-foreground">You can only edit your own profile.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-4 md:p-6 max-w-3xl space-y-4"><Skeleton className="h-8 w-32" /><Skeleton className="h-60 w-full" /></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      <Link href={`/people/${params.id}`}>
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to profile
        </span>
      </Link>

      <h1 className="text-xl font-display font-bold">Edit Profile</h1>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Full-Stack Developer" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bio</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell the community about yourself..." className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills (comma-separated)</label>
              <Input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="React, Python, Welding..." className="mt-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">GitHub</label>
                <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="username" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">LinkedIn</label>
                <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="username" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Website</label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yoursite.com" className="mt-1" />
              </div>
            </div>
            <Button type="submit" disabled={mutation.isPending || !name.trim()}>
              {mutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
