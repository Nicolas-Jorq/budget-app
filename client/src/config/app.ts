/**
 * @fileoverview Application Configuration
 *
 * Centralized configuration for app-wide constants.
 * Single source of truth for version, feature flags, and environment settings.
 *
 * @module config/app
 */

export const APP_CONFIG = {
  /** Application version - update on each release */
  version: '1.8.0',

  /** Application name */
  name: 'Budget App',

  /** API configuration */
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    timeout: 30000,
  },

  /** Feature flags */
  features: {
    /** Enable React Query devtools in development */
    queryDevtools: import.meta.env.DEV,
  },

  /** Stale times for React Query (in milliseconds) */
  queryStaleTime: {
    /** Data that rarely changes (categories, user settings) */
    static: 5 * 60 * 1000, // 5 minutes
    /** Data that changes occasionally (budgets, goals) */
    standard: 1 * 60 * 1000, // 1 minute
    /** Data that changes frequently (transactions, dashboard) */
    dynamic: 30 * 1000, // 30 seconds
  },
} as const

export type AppConfig = typeof APP_CONFIG
