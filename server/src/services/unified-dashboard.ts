/**
 * @fileoverview Unified Dashboard Service
 *
 * Aggregates data from all enabled modules (Finance, Health, Tasks, Life Goals)
 * to provide a single unified dashboard view.
 *
 * Only fetches data from modules that the user has enabled.
 *
 * @module services/unified-dashboard
 */

import { prisma } from '../lib/prisma.js'
import { ModuleType } from '@prisma/client'
import { createLogger } from '../lib/logger.js'
import { dashboardService } from './dashboard.js'
import { budgetAlertsService } from './budget-alerts.js'
import { notificationsService } from './notifications.js'

const logger = createLogger('unified-dashboard')

/**
 * Unified dashboard summary interface
 */
interface UnifiedDashboardSummary {
  // User info
  user: {
    name: string
    enabledModules: ModuleType[]
  }

  // Notifications
  notifications: {
    unreadCount: number
  }

  // Finance module (always enabled)
  finance: {
    totalBudget: number
    totalSpent: number
    totalIncome: number
    totalExpenses: number
    budgetAlerts: {
      healthy: number
      warning: number
      critical: number
      exceeded: number
    }
    savingsProgress: number // percentage of total savings goals
    recentTransactions: number
  }

  // Health module (if enabled)
  health?: {
    workoutsThisWeek: number
    currentWeight?: number
    caloriesConsumedToday: number
    waterIntakeToday: number
    sleepLastNight?: number
    activeGoals: number
  }

  // Tasks module (if enabled)
  tasks?: {
    totalTasks: number
    completedToday: number
    overdueCount: number
    dueSoon: number // due in next 7 days
    projectCount: number
  }

  // Life Goals module (if enabled)
  lifeGoals?: {
    totalGoals: number
    inProgress: number
    completedThisYear: number
    milestonesCompleted: number
  }
}

/**
 * Get user's enabled modules
 */
async function getEnabledModules(userId: string): Promise<ModuleType[]> {
  const modules = await prisma.userModule.findMany({
    where: { userId },
    select: { module: true },
  })
  // FINANCE is always enabled
  const enabled = modules.map((m) => m.module)
  if (!enabled.includes('FINANCE')) {
    enabled.push('FINANCE')
  }
  return enabled
}

/**
 * Get finance module summary
 */
async function getFinanceSummary(userId: string) {
  // Get basic stats
  const stats = await dashboardService.getStats(userId)

  // Get budget alerts summary
  const budgetAlerts = await budgetAlertsService.getBudgetAlertSummary(userId)

  // Get savings goals progress
  const savingsGoals = await prisma.savingsGoal.findMany({
    where: { userId },
    select: { targetAmount: true, currentAmount: true },
  })

  const totalTarget = savingsGoals.reduce((sum, g) => sum + Number(g.targetAmount), 0)
  const totalCurrent = savingsGoals.reduce((sum, g) => sum + Number(g.currentAmount), 0)
  const savingsProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0

  // Get recent transactions count (last 7 days)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const recentTransactions = await prisma.transaction.count({
    where: {
      userId,
      date: { gte: weekAgo },
    },
  })

  return {
    totalBudget: stats.totalBudget,
    totalSpent: stats.totalSpent,
    totalIncome: stats.totalIncome,
    totalExpenses: stats.totalExpenses,
    budgetAlerts: {
      healthy: budgetAlerts.healthy,
      warning: budgetAlerts.warning,
      critical: budgetAlerts.critical,
      exceeded: budgetAlerts.exceeded,
    },
    savingsProgress,
    recentTransactions,
  }
}

/**
 * Get health module summary
 */
async function getHealthSummary(userId: string) {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

  // Workouts this week
  const workoutsThisWeek = await prisma.workout.count({
    where: {
      userId,
      date: { gte: startOfWeek },
    },
  })

  // Latest weight
  const latestWeight = await prisma.weightLog.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
    select: { weight: true },
  })

  // Calories consumed today
  const mealsToday = await prisma.meal.findMany({
    where: {
      userId,
      date: { gte: startOfDay },
    },
    select: { calories: true },
  })
  const caloriesConsumedToday = mealsToday.reduce((sum, m) => sum + (m.calories || 0), 0)

  // Water intake today
  const waterToday = await prisma.waterLog.aggregate({
    where: {
      userId,
      date: { gte: startOfDay },
    },
    _sum: { amount: true },
  })
  const waterIntakeToday = waterToday._sum.amount || 0

  // Last night's sleep
  const lastSleep = await prisma.sleepLog.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
    select: { duration: true },
  })

  // Active health goals
  const activeGoals = await prisma.healthGoal.count({
    where: {
      userId,
      isCompleted: false,
    },
  })

  return {
    workoutsThisWeek,
    currentWeight: latestWeight ? Number(latestWeight.weight) : undefined,
    caloriesConsumedToday,
    waterIntakeToday,
    sleepLastNight: lastSleep?.duration,
    activeGoals,
  }
}

