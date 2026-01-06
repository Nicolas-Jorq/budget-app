/**
 * @fileoverview Savings Goals Controller for the Budget App.
 *
 * This controller handles all HTTP endpoints related to savings goals and their
 * contributions. It provides CRUD operations for managing financial targets and
 * tracking progress towards those goals.
 *
 * Endpoints provided:
 * - GET /api/goals - List all savings goals
 * - GET /api/goals/:id - Get a specific goal
 * - POST /api/goals - Create a new goal
 * - PUT /api/goals/:id - Update a goal
 * - DELETE /api/goals/:id - Delete a goal
 * - POST /api/goals/:id/contributions - Add contribution
 * - DELETE /api/goals/contributions/:contributionId - Remove contribution
 * - GET /api/goals/:id/contributions - List contributions
 * - GET /api/goals/summary - Get goals summary for dashboard
 *
 * All endpoints require authentication and return data scoped to the
 * authenticated user.
 *
 * @module controllers/goals
 * @see {@link goalsService} - The service layer handling business logic
 */

import { Response } from 'express'
import { goalsService } from '../services/goals.js'
import { AuthRequest } from '../middleware/auth.js'
import { AppError, isAppError } from '../utils/errors.js'

/**
 * Goals controller object containing all savings goal request handlers.
 *
 * @namespace goalsController
 */
