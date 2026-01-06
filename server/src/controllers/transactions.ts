/**
 * @fileoverview Transaction controller handling CRUD operations for financial transactions.
 *
 * This controller provides HTTP endpoints for:
 * - Listing all transactions for the authenticated user
 * - Retrieving a single transaction by ID
 * - Creating new income or expense transactions
 * - Updating existing transactions
 * - Deleting transactions
 *
 * All endpoints require authentication and enforce user ownership.
 * Transactions can optionally be linked to budgets for spending tracking.
 *
 * @module controllers/transactions
 */

import { Response } from 'express'
import { transactionService } from '../services/transactions.js'
import { AuthRequest } from '../middleware/auth.js'
import { AppError, isAppError, HttpStatus } from '../utils/errors.js'

/**
 * Transaction controller providing request handlers for transaction-related endpoints.
 *
 * @example
 * // Route setup
 * router.get('/', authenticate, transactionController.getAll);
 * router.get('/:id', authenticate, transactionController.getById);
 * router.post('/', authenticate, transactionController.create);
 * router.put('/:id', authenticate, transactionController.update);
 * router.delete('/:id', authenticate, transactionController.delete);
 */
export const transactionController = {
  /**
   * Retrieves all transactions for the authenticated user.
   *
   * Returns transactions ordered by date (newest first).
   *
   * @param {AuthRequest} req - Express request with authenticated user ID
   * @param {string} req.userId - User ID extracted from JWT token
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON array of transaction objects
   *
   * @throws {AppError} 500 - If database query fails
   *
   * @example
   * // Request
   * GET /api/transactions
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   *
   * // Success Response (200 OK)
   * [
   *   {
   *     "id": "clx...",
   *     "description": "Grocery shopping",
   *     "amount": 75.50,
   *     "type": "expense",
   *     "category": "Food",
   *     "date": "2024-01-15T00:00:00.000Z",
   *     "budgetId": "clx...",
   *     "userId": "clx...",
   *     "createdAt": "2024-01-15T10:30:00.000Z",
   *     "updatedAt": "2024-01-15T10:30:00.000Z"
   *   },
   *   ...
   * ]
   */
  async getAll(req: AuthRequest, res: Response) {
    try {
      const transactions = await transactionService.getAll(req.userId!)
      res.json(transactions)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch transactions' })
    }
  },

  /**
   * Retrieves a single transaction by ID.
   *
   * Verifies that the transaction belongs to the authenticated user.
   *
   * @param {AuthRequest} req - Express request with authenticated user ID
   * @param {string} req.userId - User ID extracted from JWT token
   * @param {string} req.params.id - Transaction ID from URL parameter
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON transaction object
   *
   * @throws {AppError} 404 - If transaction not found or doesn't belong to user
   * @throws {AppError} 500 - If database query fails
   *
   * @example
   * // Request
   * GET /api/transactions/clx123...
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   *
   * // Success Response (200 OK)
   * {
   *   "id": "clx123...",
   *   "description": "Grocery shopping",
   *   "amount": 75.50,
   *   "type": "expense",
   *   "category": "Food",
   *   "date": "2024-01-15T00:00:00.000Z",
   *   "budgetId": "clx...",
   *   "userId": "clx...",
   *   "createdAt": "2024-01-15T10:30:00.000Z",
   *   "updatedAt": "2024-01-15T10:30:00.000Z"
   * }
   *
   * // Error Response (404 Not Found)
   * { "message": "Transaction not found" }
   */
  async getById(req: AuthRequest, res: Response) {
    try {
      const transaction = await transactionService.getById(req.params.id, req.userId!)
      if (!transaction) {
        throw AppError.notFound('Transaction', req.params.id)
      }
      res.json(transaction)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch transaction' })
    }
  },

  /**
   * Creates a new transaction for the authenticated user.
   *
   * Validates required fields and transaction type before creating.
   * If a budgetId is provided, the transaction will be linked to that budget
   * for spending tracking.
   *
   * @param {AuthRequest} req - Express request with authenticated user ID
   * @param {string} req.userId - User ID extracted from JWT token
   * @param {string} req.body.description - Transaction description
   * @param {number} req.body.amount - Transaction amount (positive number)
   * @param {string} req.body.type - Transaction type: 'income' or 'expense'
   * @param {string} req.body.category - Transaction category
   * @param {string} req.body.date - Transaction date (ISO 8601 format)
   * @param {string} [req.body.budgetId] - Optional budget ID to link transaction
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON with created transaction (201 Created)
   *
   * @throws {AppError} 400 - If required fields are missing
   * @throws {AppError} 400 - If type is not 'income' or 'expense'
   * @throws {AppError} 400 - If validation fails in service layer
   * @throws {AppError} 500 - If database insert fails
   *
   * @example
   * // Request - Expense linked to budget
   * POST /api/transactions
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   * {
   *   "description": "Weekly groceries",
   *   "amount": 85.00,
   *   "type": "expense",
   *   "category": "Food",
   *   "date": "2024-01-15",
   *   "budgetId": "clx..."
   * }
   *
   * // Success Response (201 Created)
   * {
   *   "id": "clx...",
   *   "description": "Weekly groceries",
   *   "amount": 85.00,
   *   "type": "expense",
   *   "category": "Food",
   *   "date": "2024-01-15T00:00:00.000Z",
   *   "budgetId": "clx...",
   *   "userId": "clx...",
   *   "createdAt": "2024-01-15T10:30:00.000Z",
   *   "updatedAt": "2024-01-15T10:30:00.000Z"
   * }
   *
   * // Error Response (400 Bad Request)
   * { "message": "Description, amount, type, category, and date are required" }
   *
   * // Error Response (400 Bad Request)
   * { "message": "Type must be income or expense" }
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const { description, amount, type, category, date, budgetId } = req.body

      if (!description || amount === undefined || !type || !category || !date) {
        throw AppError.validation('Description, amount, type, category, and date are required', {
          fields: {
            description: !description,
            amount: amount === undefined,
            type: !type,
            category: !category,
            date: !date,
          },
        })
      }

      if (type !== 'income' && type !== 'expense') {
        throw AppError.validation('Type must be income or expense', {
          field: 'type',
          allowedValues: ['income', 'expense'],
          received: type,
        })
      }

      const transaction = await transactionService.create(req.userId!, {
        description,
        amount,
        type,
        category,
        date,
        budgetId,
      })
      res.status(HttpStatus.CREATED).json(transaction)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to create transaction'
      res.status(HttpStatus.BAD_REQUEST).json({ message })
    }
  },

  /**
   * Updates an existing transaction.
   *
   * Only provided fields will be updated. Verifies user ownership
   * before making changes.
   *
   * @param {AuthRequest} req - Express request with authenticated user ID
   * @param {string} req.userId - User ID extracted from JWT token
   * @param {string} req.params.id - Transaction ID from URL parameter
   * @param {string} [req.body.description] - Updated description
   * @param {number} [req.body.amount] - Updated amount
   * @param {string} [req.body.type] - Updated type ('income' or 'expense')
   * @param {string} [req.body.category] - Updated category
   * @param {string} [req.body.date] - Updated date
   * @param {string|null} [req.body.budgetId] - Updated budget link (null to unlink)
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON with updated transaction
   *
   * @throws {AppError} 404 - If transaction not found or doesn't belong to user (from service)
   * @throws {AppError} 400 - If update data is invalid
   * @throws {AppError} 500 - If database update fails
   *
   * @example
   * // Request
   * PUT /api/transactions/clx123...
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   * {
   *   "amount": 95.00,
   *   "description": "Updated grocery shopping"
   * }
   *
   * // Success Response (200 OK)
   * {
   *   "id": "clx123...",
   *   "description": "Updated grocery shopping",
   *   "amount": 95.00,
   *   "type": "expense",
   *   "category": "Food",
   *   "date": "2024-01-15T00:00:00.000Z",
   *   "budgetId": "clx...",
   *   "userId": "clx...",
   *   "createdAt": "2024-01-15T10:30:00.000Z",
   *   "updatedAt": "2024-01-25T09:15:00.000Z"
   * }
   *
   * // Error Response (404 Not Found)
   * { "message": "Transaction with ID 'clx123...' not found" }
   */
  async update(req: AuthRequest, res: Response) {
    try {
      const transaction = await transactionService.update(req.params.id, req.userId!, req.body)
      res.json(transaction)
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to update transaction'
      res.status(HttpStatus.BAD_REQUEST).json({ message })
    }
  },

  /**
   * Deletes a transaction.
   *
   * Verifies user ownership before deletion. If the transaction was
   * linked to a budget, the budget's spent amount may be recalculated.
   *
   * @param {AuthRequest} req - Express request with authenticated user ID
   * @param {string} req.userId - User ID extracted from JWT token
   * @param {string} req.params.id - Transaction ID from URL parameter
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends empty response (204 No Content)
   *
   * @throws {AppError} 404 - If transaction not found or doesn't belong to user (from service)
   * @throws {AppError} 400 - If deletion fails
   * @throws {AppError} 500 - If database delete fails
   *
   * @example
   * // Request
   * DELETE /api/transactions/clx123...
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   *
   * // Success Response (204 No Content)
   * (empty body)
   *
   * // Error Response (404 Not Found)
   * { "message": "Transaction with ID 'clx123...' not found" }
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      await transactionService.delete(req.params.id, req.userId!)
      res.status(HttpStatus.NO_CONTENT).send()
    } catch (error) {
      if (isAppError(error)) {
        res.status(error.statusCode).json({ message: error.message })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to delete transaction'
      res.status(HttpStatus.BAD_REQUEST).json({ message })
    }
  },
}
