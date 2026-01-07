/**
 * @fileoverview Unified Dashboard Routes
 *
 * API routes for the cross-module unified dashboard.
 * All routes require authentication.
 *
 * @module routes/unified-dashboard
 */

import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import * as controller from '../controllers/unified-dashboard.js'

const router = Router()

// All unified dashboard routes require authentication
router.use(authenticate)

/**
 * GET /api/dashboard/unified
 * Get unified cross-module dashboard summary
 */
router.get('/unified', controller.getUnifiedDashboard)

/**
 * GET /api/dashboard/quick-stats
 * Get quick stats for header/sidebar display
 */
router.get('/quick-stats', controller.getQuickStats)

/**
 * GET /api/dashboard/modules
 * Get user's enabled modules
 */
router.get('/modules', controller.getEnabledModules)

export default router