export const goalsController = {
  /**
   * Retrieves all savings goals for the authenticated user.
   *
   * Returns goals ordered by priority and creation date, including recent
   * contributions and total contribution counts for each goal.
   *
   * @param {AuthRequest} req - Express request object with authenticated user ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON array of savings goals
   *
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 500 - If database query fails
   *
   * @example
   * // Request
   * GET /api/goals
   * Authorization: Bearer <token>
   *
   * // Success Response (200 OK)
   * [
   *   {
   *     "id": "goal_abc123",
   *     "name": "Emergency Fund",
   *     "type": "EMERGENCY",
   *     "targetAmount": 10000,
   *     "currentAmount": 2500,
   *     "isCompleted": false,
   *     "contributions": [...],
   *     "_count": { "contributions": 12 }
   *   }
   * ]
   */
  async getAll(req: AuthRequest, res: Response) {
    try {
      const goals = await goalsService.getAll(req.userId!)
      res.json(goals)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const appError = AppError.internal('Failed to fetch savings goals')
      res.status(appError.statusCode).json({ message: appError.message })
    }
  },

  /**
   * Retrieves a single savings goal by ID.
   *
   * Returns the goal with all contributions and their linked transactions.
   *
   * @param {AuthRequest} req - Express request with goal ID in params
   * @param {AuthRequest} req.params.id - The unique identifier of the goal
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON object of the savings goal
   *
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 404 - If goal is not found or doesn't belong to user
   * @throws {AppError} 500 - If database query fails
   *
   * @example
   * // Request
   * GET /api/goals/goal_abc123
   * Authorization: Bearer <token>
   *
   * // Success Response (200 OK)
   * {
   *   "id": "goal_abc123",
   *   "name": "Vacation Fund",
   *   "type": "SAVINGS",
   *   "targetAmount": 5000,
   *   "currentAmount": 1500,
   *   "contributions": [
   *     { "id": "contrib_1", "amount": 500, "note": "Monthly deposit", "transaction": {...} }
   *   ]
   * }
   *
   * // Error Response (404 Not Found)
   * {
   *   "message": "Savings goal not found"
   * }
   */
  async getById(req: AuthRequest, res: Response) {
    try {
      const goal = await goalsService.getById(req.params.id, req.userId!)
      if (!goal) {
        const error = AppError.notFound('Savings goal', req.params.id)
        res.status(error.statusCode).json({ message: 'Savings goal not found' })
        return
      }
      res.json(goal)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const appError = AppError.internal('Failed to fetch savings goal')
      res.status(appError.statusCode).json({ message: appError.message })
    }
  },

  /**
   * Creates a new savings goal for the authenticated user.
   *
   * Validates required fields and creates a goal with initial zero balance.
   *
   * @param {AuthRequest} req - Express request with goal data in body
   * @param {string} req.body.name - Display name for the goal (required)
   * @param {string} req.body.type - Goal type from GoalType enum (required)
   * @param {number} req.body.targetAmount - Target amount to save (required)
   * @param {string} [req.body.deadline] - Optional ISO date string for deadline
   * @param {number} [req.body.priority] - Optional priority level (default: 1)
   * @param {string} [req.body.icon] - Optional icon identifier
   * @param {string} [req.body.color] - Optional color code
   * @param {object} [req.body.metadata] - Optional additional metadata
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON object of created goal with 201 status
   *
   * @throws {AppError} 400 - If required fields are missing or validation fails
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 500 - If database operation fails
   *
   * @example
   * // Request
   * POST /api/goals
   * Authorization: Bearer <token>
   * Content-Type: application/json
   * {
   *   "name": "New Car",
   *   "type": "SAVINGS",
   *   "targetAmount": 25000,
   *   "deadline": "2025-06-15",
   *   "priority": 2
   * }
   *
   * // Success Response (201 Created)
   * {
   *   "id": "goal_xyz789",
   *   "name": "New Car",
   *   "type": "SAVINGS",
   *   "targetAmount": 25000,
   *   "currentAmount": 0,
   *   "isCompleted": false
   * }
   *
   * // Error Response (400 Bad Request)
   * {
   *   "message": "Name, type, and targetAmount are required"
   * }
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const { name, type, targetAmount, deadline, priority, icon, color, metadata } = req.body

      if (!name || !type || targetAmount === undefined) {
        const error = AppError.validation('Name, type, and targetAmount are required', {
          missingFields: {
            name: !name,
            type: !type,
            targetAmount: targetAmount === undefined,
          },
        })
        res.status(error.statusCode).json({ message: error.message })
        return
      }

      const goal = await goalsService.create(req.userId!, {
        name,
        type,
        targetAmount,
        deadline,
        priority,
        icon,
        color,
        metadata,
      })
      res.status(201).json(goal)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to create savings goal'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json({ message })
    }
  },

  /**
   * Updates an existing savings goal.
   *
   * Only provided fields will be updated; undefined fields are preserved.
   *
   * @param {AuthRequest} req - Express request with goal ID in params and update data in body
   * @param {string} req.params.id - The unique identifier of the goal to update
   * @param {string} [req.body.name] - Updated display name
   * @param {string} [req.body.type] - Updated goal type
   * @param {number} [req.body.targetAmount] - Updated target amount
   * @param {string|null} [req.body.deadline] - Updated deadline (null to remove)
   * @param {number} [req.body.priority] - Updated priority level
   * @param {string} [req.body.icon] - Updated icon identifier
   * @param {string} [req.body.color] - Updated color code
   * @param {object} [req.body.metadata] - Updated metadata
   * @param {boolean} [req.body.isCompleted] - Manually mark as completed
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON object of updated goal
   *
   * @throws {AppError} 400 - If validation fails
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 404 - If goal is not found or doesn't belong to user
   * @throws {AppError} 500 - If database operation fails
   *
   * @example
   * // Request
   * PUT /api/goals/goal_abc123
   * Authorization: Bearer <token>
   * Content-Type: application/json
   * {
   *   "targetAmount": 30000,
   *   "deadline": "2025-12-31"
   * }
   *
   * // Success Response (200 OK)
   * {
   *   "id": "goal_abc123",
   *   "name": "New Car",
   *   "targetAmount": 30000,
   *   "deadline": "2025-12-31T00:00:00.000Z"
   * }
   */
  async update(req: AuthRequest, res: Response) {
    try {
      const goal = await goalsService.update(req.params.id, req.userId!, req.body)
      res.json(goal)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to update savings goal'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json({ message })
    }
  },

  /**
   * Deletes a savings goal and all associated contributions.
   *
   * This operation is irreversible. All contributions linked to the goal
   * will be deleted due to cascade delete.
   *
   * @param {AuthRequest} req - Express request with goal ID in params
   * @param {string} req.params.id - The unique identifier of the goal to delete
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends 204 No Content on success
   *
   * @throws {AppError} 400 - If deletion fails
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 404 - If goal is not found or doesn't belong to user
   * @throws {AppError} 500 - If database operation fails
   *
   * @example
   * // Request
   * DELETE /api/goals/goal_abc123
   * Authorization: Bearer <token>
   *
   * // Success Response (204 No Content)
   * // Empty body
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      await goalsService.delete(req.params.id, req.userId!)
      res.status(204).send()
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to delete savings goal'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json({ message })
    }
  },

  // Contribution endpoints

  /**
   * Adds a contribution to a savings goal.
   *
   * Creates a contribution record and atomically updates the goal's current
   * amount. Automatically marks the goal as completed if target is reached.
   *
   * @param {AuthRequest} req - Express request with goal ID and contribution data
   * @param {string} req.params.id - The unique identifier of the goal
   * @param {number} req.body.amount - Contribution amount (must be positive)
   * @param {string} [req.body.note] - Optional note describing the contribution
   * @param {string} [req.body.transactionId] - Optional linked transaction ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON object of created contribution with 201 status
   *
   * @throws {AppError} 400 - If amount is missing, zero, or negative
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 404 - If goal is not found or doesn't belong to user
   * @throws {AppError} 500 - If database transaction fails
   *
   * @example
   * // Request
   * POST /api/goals/goal_abc123/contributions
   * Authorization: Bearer <token>
   * Content-Type: application/json
   * {
   *   "amount": 500,
   *   "note": "Monthly savings deposit"
   * }
   *
   * // Success Response (201 Created)
   * {
   *   "id": "contrib_xyz",
   *   "amount": 500,
   *   "note": "Monthly savings deposit",
   *   "goalId": "goal_abc123",
   *   "createdAt": "2024-10-15T10:30:00.000Z"
   * }
   *
   * // Error Response (400 Bad Request)
   * {
   *   "message": "A positive amount is required"
   * }
   */
  async addContribution(req: AuthRequest, res: Response) {
    try {
      const { amount, note, transactionId } = req.body

      if (amount === undefined || amount <= 0) {
        const error = AppError.validation('A positive amount is required', {
          field: 'amount',
          providedValue: amount,
        })
        res.status(error.statusCode).json({ message: error.message })
        return
      }

      const contribution = await goalsService.addContribution(req.params.id, req.userId!, {
        amount,
        note,
        transactionId,
      })
      res.status(201).json(contribution)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to add contribution'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json({ message })
    }
  },

  /**
   * Removes a contribution from a savings goal.
   *
   * Deletes the contribution and atomically updates the goal's current amount
   * by subtracting the contribution value. Recalculates completion status.
   *
   * @param {AuthRequest} req - Express request with contribution ID in params
   * @param {string} req.params.contributionId - The unique identifier of the contribution
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends 204 No Content on success
   *
   * @throws {AppError} 400 - If removal fails
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 404 - If contribution is not found or goal doesn't belong to user
   * @throws {AppError} 500 - If database transaction fails
   *
   * @example
   * // Request
   * DELETE /api/goals/contributions/contrib_xyz
   * Authorization: Bearer <token>
   *
   * // Success Response (204 No Content)
   * // Empty body
   */
  async removeContribution(req: AuthRequest, res: Response) {
    try {
      await goalsService.removeContribution(req.params.contributionId, req.userId!)
      res.status(204).send()
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to remove contribution'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json({ message })
    }
  },

  /**
   * Retrieves all contributions for a specific savings goal.
   *
   * Returns contributions ordered by date (newest first) with linked
   * transaction details when available.
   *
   * @param {AuthRequest} req - Express request with goal ID in params
   * @param {string} req.params.id - The unique identifier of the goal
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON array of contributions
   *
   * @throws {AppError} 400 - If query fails
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 404 - If goal is not found or doesn't belong to user
   * @throws {AppError} 500 - If database query fails
   *
   * @example
   * // Request
   * GET /api/goals/goal_abc123/contributions
   * Authorization: Bearer <token>
   *
   * // Success Response (200 OK)
   * [
   *   {
   *     "id": "contrib_1",
   *     "amount": 500,
   *     "note": "Monthly deposit",
   *     "createdAt": "2024-10-15T10:30:00.000Z",
   *     "transaction": {
   *       "id": "txn_abc",
   *       "description": "Savings transfer",
   *       "date": "2024-10-15",
   *       "amount": 500
   *     }
   *   }
   * ]
   */
  async getContributions(req: AuthRequest, res: Response) {
    try {
      const contributions = await goalsService.getContributions(req.params.id, req.userId!)
      res.json(contributions)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to fetch contributions'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json({ message })
    }
  },

  // Summary for dashboard

  /**
   * Retrieves an aggregated summary of all savings goals for dashboard display.
   *
   * Returns overall statistics including total targets, amounts saved,
   * completion counts, and progress percentages.
   *
   * @param {AuthRequest} req - Express request object with authenticated user ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON object with goals summary
   *
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 500 - If database query fails
   *
   * @example
   * // Request
   * GET /api/goals/summary
   * Authorization: Bearer <token>
   *
   * // Success Response (200 OK)
   * {
   *   "goals": [
   *     { "id": "goal_1", "name": "Emergency Fund", "targetAmount": 10000, "currentAmount": 5000, "isCompleted": false }
   *   ],
   *   "totalTarget": 25000,
   *   "totalSaved": 12500,
   *   "completedCount": 1,
   *   "activeCount": 3,
   *   "overallProgress": 50
   * }
   */
  async getSummary(req: AuthRequest, res: Response) {
    try {
      const summary = await goalsService.getSummary(req.userId!)
      res.json(summary)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const appError = AppError.internal('Failed to fetch goals summary')
      res.status(appError.statusCode).json({ message: appError.message })
    }
  },
}
