/**
 * @fileoverview Notification Routes
 *
 * API routes for notification management and budget alerts.
 * All routes require authentication.
 *
 * @module routes/notifications
 */

import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import * as controller from '../controllers/notifications.js'

const router = Router()

// All notification routes require authentication
router.use(authenticate)

/**
 * GET /api/notifications
 * Get all notifications for the user
 * Query params: limit, offset, includeRead
 */
router.get('/', controller.getNotifications)

/**
 * GET /api/notifications/count
 * Get unread notification count
 */
router.get('/count', controller.getNotificationCount)

/**
 * GET /api/notifications/budget-summary
 * Get budget alert summary (counts by status)
 */
router.get('/budget-summary', controller.getBudgetAlertSummary)

/**
 * POST /api/notifications/check-budgets
 * Manually trigger budget alert check
 */
router.post('/check-budgets', controller.checkBudgetAlerts)

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all', controller.markAllAsRead)

/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.patch('/:id/read', controller.markAsRead)

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', controller.deleteNotification)

export default router
