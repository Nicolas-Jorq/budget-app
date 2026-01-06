/**
 * @fileoverview Query Key Factory
 *
 * Centralized query key management for React Query.
 * Provides type-safe, hierarchical cache keys for all data fetching.
 *
 * Pattern: Each domain has keys for:
 * - all: Base key for the domain
 * - lists: All list queries (for bulk invalidation)
 * - list(filters): Specific list with filters
 * - details: All detail queries
 * - detail(id): Specific item by ID
 *
 * @module lib/queryKeys
 */

// ===========================================
// Life Goals Keys
// ===========================================

export const goalKeys = {
  all: ['goals'] as const,
  lists: () => [...goalKeys.all, 'list'] as const,
  list: (filters?: { category?: string; status?: string; includeCompleted?: boolean }) =>
    [...goalKeys.lists(), filters] as const,
  details: () => [...goalKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalKeys.details(), id] as const,
  dashboard: () => [...goalKeys.all, 'dashboard'] as const,
}

export const milestoneKeys = {
  all: ['milestones'] as const,
  byGoal: (goalId: string) => [...milestoneKeys.all, 'goal', goalId] as const,
}

// ===========================================
// Finance Keys
// ===========================================

export const budgetKeys = {
  all: ['budgets'] as const,
  lists: () => [...budgetKeys.all, 'list'] as const,
  list: (filters?: { month?: string; year?: number }) =>
    [...budgetKeys.lists(), filters] as const,
  details: () => [...budgetKeys.all, 'detail'] as const,
  detail: (id: string) => [...budgetKeys.details(), id] as const,
}

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters?: { budgetId?: string; type?: string; startDate?: string; endDate?: string }) =>
    [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
}

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
}

// ===========================================
// Health Keys
// ===========================================

export const healthKeys = {
  all: ['health'] as const,
  dashboard: () => [...healthKeys.all, 'dashboard'] as const,
  workouts: {
    all: () => [...healthKeys.all, 'workouts'] as const,
    list: (filters?: { startDate?: string; endDate?: string }) =>
      [...healthKeys.workouts.all(), 'list', filters] as const,
  },
  weight: {
    all: () => [...healthKeys.all, 'weight'] as const,
    list: (filters?: { startDate?: string; endDate?: string }) =>
      [...healthKeys.weight.all(), 'list', filters] as const,
  },
  nutrition: {
    all: () => [...healthKeys.all, 'nutrition'] as const,
    list: (filters?: { date?: string }) =>
      [...healthKeys.nutrition.all(), 'list', filters] as const,
  },
  sleep: {
    all: () => [...healthKeys.all, 'sleep'] as const,
    list: (filters?: { startDate?: string; endDate?: string }) =>
      [...healthKeys.sleep.all(), 'list', filters] as const,
  },
}

// ===========================================
// Tasks Keys
// ===========================================

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: { projectId?: string; status?: string; priority?: string }) =>
    [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  dashboard: () => [...taskKeys.all, 'dashboard'] as const,
}

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: () => [...projectKeys.lists()] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
}

// ===========================================
// Module Keys
// ===========================================

export const moduleKeys = {
  all: ['modules'] as const,
  enabled: () => [...moduleKeys.all, 'enabled'] as const,
}
