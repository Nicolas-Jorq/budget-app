/**
 * @fileoverview Life Goals Query Hooks
 *
 * React Query hooks for life goals data fetching and mutations.
 * Provides automatic caching, background refetching, and optimistic updates.
 *
 * @module hooks/queries/useGoals
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { goalKeys } from '../../lib/queryKeys'
import { APP_CONFIG } from '../../config/app'

// ===========================================
// Types
// ===========================================

type LifeGoalCategory = 'CAREER' | 'PERSONAL' | 'TRAVEL' | 'LEARNING' | 'RELATIONSHIPS' | 'HEALTH' | 'CREATIVE' | 'ADVENTURE' | 'OTHER'
type LifeGoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'ABANDONED'

interface Milestone {
  id: string
  title: string
  description: string | null
  isCompleted: boolean
  completedAt: string | null
  targetDate: string | null
  sortOrder: number
}

interface LifeGoal {
  id: string
  title: string
  description: string | null
  category: LifeGoalCategory
  status: LifeGoalStatus
  targetDate: string | null
  priority: number
  notes: string | null
  milestones: Milestone[]
  _count?: { milestones: number }
}

interface DashboardStats {
  totalGoals: number
  inProgressGoals: number
  completedGoals: number
  goalsByCategory: Record<string, number>
  upcomingMilestones: number
  recentlyCompleted: number
}

interface GoalFilters {
  category?: LifeGoalCategory
  status?: LifeGoalStatus
  includeCompleted?: boolean
}

interface CreateGoalInput {
  title: string
  description?: string
  category: LifeGoalCategory
  targetDate?: string
  priority?: number
}

interface UpdateGoalInput {
  title?: string
  description?: string
  category?: LifeGoalCategory
  status?: LifeGoalStatus
  targetDate?: string | null
  priority?: number
  notes?: string | null
}

interface CreateMilestoneInput {
  title: string
  description?: string
  targetDate?: string
}

interface UpdateMilestoneInput {
  title?: string
  description?: string
  targetDate?: string | null
  isCompleted?: boolean
}

// ===========================================
// Query Hooks
// ===========================================

/**
 * Fetch all goals with optional filters
 */
export function useGoals(filters?: GoalFilters) {
  return useQuery({
    queryKey: goalKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.category) params.append('category', filters.category)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.includeCompleted) params.append('includeCompleted', 'true')
      const response = await api.get<LifeGoal[]>(`/life-goals?${params.toString()}`)
      return response.data
    },
    staleTime: APP_CONFIG.queryStaleTime.standard,
  })
}

/**
 * Fetch a single goal by ID
 */
export function useGoal(id: string | undefined) {
  return useQuery({
    queryKey: goalKeys.detail(id!),
    queryFn: async () => {
      const response = await api.get<LifeGoal>(`/life-goals/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

/**
 * Fetch dashboard statistics
 */
export function useGoalsDashboard() {
  return useQuery({
    queryKey: goalKeys.dashboard(),
    queryFn: async () => {
      const response = await api.get<DashboardStats>('/life-goals/dashboard')
      return response.data
    },
    staleTime: APP_CONFIG.queryStaleTime.dynamic,
  })
}

// ===========================================
// Mutation Hooks
// ===========================================

/**
 * Create a new goal
 */
export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateGoalInput) => {
      const response = await api.post<LifeGoal>('/life-goals', data)
      return response.data
    },
    onSuccess: () => {
      // Invalidate all goal lists and dashboard
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalKeys.dashboard() })
    },
  })
}

/**
 * Update an existing goal
 */
export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateGoalInput }) => {
      const response = await api.put<LifeGoal>(`/life-goals/${id}`, data)
      return response.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: goalKeys.dashboard() })
    },
  })
}

/**
 * Delete a goal
 */
export function useDeleteGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/life-goals/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalKeys.dashboard() })
    },
  })
}

// ===========================================
// Milestone Mutation Hooks
// ===========================================

/**
 * Create a milestone for a goal
 */
export function useCreateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ goalId, data }: { goalId: string; data: CreateMilestoneInput }) => {
      const response = await api.post(`/life-goals/${goalId}/milestones`, data)
      return response.data
    },
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goalId) })
      queryClient.invalidateQueries({ queryKey: goalKeys.dashboard() })
    },
  })
}

/**
 * Update a milestone
 */
export function useUpdateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMilestoneInput }) => {
      const response = await api.put(`/life-goals/milestones/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalKeys.details() })
      queryClient.invalidateQueries({ queryKey: goalKeys.dashboard() })
    },
  })
}

/**
 * Toggle milestone completion
 */
export function useToggleMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/life-goals/milestones/${id}/toggle`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalKeys.details() })
      queryClient.invalidateQueries({ queryKey: goalKeys.dashboard() })
    },
  })
}

/**
 * Delete a milestone
 */
export function useDeleteMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/life-goals/milestones/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalKeys.details() })
      queryClient.invalidateQueries({ queryKey: goalKeys.dashboard() })
    },
  })
}