/**
 * Get tasks module summary
 */
async function getTasksSummary(userId: string) {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekFromNow = new Date(startOfDay)
  weekFromNow.setDate(weekFromNow.getDate() + 7)

  // Total active tasks
  const totalTasks = await prisma.task.count({
    where: {
      userId,
      status: { not: 'DONE' },
      parentId: null, // Only top-level tasks
    },
  })

  // Completed today
  const completedToday = await prisma.task.count({
    where: {
      userId,
      status: 'DONE',
      completedAt: { gte: startOfDay },
    },
  })

  // Overdue tasks
  const overdueCount = await prisma.task.count({
    where: {
      userId,
      status: { not: 'DONE' },
      dueDate: { lt: startOfDay },
    },
  })

  // Due in next 7 days
  const dueSoon = await prisma.task.count({
    where: {
      userId,
      status: { not: 'DONE' },
      dueDate: {
        gte: startOfDay,
        lt: weekFromNow,
      },
    },
  })

  // Project count
  const projectCount = await prisma.project.count({
    where: {
      userId,
      isArchived: false,
    },
  })

  return {
    totalTasks,
    completedToday,
    overdueCount,
    dueSoon,
    projectCount,
  }
}

/**
 * Get life goals module summary
 */
async function getLifeGoalsSummary(userId: string) {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1)

  // Total goals
  const totalGoals = await prisma.lifeGoal.count({
    where: { userId },
  })

  // In progress
  const inProgress = await prisma.lifeGoal.count({
    where: {
      userId,
      status: 'IN_PROGRESS',
    },
  })

  // Completed this year
  const completedThisYear = await prisma.lifeGoal.count({
    where: {
      userId,
      status: 'COMPLETED',
      completedAt: { gte: startOfYear },
    },
  })

  // Milestones completed
  const milestonesCompleted = await prisma.lifeMilestone.count({
    where: {
      goal: { userId },
      isCompleted: true,
    },
  })

  return {
    totalGoals,
    inProgress,
    completedThisYear,
    milestonesCompleted,
  }
}

/**
 * Get unified dashboard summary for a user
 */
export async function getUnifiedDashboard(userId: string): Promise<UnifiedDashboardSummary> {
  logger.debug('Fetching unified dashboard', { userId })

  // Get user info and enabled modules
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })

  const enabledModules = await getEnabledModules(userId)

  // Get unread notifications count
  const unreadCount = await notificationsService.getNotificationCount(userId, true)

  // Always get finance summary (core module)
  const finance = await getFinanceSummary(userId)

  // Build the response
  const summary: UnifiedDashboardSummary = {
    user: {
      name: user?.name || 'User',
      enabledModules,
    },
    notifications: {
      unreadCount,
    },
    finance,
  }

  // Add optional module summaries based on what's enabled
  if (enabledModules.includes('HEALTH')) {
    summary.health = await getHealthSummary(userId)
  }

  if (enabledModules.includes('TASKS')) {
    summary.tasks = await getTasksSummary(userId)
  }

  if (enabledModules.includes('LIFE_GOALS')) {
    summary.lifeGoals = await getLifeGoalsSummary(userId)
  }

  logger.debug('Unified dashboard fetched', {
    userId,
    enabledModules: enabledModules.length,
  })

  return summary
}

/**
 * Get quick stats for sidebar/header display
 */
export async function getQuickStats(userId: string) {
  const enabledModules = await getEnabledModules(userId)

  const stats: Record<string, unknown> = {
    notifications: await notificationsService.getNotificationCount(userId, true),
  }

  // Finance quick stats
  const budgetAlerts = await budgetAlertsService.getBudgetAlertSummary(userId)
  stats.budgetsAtRisk = budgetAlerts.warning + budgetAlerts.critical + budgetAlerts.exceeded

  // Tasks quick stats
  if (enabledModules.includes('TASKS')) {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    stats.overdueTasks = await prisma.task.count({
      where: {
        userId,
        status: { not: 'DONE' },
        dueDate: { lt: startOfDay },
      },
    })
  }

  return stats
}

export const unifiedDashboardService = {
  getUnifiedDashboard,
  getQuickStats,
  getEnabledModules,
}
