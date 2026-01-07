/**
 * @fileoverview Notification Service
 *
 * Manages user notifications including budget alerts, goal milestones,
 * and system notifications.
 *
 * @module services/notifications
 */

import { NotificationType } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('notifications-service')

/**
 * Notification metadata for budget alerts
 */
interface BudgetAlertMetadata extends Record<string, unknown> {
  budgetId: string
  budgetName: string
  spent: number
  amount: number
  percentage: number
}

/**
 * Notification metadata for goal milestones
 */
interface GoalMilestoneMetadata extends Record<string, unknown> {
  goalId: string
  goalName: string
  percentage: number
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    })
    logger.info('Notification created', { userId, type, notificationId: notification.id })
    return notification
  } catch (error) {
    logger.error('Failed to create notification', { error, userId, type })
    throw error
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string) {
  return prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Get all notifications for a user with pagination
 */
export async function getNotifications(
  userId: string,
  options: { limit?: number; offset?: number; includeRead?: boolean } = {}
) {
  const { limit = 50, offset = 0, includeRead = true } = options

  return prisma.notification.findMany({
    where: {
      userId,
      ...(includeRead ? {} : { isRead: false }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  })
}

/**
 * Get notification count for a user
 */
export async function getNotificationCount(userId: string, unreadOnly = true) {
  return prisma.notification.count({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
  })
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.update({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
    data: {
      isRead: true,
    },
  })
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  })
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
  return prisma.notification.delete({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
  })
}

/**
 * Delete old read notifications (cleanup)
 */
export async function cleanupOldNotifications(daysOld = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const result = await prisma.notification.deleteMany({
    where: {
      isRead: true,
      createdAt: {
        lt: cutoffDate,
      },
    },
  })

  logger.info('Cleaned up old notifications', { deleted: result.count, daysOld })
  return result.count
}

// ============================================================================
// Budget Alert Helpers
// ============================================================================

/**
 * Check if a budget alert already exists (to avoid duplicates)
 */
async function budgetAlertExists(
  userId: string,
  budgetId: string,
  type: NotificationType
): Promise<boolean> {
  // Check for existing unread alert of the same type for this budget
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      isRead: false,
      metadata: {
        path: ['budgetId'],
        equals: budgetId,
      },
    },
  })
  return !!existing
}

/**
 * Create a budget warning notification (80% spent)
 */
export async function createBudgetWarning(
  userId: string,
  metadata: BudgetAlertMetadata
) {
  // Check if alert already exists
  if (await budgetAlertExists(userId, metadata.budgetId, 'BUDGET_WARNING')) {
    return null
  }

  return createNotification(
    userId,
    'BUDGET_WARNING',
    `Budget Warning: ${metadata.budgetName}`,
    `You've spent ${metadata.percentage.toFixed(0)}% of your ${metadata.budgetName} budget ($${metadata.spent.toFixed(2)} of $${metadata.amount.toFixed(2)}).`,
    metadata
  )
}

/**
 * Create a budget critical notification (90% spent)
 */
export async function createBudgetCritical(
  userId: string,
  metadata: BudgetAlertMetadata
) {
  // Check if alert already exists
  if (await budgetAlertExists(userId, metadata.budgetId, 'BUDGET_CRITICAL')) {
    return null
  }

  return createNotification(
    userId,
    'BUDGET_CRITICAL',
    `Budget Critical: ${metadata.budgetName}`,
    `Warning! You've spent ${metadata.percentage.toFixed(0)}% of your ${metadata.budgetName} budget. Only $${(metadata.amount - metadata.spent).toFixed(2)} remaining.`,
    metadata
  )
}

/**
 * Create a budget exceeded notification (100%+ spent)
 */
export async function createBudgetExceeded(
  userId: string,
  metadata: BudgetAlertMetadata
) {
  // Check if alert already exists
  if (await budgetAlertExists(userId, metadata.budgetId, 'BUDGET_EXCEEDED')) {
    return null
  }

  const overage = metadata.spent - metadata.amount

  return createNotification(
    userId,
    'BUDGET_EXCEEDED',
    `Budget Exceeded: ${metadata.budgetName}`,
    `You've exceeded your ${metadata.budgetName} budget by $${overage.toFixed(2)} (${metadata.percentage.toFixed(0)}% of budget).`,
    metadata
  )
}

/**
 * Create a goal milestone notification
 */
export async function createGoalMilestone(
  userId: string,
  metadata: GoalMilestoneMetadata
) {
  const milestoneMessages: Record<number, string> = {
    25: 'You\'re 25% of the way to your goal!',
    50: 'Halfway there! You\'ve reached 50% of your goal!',
    75: 'Amazing progress! You\'re 75% of the way to your goal!',
    100: 'Congratulations! You\'ve reached your savings goal!',
  }

  const message = milestoneMessages[metadata.percentage] ||
    `You've reached ${metadata.percentage}% of your goal!`

  return createNotification(
    userId,
    'GOAL_MILESTONE',
    `Goal Milestone: ${metadata.goalName}`,
    message,
    metadata
  )
}

export const notificationsService = {
  createNotification,
  getUnreadNotifications,
  getNotifications,
  getNotificationCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  cleanupOldNotifications,
  createBudgetWarning,
  createBudgetCritical,
  createBudgetExceeded,
  createGoalMilestone,
}
