/**
 * @fileoverview AI Insights Routes
 *
 * API routes for AI-powered financial insights.
 * All routes require authentication.
 *
 * @module routes/ai-insights
 */

import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import * as controller from '../controllers/ai-insights.js'

const router = Router()

// All AI insights routes require authentication
router.use(authenticate)

/**
 * GET /api/finance/insights/full-analysis
 * Get comprehensive AI analysis including patterns, goals, anomalies, and recommendations
 */
router.get('/full-analysis', controller.getFullAnalysis)

/**
 * GET /api/finance/insights/summary
 * Get quick spending summary (lighter weight)
 */
router.get('/summary', controller.getQuickSummary)

/**
 * GET /api/finance/insights/spending-patterns
 * Get detailed spending pattern analysis
 */
router.get('/spending-patterns', controller.getSpendingPatterns)

/**
 * GET /api/finance/insights/anomalies
 * Get detected spending anomalies
 */
router.get('/anomalies', controller.getAnomalies)

/**
 * GET /api/finance/insights/goal-predictions
 * Get AI predictions for savings goals
 */
router.get('/goal-predictions', controller.getGoalPredictions)

export default router
