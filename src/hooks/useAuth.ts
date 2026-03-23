import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Profile } from "@/lib/types";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<Profile | null>({
    queryKey: ["/api/auth/me"],
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const isLoggedIn = !!user;
  const isAdmin = !!user?.is_admin;

  const login = (returnTo?: string) => {
    const params = new URLSearchParams();
    if (returnTo) params.set("return_to", returnTo);
    window.location.href = `/api/auth/login?${params}`;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.clear();
    window.location.href = "/";
  };

  return { user, isLoggedIn, isAdmin, isLoading, login, logout };
}
