/**
 * @fileoverview Dashboard Controller for the Budget App.
 *
 * This controller handles all dashboard-related HTTP endpoints, providing
 * aggregated financial data and visualizations for the user interface.
 * It serves as the primary data source for the main dashboard view.
 *
 * Endpoints provided:
 * - GET /api/dashboard/stats - Retrieve summary statistics
 * - GET /api/dashboard/chart-data - Retrieve data for charts and visualizations
 *
 * All endpoints require authentication and return data scoped to the
 * authenticated user.
 *
 * @module controllers/dashboard
 * @see {@link dashboardService} - The service layer handling business logic
 */

import { Response } from 'express'
import { dashboardService } from '../services/dashboard.js'
import { AuthRequest } from '../middleware/auth.js'
import { AppError, isAppError } from '../utils/errors.js'

/**
 * Dashboard controller object containing all dashboard-related request handlers.
 *
 * @namespace dashboardController
 */
export const dashboardController = {
  /**
   * Retrieves aggregated dashboard statistics for the authenticated user.
   *
   * Returns summary metrics including total budget amounts, spending totals,
   * income and expense aggregates, and counts of budgets and transactions.
   *
   * @param {AuthRequest} req - Express request object with authenticated user ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with dashboard statistics
   *
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 500 - If database query or computation fails
   *
   * @example
   * // Request
   * GET /api/dashboard/stats
   * Authorization: Bearer <token>
   *
   * // Success Response (200 OK)
   * {
   *   "totalBudget": 5000,
   *   "totalSpent": 2350,
   *   "totalIncome": 8000,
   *   "totalExpenses": 2350,
   *   "budgetCount": 5,
   *   "transactionCount": 45
   * }
   *
   * // Error Response (500 Internal Server Error)
   * {
   *   "message": "Failed to fetch dashboard stats"
   * }
   */
  async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await dashboardService.getStats(req.userId!)
      res.json(stats)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const appError = AppError.internal('Failed to fetch dashboard stats')
      res.status(appError.statusCode).json({ message: appError.message })
    }
  },

  /**
   * Retrieves chart and visualization data for the authenticated user.
   *
   * Returns comprehensive data formatted for dashboard charts including:
   * - Spending breakdown by category (pie chart data)
   * - Monthly income vs expenses comparison (last 6 months)
   * - Daily spending for current month (line/bar chart)
   * - Budget progress for all active budgets
   * - Recent transactions (last 5)
   *
   * @param {AuthRequest} req - Express request object with authenticated user ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON response with chart data
   *
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 500 - If database query or computation fails
   *
   * @example
   * // Request
   * GET /api/dashboard/chart-data
   * Authorization: Bearer <token>
   *
   * // Success Response (200 OK)
   * {
   *   "spendingByCategory": [
   *     { "category": "Food", "amount": 450, "percentage": 30 },
   *     { "category": "Transport", "amount": 200, "percentage": 13 }
   *   ],
   *   "monthlyComparison": [
   *     { "month": "Aug '24", "income": 5000, "expenses": 3500 },
   *     { "month": "Sep '24", "income": 5200, "expenses": 3800 }
   *   ],
   *   "dailySpending": [
   *     { "date": "2024-10-01", "amount": 45 },
   *     { "date": "2024-10-02", "amount": 120 }
   *   ],
   *   "budgetProgress": [
   *     { "id": "abc123", "name": "Groceries", "category": "Food", "spent": 350, "limit": 500, "percentage": 70 }
   *   ],
   *   "recentTransactions": [
   *     { "id": "txn1", "description": "Grocery store", "amount": 85, "type": "expense", "category": "Food", "date": "2024-10-15T10:30:00Z" }
   *   ]
   * }
   *
   * // Error Response (500 Internal Server Error)
   * {
   *   "message": "Failed to fetch chart data"
   * }
   */
  async getChartData(req: AuthRequest, res: Response) {
    try {
      const chartData = await dashboardService.getChartData(req.userId!)
      res.json(chartData)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const appError = AppError.internal('Failed to fetch chart data')
      res.status(appError.statusCode).json({ message: appError.message })
    }
  },
}
