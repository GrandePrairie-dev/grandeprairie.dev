import { QueryClient } from "@tanstack/react-query";

async function apiRequest(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`${method} ${url}: ${res.status} ${res.statusText}`);
  }
  return res;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const res = await apiRequest("GET", queryKey[0] as string);
        return res.json();
      },
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export { apiRequest };
