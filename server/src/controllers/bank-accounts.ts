/**
 * @fileoverview Bank Account management controller for the Budget App.
 *
 * This controller handles all HTTP endpoints related to bank account management, including:
 * - Retrieving all bank accounts for a user
 * - Getting individual bank account details
 * - Creating new bank accounts (credit cards, checking, savings, investment)
 * - Updating existing bank account information
 * - Deleting bank accounts
 *
 * Bank accounts are used to organize and categorize uploaded bank statements.
 * Each user can have multiple bank accounts representing different financial
 * institutions and account types.
 *
 * @module controllers/bank-accounts
 *
 * @example
 * // Route setup
 * router.get('/bank-accounts', bankAccountController.getAll);
 * router.get('/bank-accounts/:id', bankAccountController.getById);
 * router.post('/bank-accounts', bankAccountController.create);
 * router.put('/bank-accounts/:id', bankAccountController.update);
 * router.delete('/bank-accounts/:id', bankAccountController.delete);
 */

import { Response } from 'express'
import { bankAccountService } from '../services/bank-accounts.js'
import { AuthRequest } from '../middleware/auth.js'
import { AppError, isAppError } from '../utils/errors.js'

/**
 * Bank account controller providing HTTP request handlers for account management.
 *
 * All endpoints require authentication and verify user ownership before
 * returning or modifying bank account data.
 *
 * @example
 * // Using in Express router
 * router.get('/bank-accounts', bankAccountController.getAll);
 * router.post('/bank-accounts', bankAccountController.create);
 */
export const bankAccountController = {
  /**
   * Retrieves all bank accounts for the authenticated user.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with array of bank accounts
   *
   * @throws {AppError} 500 - Failed to fetch bank accounts
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns array of bank accounts with document counts
   * - 500: Internal server error
   *
   * Response includes document counts for each account, showing how many
   * bank statements have been uploaded to each account.
   *
   * @example
   * // GET /api/bank-accounts
   * // Response: [
   * //   { id: '...', name: 'Chase Freedom', bankName: 'Chase', accountType: 'CREDIT_CARD', _count: { documents: 5 } },
   * //   { id: '...', name: 'Main Checking', bankName: 'BOA', accountType: 'CHECKING', _count: { documents: 12 } }
   * // ]
   */
  async getAll(req: AuthRequest, res: Response) {
    try {
      const accounts = await bankAccountService.getAll(req.userId!)
      res.json(accounts)
    } catch (error) {
      console.error('Bank accounts error:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ message: 'Failed to fetch bank accounts' })
    }
  },

  /**
   * Retrieves a single bank account by ID with recent documents.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.id - The bank account ID to retrieve
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with bank account details
   *
   * @throws {AppError} 404 - Bank account not found
   * @throws {AppError} 500 - Failed to fetch bank account
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns bank account with recent documents
   * - 404: Bank account not found or doesn't belong to user
   * - 500: Internal server error
   *
   * Response includes the 5 most recent documents uploaded to this account.
   *
   * @example
   * // GET /api/bank-accounts/:id
   * // Response: {
   * //   id: '...',
   * //   name: 'Chase Freedom',
   * //   bankName: 'Chase',
   * //   accountType: 'CREDIT_CARD',
   * //   lastFour: '1234',
   * //   documents: [...],
   * //   _count: { documents: 5 }
   * // }
   */
  async getById(req: AuthRequest, res: Response) {
    try {
      const account = await bankAccountService.getById(req.params.id, req.userId!)
      if (!account) {
        throw AppError.notFound('Bank account', req.params.id)
      }
      res.json(account)
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ message: 'Failed to fetch bank account' })
    }
  },

  /**
   * Creates a new bank account for the authenticated user.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {Object} req.body - Bank account creation data
   * @param {string} req.body.name - User-friendly name (e.g., "Chase Freedom", "Main Checking")
   * @param {string} req.body.bankName - Financial institution name (e.g., "Chase", "Bank of America")
   * @param {string} req.body.accountType - Account type: CREDIT_CARD, CHECKING, SAVINGS, or INVESTMENT
   * @param {string} [req.body.lastFour] - Last 4 digits of account/card number for identification
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with created bank account
   *
   * @throws {AppError} 400 - Missing required fields or validation error
   * @throws {AppError} 500 - Failed to create bank account
   *
   * @description
   * HTTP Response Codes:
   * - 201: Created - Returns newly created bank account
   * - 400: Validation error (missing required fields)
   * - 500: Internal server error
   *
   * @example
   * // POST /api/bank-accounts
   * // Body: {
   * //   name: 'Chase Sapphire',
   * //   bankName: 'Chase',
   * //   accountType: 'CREDIT_CARD',
   * //   lastFour: '5678'
   * // }
   * // Response: { id: '...', name: 'Chase Sapphire', bankName: 'Chase', ... }
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const { name, bankName, accountType, lastFour } = req.body

      if (!name || !bankName || !accountType) {
        throw AppError.validation(
          'Name, bankName, and accountType are required',
          {
            missing: [
              !name && 'name',
              !bankName && 'bankName',
              !accountType && 'accountType'
            ].filter(Boolean)
          }
        )
      }

      const account = await bankAccountService.create(req.userId!, {
        name,
        bankName,
        accountType,
        lastFour
      })
      res.status(201).json(account)
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      const message = error instanceof Error ? error.message : 'Failed to create bank account'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json(appError.toJSON())
    }
  },

  /**
   * Updates an existing bank account.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.id - The bank account ID to update
   * @param {Object} req.body - Fields to update (all optional)
   * @param {string} [req.body.name] - Updated account name
   * @param {string} [req.body.bankName] - Updated bank name
   * @param {string} [req.body.accountType] - Updated account type
   * @param {string} [req.body.lastFour] - Updated last 4 digits
   * @param {boolean} [req.body.isActive] - Whether account is active (inactive accounts are hidden)
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with updated bank account
   *
   * @throws {AppError} 404 - Bank account not found
   * @throws {AppError} 400 - Validation error
   * @throws {AppError} 500 - Failed to update bank account
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns updated bank account
   * - 400: Validation error
   * - 404: Bank account not found
   * - 500: Internal server error
   *
   * Only provided fields will be updated; others remain unchanged.
   *
   * @example
   * // PUT /api/bank-accounts/:id
   * // Body: { name: 'Updated Name', isActive: false }
   * // Response: { id: '...', name: 'Updated Name', isActive: false, ... }
   */
  async update(req: AuthRequest, res: Response) {
    try {
      const account = await bankAccountService.update(req.params.id, req.userId!, req.body)
      res.json(account)
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      const message = error instanceof Error ? error.message : 'Failed to update bank account'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json(appError.toJSON())
    }
  },

  /**
   * Deletes a bank account.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.id - The bank account ID to delete
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends 204 No Content on success
   *
   * @throws {AppError} 404 - Bank account not found
   * @throws {AppError} 400 - Deletion failed (e.g., constraint violation)
   * @throws {AppError} 500 - Failed to delete bank account
   *
   * @description
   * HTTP Response Codes:
   * - 204: No Content - Bank account successfully deleted
   * - 400: Deletion failed
   * - 404: Bank account not found
   * - 500: Internal server error
   *
   * Note: Associated documents will have their bankAccountId set to null
   * (documents are not deleted when the bank account is deleted).
   *
   * @example
   * // DELETE /api/bank-accounts/:id
   * // Response: 204 No Content
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      await bankAccountService.delete(req.params.id, req.userId!)
      res.status(204).send()
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      const message = error instanceof Error ? error.message : 'Failed to delete bank account'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json(appError.toJSON())
    }
  }
}
