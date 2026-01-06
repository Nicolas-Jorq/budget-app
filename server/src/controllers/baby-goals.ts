/**
 * @fileoverview Baby Goals Controller for the Budget App.
 *
 * This controller handles all HTTP endpoints related to baby-specific savings
 * goals and milestones. It provides specialized functionality for tracking
 * expenses associated with having a baby, including:
 * - Pregnancy and pre-birth expenses
 * - Nursery setup and baby gear
 * - First year essentials and ongoing costs
 * - Childcare and healthcare planning
 * - Education fund savings
 *
 * Endpoints provided:
 * - GET /api/goals/:goalId/milestones - List milestones for a baby goal
 * - GET /api/goals/milestones/:milestoneId - Get a specific milestone
 * - POST /api/goals/:goalId/milestones - Create a milestone
 * - PUT /api/goals/milestones/:milestoneId - Update a milestone
 * - DELETE /api/goals/milestones/:milestoneId - Delete a milestone
 * - POST /api/goals/milestones/:milestoneId/contribute - Contribute to milestone
 * - GET /api/goals/:goalId/projections - Get expense projections
 * - GET /api/goals/:goalId/timeline - Get timeline view
 * - POST /api/goals/:goalId/default-milestones - Create default milestones
 *
 * All endpoints require authentication and validate that the parent goal
 * belongs to the authenticated user and is of type 'BABY'.
 *
 * @module controllers/baby-goals
 * @see {@link babyGoalsService} - The service layer handling business logic
 */

import { Response } from 'express'
import { babyGoalsService } from '../services/baby-goals.js'
import { AuthRequest } from '../middleware/auth.js'
import { AppError, isAppError } from '../utils/errors.js'

/**
 * Baby goals controller object containing all baby-specific goal request handlers.
 *
 * @namespace babyGoalsController
 */
