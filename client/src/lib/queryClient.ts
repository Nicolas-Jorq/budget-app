/**
 * @fileoverview React Query Client Configuration
 *
 * Centralized query client with default options for caching,
 * retries, and error handling.
 *
 * @module lib/queryClient
 */

import { QueryClient } from '@tanstack/react-query'
import { APP_CONFIG } from '../config/app'

/**
 * Create and configure the QueryClient instance.
 *
 * Default behaviors:
 * - Stale time: 1 minute (data considered fresh)
 * - Cache time: 5 minutes (data kept in cache)
 * - Retry: 1 attempt on failure
 * - Refetch on window focus: enabled
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: APP_CONFIG.queryStaleTime.standard,
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
