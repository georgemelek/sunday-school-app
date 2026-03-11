import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Show cached data immediately; re-fetch in background only if older than 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused cache for 10 minutes before garbage-collecting
      gcTime: 10 * 60 * 1000,
      // Don't retry on error by default — surfaces problems clearly during dev
      retry: 1,
      // Refetch when app comes back from background, but NOT on every tab focus
      refetchOnWindowFocus: false,
    },
  },
})
