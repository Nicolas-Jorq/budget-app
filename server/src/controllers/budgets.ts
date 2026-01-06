/**
 * @fileoverview Budget controller handling CRUD operations for user budgets.
 *
 * This controller provides HTTP endpoints for:
 * - Listing all budgets for the authenticated user
 * - Retrieving a single budget by ID
 * - Creating new budgets
 * - Updating existing budgets
 * - Deleting budgets
 *
 * All endpoints require authentication and enforce user ownership.
 * Budgets are used to track spending limits by category.
 *
 * @module controllers/budgets
 */

import { Response } from 'express'
import { budgetService } from '../services/budgets.js'
import { AuthRequest } from '../middleware/auth.js'
import { AppError, isAppError, HttpStatus } from '../utils/errors.js'

/**
 * Budget controller providing request handlers for budget-related endpoints.
 *
 * @example
 * // Route setup
 * router.get('/', authenticate, budgetController.getAll);
 * router.get('/:id', authenticate, budgetController.getById);
 * router.post('/', authenticate, budgetController.create);
 * router.put('/:id', authenticate, budgetController.update);
 * router.delete('/:id', authenticate, budgetController.delete);
 */
export const budgetController = {
  /**
   * Retrieves all budgets for the authenticated user.
   *
   * Returns budgets ordered by creation date (newest first).
   *
   * @param {AuthRequest} req - Express request with authenticated user ID
   * @param {string} req.userId - User ID extracted from JWT token
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON array of budget objects
   *
   * @throws {AppError} 500 - If database query fails
   *
   * @example
   * // Request
   * GET /api/budgets
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   *
   * // Success Response (200 OK)
   * [
   *   {
   *     "id": "clx...",
   *     "name": "Groceries",
   *     "amount": 500,
   *     "spent": 250.50,
   *     "category": "Food",
   *     "userId": "clx...",
   *     "createdAt": "2024-01-15T10:30:00.000Z",
   *     "updatedAt": "2024-01-20T14:22:00.000Z"
   *   },
   *   ...
   * ]
   */
  async getAll(req: AuthRequest, res: Response) {
    try {
      const budgets = await budgetService.getAll(req.userId!)
      res.json(budgets)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch budgets' })
    }
  },

  /**
   * Retrieves a single budget by ID.
   *
   * Verifies that the budget belongs to the authenticated user.
   *
   * @param {AuthRequest} req - Express request with authenticated user ID
   * @param {string} req.userId - User ID extracted from JWT token
   * @param {string} req.params.id - Budget ID from URL parameter
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON budget object
   *
   * @throws {AppError} 404 - If budget not found or doesn't belong to user
   * @throws {AppError} 500 - If database query fails
   *
   * @example
   * // Request
   * GET /api/budgets/clx123...
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   *
   * // Success Response (200 OK)
   * {
   *   "id": "clx123...",
   *   "name": "Groceries",
   *   "amount": 500,
   *   "spent": 250.50,
   *   "category": "Food",
   *   "userId": "clx...",
   *   "createdAt": "2024-01-15T10:30:00.000Z",
   *   "updatedAt": "2024-01-20T14:22:00.000Z"
   * }
   *
   * // Error Response (404 Not Found)
   * { "message": "Budget not found" }
   */
  async getById(req: AuthRequest, res: Response) {
    try {
      const budget = await budgetService.getById(req.params.id, req.userId!)
      if (!budget) {
        throw AppError.notFound('Budget', req.params.id)
      }
      res.json(budget)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch budget' })
    }
  },

  /**
   * Creates a new budget for the authenticated user.
   *
   * Validates required fields before creating the budget.
   * The budget starts with spent = 0.
   *
   * @param {AuthRequest} req - Express request with authenticated user ID
   * @param {string} req.userId - User ID extracted from JWT token
   * @param {string} req.body.name - Descriptive name for the budget
   * @param {number} req.body.amount - Target budget amount in dollars
   * @param {string} req.body.category - Spending category to track
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON with created budget (201 Created)
   *
   * @throws {AppError} 400 - If required fields (name, amount, category) are missing
   * @throws {AppError} 400 - If validation fails in service layer
   * @throws {AppError} 500 - If database insert fails
   *
   * @example
   * // Request
   * POST /api/budgets
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   * {
   *   "name": "Monthly Groceries",
   *   "amount": 500,
   *   "category": "Food"
   * }
   *
   * // Success Response (201 Created)
   * {
   *   "id": "clx...",
   *   "name": "Monthly Groceries",
   *   "amount": 500,
   *   "spent": 0,
   *   "category": "Food",
   *   "userId": "clx...",
   *   "createdAt": "2024-01-15T10:30:00.000Z",
   *   "updatedAt": "2024-01-15T10:30:00.000Z"
   * }
   *
   * // Error Response (400 Bad Request)
   * { "message": "Name, amount, and category are required" }
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const { name, amount, category } = req.body

      if (!name || amount === undefined || !category) {
        throw AppError.validation('Name, amount, and category are required', {
          fields: { name: !name, amount: amount === undefined, category: !category },
        })
      }

      const budget = await budgetService.create(req.userId!, { name, amount, category })
      res.status(HttpStatus.CREATED).json(budget)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to create budget'
      res.status(HttpStatus.BAD_REQUEST).json({ message })
    }
  },

  /**
   * Updates an existing budget.
   *
   * Only provided fields will be updated. Verifies user ownership
   * before making changes.
   *
   * @param {AuthRequest} req - Express request with authenticated user ID
   * @param {string} req.userId - User ID extracted from JWT token
   * @param {string} req.params.id - Budget ID from URL parameter
   * @param {string} [req.body.name] - Updated budget name
   * @param {number} [req.body.amount] - Updated target amount
   * @param {string} [req.body.category] - Updated category
   * @param {number} [req.body.spent] - Updated spent amount
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON with updated budget
   *
   * @throws {AppError} 404 - If budget not found or doesn't belong to user (from service)
   * @throws {AppError} 400 - If update data is invalid
   * @throws {AppError} 500 - If database update fails
   *
   * @example
   * // Request
   * PUT /api/budgets/clx123...
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   * {
   *   "amount": 750,
   *   "name": "Updated Groceries Budget"
   * }
   *
   * // Success Response (200 OK)
   * {
   *   "id": "clx123...",
   *   "name": "Updated Groceries Budget",
   *   "amount": 750,
   *   "spent": 250.50,
   *   "category": "Food",
   *   "userId": "clx...",
   *   "createdAt": "2024-01-15T10:30:00.000Z",
   *   "updatedAt": "2024-01-25T09:15:00.000Z"
   * }
   *
   * // Error Response (404 Not Found)
   * { "message": "Budget with ID 'clx123...' not found" }
   */
  async update(req: AuthRequest, res: Response) {
    try {
      const budget = await budgetService.update(req.params.id, req.userId!, req.body)
      res.json(budget)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to update budget'
      res.status(HttpStatus.BAD_REQUEST).json({ message })
    }
  },

  /**
   * Deletes a budget.
   *
   * Verifies user ownership before deletion. Transactions linked to
   * this budget will have their budgetId set to null.
   *
   * @param {AuthRequest} req - Express request with authenticated user ID
   * @param {string} req.userId - User ID extracted from JWT token
   * @param {string} req.params.id - Budget ID from URL parameter
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends empty response (204 No Content)
   *
   * @throws {AppError} 404 - If budget not found or doesn't belong to user (from service)
   * @throws {AppError} 400 - If deletion fails
   * @throws {AppError} 500 - If database delete fails
   *
   * @example
   * // Request
   * DELETE /api/budgets/clx123...
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   *
   * // Success Response (204 No Content)
   * (empty body)
   *
   * // Error Response (404 Not Found)
   * { "message": "Budget with ID 'clx123...' not found" }
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      await budgetService.delete(req.params.id, req.userId!)
      res.status(HttpStatus.NO_CONTENT).send()
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to delete budget'
      res.status(HttpStatus.BAD_REQUEST).json({ message })
    }
  },
}
