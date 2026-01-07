/**
 * @fileoverview Unified Dashboard Controller
 *
 * Handles HTTP requests for the unified cross-module dashboard.
 *
 * @module controllers/unified-dashboard
 */

import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { unifiedDashboardService } from '../services/unified-dashboard.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('unified-dashboard-controller')

/**
 * Get unified dashboard summary
 * GET /api/dashboard/unified
 */
export async function getUnifiedDashboard(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!
    const summary = await unifiedDashboardService.getUnifiedDashboard(userId)
    res.json(summary)
  } catch (error) {
    logger.error('Failed to get unified dashboard', { error })
    next(error)
  }
}

/**
 * Get quick stats for header/sidebar
 * GET /api/dashboard/quick-stats
 */
export async function getQuickStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!
    const stats = await unifiedDashboardService.getQuickStats(userId)
    res.json(stats)
  } catch (error) {
    logger.error('Failed to get quick stats', { error })
    next(error)
  }
}

/**
 * Get user's enabled modules
 * GET /api/dashboard/modules
 */
export async function getEnabledModules(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!
    const modules = await unifiedDashboardService.getEnabledModules(userId)
    res.json({ modules })
  } catch (error) {
    logger.error('Failed to get enabled modules', { error })
    next(error)
  }
}

export const unifiedDashboardController = {
  getUnifiedDashboard,
  getQuickStats,
  getEnabledModules,
}
