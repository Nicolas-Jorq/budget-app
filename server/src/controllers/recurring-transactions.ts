/**
 * @fileoverview Recurring Transactions Controller
 *
 * Handles HTTP requests for recurring transaction management.
 *
 * @module controllers/recurring-transactions
 */

import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { recurringTransactionService } from '../services/recurring-transactions.js'
import { isAppError } from '../utils/errors.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('recurring-transactions-controller')

export const recurringTransactionsController = {
  /**
   * GET /api/recurring
   * Get all recurring transactions for the authenticated user
   */
  async getAll(req: AuthRequest, res: Response) {
    try {
      const recurring = await recurringTransactionService.getAll(req.userId!)
      res.json(recurring)
    } catch (error) {
      logger.error('Failed to get recurring transactions', { error, userId: req.userId })
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ message: 'Failed to get recurring transactions' })
    }
  },

  /**
   * GET /api/recurring/:id
   * Get a single recurring transaction
   */
  async getById(req: AuthRequest, res: Response) {
    try {
      const recurring = await recurringTransactionService.getById(req.params.id, req.userId!)
      if (!recurring) {
        return res.status(404).json({ message: 'Recurring transaction not found' })
      }
      res.json(recurring)
    } catch (error) {
      logger.error('Failed to get recurring transaction', { error, id: req.params.id })
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ message: 'Failed to get recurring transaction' })
    }
  },

  /**
   * POST /api/recurring
   * Create a new recurring transaction
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const recurring = await recurringTransactionService.create(req.userId!, req.body)
      res.status(201).json(recurring)
    } catch (error) {
      logger.error('Failed to create recurring transaction', { error, userId: req.userId })
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ message: 'Failed to create recurring transaction' })
    }
  },

  /**
   * PUT /api/recurring/:id
   * Update a recurring transaction
   */
  async update(req: AuthRequest, res: Response) {
    try {
      const recurring = await recurringTransactionService.update(
        req.params.id,
        req.userId!,
        req.body
      )
      res.json(recurring)
    } catch (error) {
      logger.error('Failed to update recurring transaction', { error, id: req.params.id })
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ message: 'Failed to update recurring transaction' })
    }
  },

  /**
   * DELETE /api/recurring/:id
   * Delete a recurring transaction
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      await recurringTransactionService.delete(req.params.id, req.userId!)
      res.status(204).send()
    } catch (error) {
      logger.error('Failed to delete recurring transaction', { error, id: req.params.id })
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ message: 'Failed to delete recurring transaction' })
    }
  },

  /**
   * POST /api/recurring/process
   * Process all due recurring transactions and generate instances
   */
  async processDue(req: AuthRequest, res: Response) {
    try {
      const transactions = await recurringTransactionService.processDueTransactions(req.userId!)
      res.json({
        message: `Generated ${transactions.length} transaction(s)`,
        transactions,
      })
    } catch (error) {
      logger.error('Failed to process due transactions', { error, userId: req.userId })
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ message: 'Failed to process due transactions' })
    }
  },

  /**
   * GET /api/recurring/upcoming
   * Get upcoming recurring transactions for next N days
   */
  async getUpcoming(req: AuthRequest, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30
      const upcoming = await recurringTransactionService.getUpcoming(req.userId!, days)
      res.json(upcoming)
    } catch (error) {
      logger.error('Failed to get upcoming transactions', { error, userId: req.userId })
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ message: 'Failed to get upcoming transactions' })
    }
  },

  /**
   * GET /api/recurring/:id/transactions
   * Get transactions generated from a recurring transaction
   */
  async getGeneratedTransactions(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10
      const transactions = await recurringTransactionService.getGeneratedTransactions(
        req.params.id,
        req.userId!,
        limit
      )
      res.json(transactions)
    } catch (error) {
      logger.error('Failed to get generated transactions', { error, id: req.params.id })
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ message: 'Failed to get generated transactions' })
    }
  },

  /**
   * POST /api/recurring/:id/skip
   * Skip the next occurrence of a recurring transaction
   */
  async skipNext(req: AuthRequest, res: Response) {
    try {
      const recurring = await recurringTransactionService.skipNext(req.params.id, req.userId!)
      res.json(recurring)
    } catch (error) {
      logger.error('Failed to skip next occurrence', { error, id: req.params.id })
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ message: 'Failed to skip next occurrence' })
    }
  },
}
