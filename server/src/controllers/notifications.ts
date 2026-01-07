/**
 * @fileoverview Notification Controller
 *
 * Handles HTTP requests for notification management.
 *
 * @module controllers/notifications
 */

import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { notificationsService } from '../services/notifications.js'
import { budgetAlertsService } from '../services/budget-alerts.js'
import { HttpStatus } from '../utils/errors.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('notifications-controller')

/**
 * Get all notifications for the authenticated user
 * GET /api/notifications
 */
export async function getNotifications(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0
    const includeRead = req.query.includeRead !== 'false'

    const notifications = await notificationsService.getNotifications(userId, {
      limit,
      offset,
      includeRead,
    })

    res.json(notifications)
  } catch (error) {
    logger.error('Failed to get notifications', { error })
    next(error)
  }
}

/**
 * Get unread notification count
 * GET /api/notifications/count
 */
export async function getNotificationCount(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!
    const count = await notificationsService.getNotificationCount(userId, true)

    res.json({ count })
  } catch (error) {
    logger.error('Failed to get notification count', { error })
    next(error)
  }
}

/**
 * Mark a notification as read
 * PATCH /api/notifications/:id/read
 */
export async function markAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!
    const { id } = req.params

    const notification = await notificationsService.markAsRead(id, userId)

    res.json(notification)
  } catch (error) {
    logger.error('Failed to mark notification as read', { error })
    next(error)
  }
}

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
export async function markAllAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!

    const result = await notificationsService.markAllAsRead(userId)

    res.json({ success: true, count: result.count })
  } catch (error) {
    logger.error('Failed to mark all notifications as read', { error })
    next(error)
  }
}

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
export async function deleteNotification(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!
    const { id } = req.params

    await notificationsService.deleteNotification(id, userId)

    res.status(HttpStatus.NO_CONTENT).send()
  } catch (error) {
    logger.error('Failed to delete notification', { error })
    next(error)
  }
}

/**
 * Get budget alert summary
 * GET /api/notifications/budget-summary
 */
export async function getBudgetAlertSummary(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!

    const summary = await budgetAlertsService.getBudgetAlertSummary(userId)

    res.json(summary)
  } catch (error) {
    logger.error('Failed to get budget alert summary', { error })
    next(error)
  }
}

/**
 * Manually trigger budget alert check
 * POST /api/notifications/check-budgets
 */
export async function checkBudgetAlerts(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!

    await budgetAlertsService.checkAllBudgetAlerts(userId)
    const summary = await budgetAlertsService.getBudgetAlertSummary(userId)

    res.json({ success: true, summary })
  } catch (error) {
    logger.error('Failed to check budget alerts', { error })
    next(error)
  }
}

export const notificationController = {
  getNotifications,
  getNotificationCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getBudgetAlertSummary,
  checkBudgetAlerts,
}