export const babyGoalsController = {
  // Milestones CRUD

  /**
   * Retrieves all milestones for a baby savings goal.
   *
   * Returns milestones ordered by due month (relative to birth) and creation date.
   *
   * @param {AuthRequest} req - Express request with goal ID in params
   * @param {string} req.params.goalId - The unique identifier of the baby goal
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON array of milestones
   *
   * @throws {AppError} 400 - If fetching milestones fails
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 404 - If baby goal is not found or doesn't belong to user
   *
   * @example
   * // Request
   * GET /api/goals/goal_baby123/milestones
   * Authorization: Bearer <token>
   *
   * // Success Response (200 OK)
   * [
   *   {
   *     "id": "milestone_1",
   *     "name": "Nursery Setup",
   *     "category": "NURSERY",
   *     "targetAmount": 2000,
   *     "currentAmount": 500,
   *     "dueMonth": -1,
   *     "isCompleted": false
   *   },
   *   {
   *     "id": "milestone_2",
   *     "name": "Baby Gear",
   *     "category": "GEAR",
   *     "targetAmount": 1500,
   *     "currentAmount": 0,
   *     "dueMonth": 0
   *   }
   * ]
   */
  async getMilestones(req: AuthRequest, res: Response) {
    try {
      const milestones = await babyGoalsService.getMilestones(req.params.goalId, req.userId!)
      res.json(milestones)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to fetch milestones'
      if (message === 'Baby goal not found') {
        const appError = AppError.notFound('Baby goal', req.params.goalId)
        res.status(appError.statusCode).json({ message })
        return
      }
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json({ message })
    }
  },

  /**
   * Retrieves a single milestone by ID.
   *
   * Returns the milestone with its parent goal information for context.
   *
   * @param {AuthRequest} req - Express request with milestone ID in params
   * @param {string} req.params.milestoneId - The unique identifier of the milestone
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON object of the milestone
   *
   * @throws {AppError} 400 - If fetching milestone fails
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 404 - If milestone is not found or goal doesn't belong to user
   *
   * @example
   * // Request
   * GET /api/goals/milestones/milestone_abc123
   * Authorization: Bearer <token>
   *
   * // Success Response (200 OK)
   * {
   *   "id": "milestone_abc123",
   *   "name": "Nursery Setup",
   *   "category": "NURSERY",
   *   "targetAmount": 2000,
   *   "currentAmount": 1200,
   *   "dueMonth": -1,
   *   "isCompleted": false,
   *   "notes": "Need crib, changing table, and dresser",
   *   "goal": {
   *     "id": "goal_baby123",
   *     "name": "Baby Expenses",
   *     "userId": "user_123"
   *   }
   * }
   *
   * // Error Response (404 Not Found)
   * {
   *   "message": "Milestone not found"
   * }
   */
  async getMilestoneById(req: AuthRequest, res: Response) {
    try {
      const milestone = await babyGoalsService.getMilestoneById(req.params.milestoneId, req.userId!)
      res.json(milestone)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to fetch milestone'
      if (message === 'Milestone not found') {
        const appError = AppError.notFound('Milestone', req.params.milestoneId)
        res.status(appError.statusCode).json({ message })
        return
      }
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json({ message })
    }
  },

  /**
   * Creates a new milestone for a baby savings goal.
   *
   * Validates required fields and creates a milestone with initial zero balance.
   * Due month defaults to the standard for the category if not provided.
   *
   * @param {AuthRequest} req - Express request with goal ID and milestone data
   * @param {string} req.params.goalId - The unique identifier of the baby goal
   * @param {string} req.body.name - Display name for the milestone (required)
   * @param {string} req.body.category - Milestone category from MilestoneCategory enum (required)
   * @param {number} req.body.targetAmount - Target amount to save (required, must be positive)
   * @param {number} [req.body.dueMonth] - Month relative to birth (-9 to 24+, 0 = birth month)
   * @param {string} [req.body.notes] - Optional notes or description
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON object of created milestone with 201 status
   *
   * @throws {AppError} 400 - If required fields are missing or validation fails
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 404 - If baby goal is not found or doesn't belong to user
   *
   * @example
   * // Request
   * POST /api/goals/goal_baby123/milestones
   * Authorization: Bearer <token>
   * Content-Type: application/json
   * {
   *   "name": "Hospital Bag Items",
   *   "category": "PRE_BIRTH",
   *   "targetAmount": 300,
   *   "dueMonth": -1,
   *   "notes": "Clothes, toiletries, baby supplies for hospital"
   * }
   *
   * // Success Response (201 Created)
   * {
   *   "id": "milestone_new123",
   *   "name": "Hospital Bag Items",
   *   "category": "PRE_BIRTH",
   *   "targetAmount": 300,
   *   "currentAmount": 0,
   *   "dueMonth": -1,
   *   "isCompleted": false
   * }
   *
   * // Error Response (400 Bad Request)
   * {
   *   "message": "Name, category, and targetAmount are required"
   * }
   */
  async createMilestone(req: AuthRequest, res: Response) {
    try {
      const { name, category, targetAmount, dueMonth, notes } = req.body

      if (!name || !category || targetAmount === undefined) {
        const error = AppError.validation('Name, category, and targetAmount are required', {
          missingFields: {
            name: !name,
            category: !category,
            targetAmount: targetAmount === undefined,
          },
        })
        res.status(error.statusCode).json({ message: error.message })
        return
      }

      if (targetAmount <= 0) {
        const error = AppError.validation('Target amount must be positive', {
          field: 'targetAmount',
          providedValue: targetAmount,
        })
        res.status(error.statusCode).json({ message: error.message })
        return
      }

      const milestone = await babyGoalsService.createMilestone(req.params.goalId, req.userId!, {
        name,
        category,
        targetAmount,
        dueMonth,
        notes,
      })
      res.status(201).json(milestone)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to create milestone'
      if (message === 'Baby goal not found') {
        const appError = AppError.notFound('Baby goal', req.params.goalId)
        res.status(appError.statusCode).json({ message })
        return
      }
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json({ message })
    }
  },

  /**
   * Updates an existing milestone.
   *
   * Only provided fields will be updated; undefined fields are preserved.
   *
   * @param {AuthRequest} req - Express request with milestone ID and update data
   * @param {string} req.params.milestoneId - The unique identifier of the milestone
   * @param {string} [req.body.name] - Updated display name
   * @param {string} [req.body.category] - Updated category
   * @param {number} [req.body.targetAmount] - Updated target amount
   * @param {number|null} [req.body.dueMonth] - Updated due month (null to remove)
   * @param {string|null} [req.body.notes] - Updated notes (null to remove)
   * @param {boolean} [req.body.isCompleted] - Manually mark as completed
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON object of updated milestone
   *
   * @throws {AppError} 400 - If validation fails
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 404 - If milestone is not found or goal doesn't belong to user
   *
   * @example
   * // Request
   * PUT /api/goals/milestones/milestone_abc123
   * Authorization: Bearer <token>
   * Content-Type: application/json
   * {
   *   "targetAmount": 2500,
   *   "notes": "Updated estimate after research"
   * }
   *
   * // Success Response (200 OK)
   * {
   *   "id": "milestone_abc123",
   *   "name": "Nursery Setup",
   *   "targetAmount": 2500,
   *   "notes": "Updated estimate after research"
   * }
   */
  async updateMilestone(req: AuthRequest, res: Response) {
    try {
      const milestone = await babyGoalsService.updateMilestone(
        req.params.milestoneId,
        req.userId!,
        req.body
      )
      res.json(milestone)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to update milestone'
      if (message === 'Milestone not found') {
        const appError = AppError.notFound('Milestone', req.params.milestoneId)
        res.status(appError.statusCode).json({ message })
        return
      }
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json({ message })
    }
  },

  /**
   * Deletes a milestone from a baby goal.
   *
   * This operation is irreversible. The milestone's current amount does not
   * affect the parent goal's total when deleted.
   *
   * @param {AuthRequest} req - Express request with milestone ID in params
   * @param {string} req.params.milestoneId - The unique identifier of the milestone
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends 204 No Content on success
   *
   * @throws {AppError} 400 - If deletion fails
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 404 - If milestone is not found or goal doesn't belong to user
   *
   * @example
   * // Request
   * DELETE /api/goals/milestones/milestone_abc123
   * Authorization: Bearer <token>
   *
   * // Success Response (204 No Content)
   * // Empty body
   */
  async deleteMilestone(req: AuthRequest, res: Response) {
    try {
      await babyGoalsService.deleteMilestone(req.params.milestoneId, req.userId!)
      res.status(204).send()
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to delete milestone'
      if (message === 'Milestone not found') {
        const appError = AppError.notFound('Milestone', req.params.milestoneId)
        res.status(appError.statusCode).json({ message })
        return
      }
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json({ message })
    }
  },

  /**
   * Adds a contribution to a specific milestone.
   *
   * Creates a contribution record and atomically updates both the milestone's
   * and parent goal's current amounts. Marks milestone as completed if target
   * is reached.
   *
   * @param {AuthRequest} req - Express request with milestone ID and contribution data
   * @param {string} req.params.milestoneId - The unique identifier of the milestone
   * @param {number} req.body.amount - Contribution amount (must be positive)
   * @param {string} [req.body.note] - Optional note describing the contribution
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON object of updated milestone
   *
   * @throws {AppError} 400 - If amount is missing, zero, or negative
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 404 - If milestone is not found or goal doesn't belong to user
   *
   * @example
   * // Request
   * POST /api/goals/milestones/milestone_abc123/contribute
   * Authorization: Bearer <token>
   * Content-Type: application/json
   * {
   *   "amount": 250,
   *   "note": "Bought crib on sale"
   * }
   *
   * // Success Response (200 OK)
   * {
   *   "id": "milestone_abc123",
   *   "name": "Nursery Setup",
   *   "targetAmount": 2000,
   *   "currentAmount": 1450,
   *   "isCompleted": false
   * }
   *
   * // Error Response (400 Bad Request)
   * {
   *   "message": "A positive amount is required"
   * }
   */
  async contributeToMilestone(req: AuthRequest, res: Response) {
    try {
      const { amount, note } = req.body

      if (amount === undefined || amount <= 0) {
        const error = AppError.validation('A positive amount is required', {
          field: 'amount',
          providedValue: amount,
        })
        res.status(error.statusCode).json({ message: error.message })
        return
      }

      const milestone = await babyGoalsService.contributeToMilestone(
        req.params.milestoneId,
        req.userId!,
        amount,
        note
      )
      res.json(milestone)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to contribute to milestone'
      if (message === 'Milestone not found') {
        const appError = AppError.notFound('Milestone', req.params.milestoneId)
        res.status(appError.statusCode).json({ message })
        return
      }
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json({ message })
    }
  },

  /**
   * Retrieves expense projections for a baby goal.
   *
   * Calculates projected costs based on default estimates and existing milestones,
   * showing current progress and shortfalls relative to the expected due date.
   *
   * @param {AuthRequest} req - Express request with goal ID in params
   * @param {string} req.params.goalId - The unique identifier of the baby goal
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON object with projections data
   *
   * @throws {AppError} 400 - If fetching projections fails
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 404 - If baby goal is not found or doesn't belong to user
   *
   * @example
   * // Request
   * GET /api/goals/goal_baby123/projections
   * Authorization: Bearer <token>
   *
   * // Success Response (200 OK)
   * {
   *   "projections": [
   *     {
   *       "category": "NURSERY",
   *       "label": "Nursery Setup",
   *       "estimatedCost": 2000,
   *       "currentSaved": 1200,
   *       "dueMonth": -1,
   *       "isOverdue": false,
   *       "hasExistingMilestone": true,
   *       "percentComplete": 60
   *     },
   *     {
   *       "category": "GEAR",
   *       "label": "Baby Gear & Equipment",
   *       "estimatedCost": 1500,
   *       "currentSaved": 0,
   *       "dueMonth": 0,
   *       "isOverdue": false,
   *       "hasExistingMilestone": false,
   *       "percentComplete": 0
   *     }
   *   ],
   *   "totalProjected": 28000,
   *   "totalSaved": 5500,
   *   "shortfall": 22500,
   *   "percentComplete": 20,
   *   "currentMonthFromBirth": -3,
   *   "dueDate": "2025-03-15"
   * }
   */
  async getProjections(req: AuthRequest, res: Response) {
    try {
      const projections = await babyGoalsService.getProjections(req.params.goalId, req.userId!)
      res.json(projections)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to get projections'
      if (message === 'Baby goal not found') {
        const appError = AppError.notFound('Baby goal', req.params.goalId)
        res.status(appError.statusCode).json({ message })
        return
      }
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json({ message })
    }
  },

  /**
   * Retrieves a timeline view of all milestones for a baby goal.
   *
   * Groups milestones by phase (pre-birth, birth, first 6 months, etc.)
   * for visual timeline display.
   *
   * @param {AuthRequest} req - Express request with goal ID in params
   * @param {string} req.params.goalId - The unique identifier of the baby goal
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON object with timeline data
   *
   * @throws {AppError} 400 - If fetching timeline fails
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 404 - If baby goal is not found or doesn't belong to user
   *
   * @example
   * // Request
   * GET /api/goals/goal_baby123/timeline
   * Authorization: Bearer <token>
   *
   * // Success Response (200 OK)
   * {
   *   "goalId": "goal_baby123",
   *   "goalName": "Baby Expenses",
   *   "dueDate": "2025-03-15",
   *   "isPregnancy": true,
   *   "babyName": null,
   *   "phases": [
   *     {
   *       "name": "Pre-Birth",
   *       "milestones": [
   *         { "id": "m1", "name": "Prenatal Care", "category": "HEALTHCARE", "targetAmount": 1000, "currentAmount": 500, "isCompleted": false, "dueMonth": -6, "percentComplete": 50 }
   *       ],
   *       "totalTarget": 4500,
   *       "totalSaved": 2000
   *     },
   *     {
   *       "name": "Birth",
   *       "milestones": [...],
   *       "totalTarget": 3500,
   *       "totalSaved": 500
   *     }
   *   ],
   *   "totalMilestones": 7,
   *   "completedMilestones": 1
   * }
   */
  async getTimeline(req: AuthRequest, res: Response) {
    try {
      const timeline = await babyGoalsService.getTimeline(req.params.goalId, req.userId!)
      res.json(timeline)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to get timeline'
      if (message === 'Baby goal not found') {
        const appError = AppError.notFound('Baby goal', req.params.goalId)
        res.status(appError.statusCode).json({ message })
        return
      }
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json({ message })
    }
  },

  /**
   * Creates default milestones for a baby savings goal.
   *
   * Populates the goal with standard milestone categories (pre-birth, nursery,
   * gear, first year, childcare, healthcare, education) using default estimated
   * amounts and due months.
   *
   * @param {AuthRequest} req - Express request with goal ID in params
   * @param {string} req.params.goalId - The unique identifier of the baby goal
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Sends JSON array of created milestones with 201 status
   *
   * @throws {AppError} 400 - If creation fails (e.g., milestones already exist)
   * @throws {AppError} 401 - If user is not authenticated (handled by auth middleware)
   * @throws {AppError} 404 - If baby goal is not found or doesn't belong to user
   *
   * @example
   * // Request
   * POST /api/goals/goal_baby123/default-milestones
   * Authorization: Bearer <token>
   *
   * // Success Response (201 Created)
   * [
   *   {
   *     "id": "milestone_1",
   *     "name": "Pre-Birth Expenses",
   *     "category": "PRE_BIRTH",
   *     "targetAmount": 2500,
   *     "currentAmount": 0,
   *     "dueMonth": -3
   *   },
   *   {
   *     "id": "milestone_2",
   *     "name": "Nursery Setup",
   *     "category": "NURSERY",
   *     "targetAmount": 2000,
   *     "currentAmount": 0,
   *     "dueMonth": -1
   *   },
   *   // ... remaining 5 default milestones
   * ]
   */
  async createDefaultMilestones(req: AuthRequest, res: Response) {
    try {
      const milestones = await babyGoalsService.createDefaultMilestones(req.params.goalId, req.userId!)
      res.status(201).json(milestones)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to create default milestones'
      if (message === 'Baby goal not found') {
        const appError = AppError.notFound('Baby goal', req.params.goalId)
        res.status(appError.statusCode).json({ message })
        return
      }
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json({ message })
    }
  },
}
