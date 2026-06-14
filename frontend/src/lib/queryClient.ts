import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,      // 30s — serves fresh data without refetch
      gcTime: 5 * 60_000,     // 5min — keep unused queries in memory cache
    },
  },
});

