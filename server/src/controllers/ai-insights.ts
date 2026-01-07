/**
 * @fileoverview AI Insights Controller
 *
 * Handles HTTP requests for AI-powered financial insights.
 *
 * @module controllers/ai-insights
 */

import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { aiInsightsService } from '../services/ai-insights.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('ai-insights-controller')

/**
 * Get full AI-powered financial analysis
 * GET /api/finance/insights/full-analysis
 */
export async function getFullAnalysis(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!

    logger.debug('Fetching full analysis', { userId })

    const analysis = await aiInsightsService.getFullAnalysis(userId)

    res.json(analysis)
  } catch (error) {
    logger.error('Failed to get full analysis', { error })
    next(error)
  }
}

/**
 * Get quick spending summary
 * GET /api/finance/insights/summary
 */
export async function getQuickSummary(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!

    logger.debug('Fetching quick summary', { userId })

    const summary = await aiInsightsService.getQuickSummary(userId)

    if (!summary) {
      res.json({
        message: 'No spending data available for analysis',
        summary: null,
      })
      return
    }

    res.json({ summary })
  } catch (error) {
    logger.error('Failed to get quick summary', { error })
    next(error)
  }
}

/**
 * Get spending patterns analysis
 * GET /api/finance/insights/spending-patterns
 */
export async function getSpendingPatterns(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!

    logger.debug('Fetching spending patterns', { userId })

    const patterns = await aiInsightsService.analyzeSpendingPatterns(userId)

    if (!patterns) {
      res.json({
        message: 'No spending data available for pattern analysis',
        patterns: null,
      })
      return
    }

    res.json({ patterns })
  } catch (error) {
    logger.error('Failed to get spending patterns', { error })
    next(error)
  }
}

/**
 * Get detected spending anomalies
 * GET /api/finance/insights/anomalies
 */
export async function getAnomalies(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!

    logger.debug('Fetching anomalies', { userId })

    const anomalies = await aiInsightsService.detectAnomalies(userId)

    res.json({
      count: anomalies.length,
      anomalies,
    })
  } catch (error) {
    logger.error('Failed to get anomalies', { error })
    next(error)
  }
}

/**
 * Get goal predictions
 * GET /api/finance/insights/goal-predictions
 */
export async function getGoalPredictions(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!

    logger.debug('Fetching goal predictions', { userId })

    const predictions = await aiInsightsService.predictGoals(userId)

    const summary = {
      totalGoals: predictions.length,
      goalsOnTrack: predictions.filter(g => g.onTrack === true).length,
      goalsBehind: predictions.filter(g => g.onTrack === false).length,
    }

    res.json({
      summary,
      predictions,
    })
  } catch (error) {
    logger.error('Failed to get goal predictions', { error })
    next(error)
  }
}

export const aiInsightsController = {
  getFullAnalysis,
  getQuickSummary,
  getSpendingPatterns,
  getAnomalies,
  getGoalPredictions,
}
