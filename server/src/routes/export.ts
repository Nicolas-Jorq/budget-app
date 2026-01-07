/**
 * @fileoverview Export Routes
 *
 * API routes for data export functionality.
 * All routes require authentication.
 *
 * @module routes/export
 */

import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import * as controller from '../controllers/export.js'

const router = Router()

// All export routes require authentication
router.use(authenticate)

/**
 * GET /api/export
 * Get export options and documentation
 */
router.get('/', controller.getExportOptions)

/**
 * GET /api/export/:dataType
 * Export data in specified format
 * Query params: format (csv|json), startDate, endDate
 */
router.get('/:dataType', controller.exportData)

export default router
