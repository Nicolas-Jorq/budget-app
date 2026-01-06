/**
 * @fileoverview Bank Account management service.
 *
 * This service handles CRUD operations for bank accounts, which are used
 * to organize and track bank statement uploads. Each user can have multiple
 * bank accounts representing different credit cards or bank accounts.
 *
 * Key features:
 * - Account types: Credit cards, checking, savings, investment accounts
 * - Ownership verification on all operations
 * - Document count tracking for each account
 *
 * @module services/bank-accounts
 */

import { prisma } from '../lib/prisma.js'
import { AccountType, BankAccount } from '@prisma/client'
import { createLogger } from '../lib/logger.js'
import { AppError } from '../utils/errors.js'

const logger = createLogger('bank-account-service')

/**
 * Data required to create a new bank account.
 *
 * @interface CreateBankAccountData
 * @property {string} name - User-friendly name (e.g., "Chase Freedom", "Main Checking")
 * @property {string} bankName - Financial institution name (e.g., "Chase", "Bank of America")
 * @property {AccountType} accountType - Type of account (CREDIT_CARD, CHECKING, SAVINGS, INVESTMENT)
 * @property {string} [lastFour] - Last 4 digits of account/card number for identification
 */
export interface CreateBankAccountData {
  name: string
  bankName: string
  accountType: AccountType
  lastFour?: string
}

/**
 * Data for updating an existing bank account.
 * All fields are optional - only provided fields will be updated.
 *
 * @interface UpdateBankAccountData
 * @property {string} [name] - Updated account name
 * @property {string} [bankName] - Updated bank name
 * @property {AccountType} [accountType] - Updated account type
 * @property {string} [lastFour] - Updated last 4 digits
 * @property {boolean} [isActive] - Whether account is active (inactive accounts are hidden)
 */
export interface UpdateBankAccountData {
  name?: string
  bankName?: string
  accountType?: AccountType
  lastFour?: string
  isActive?: boolean
}

/**
 * Bank account with document count.
 *
 * @interface BankAccountWithCounts
 * @extends BankAccount
 * @property {Object} _count - Count aggregations
 * @property {number} _count.documents - Number of documents uploaded to this account
 */
export interface BankAccountWithCounts extends BankAccount {
  _count: {
    documents: number
  }
}

/**
 * Bank account service providing CRUD operations for bank account management.
 *
 * All operations verify user ownership before modifying data.
 *
 * @example
 * // Get all accounts for a user
 * const accounts = await bankAccountService.getAll(userId);
 *
 * // Create a new credit card
 * const card = await bankAccountService.create(userId, {
 *   name: 'Chase Sapphire',
 *   bankName: 'Chase',
 *   accountType: 'CREDIT_CARD',
 *   lastFour: '4567'
 * });
 */
export const bankAccountService = {
  /**
   * Retrieves all bank accounts for a user.
   *
   * Returns accounts ordered by creation date (newest first) with
   * document count for each account.
   *
   * @param {string} userId - The ID of the user
   *
   * @returns {Promise<BankAccountWithCounts[]>} Array of bank accounts with document counts
   *
   * @example
   * const accounts = await bankAccountService.getAll('user123');
   * // Returns: [{ id: '...', name: 'Chase Freedom', _count: { documents: 5 } }, ...]
   */
  async getAll(userId: string): Promise<BankAccountWithCounts[]> {
    logger.debug('Fetching all bank accounts', { userId })

    const accounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    })

    logger.debug('Bank accounts fetched', { userId, count: accounts.length })
    return accounts
  },

  /**
   * Retrieves a single bank account by ID with recent documents.
   *
   * Includes the 5 most recent documents uploaded to this account.
   * Returns null if account not found or doesn't belong to user.
   *
   * @param {string} id - The bank account ID
   * @param {string} userId - The ID of the user (for ownership verification)
   *
   * @returns {Promise<BankAccountWithCounts | null>} Bank account with documents or null
   *
   * @example
   * const account = await bankAccountService.getById('acct123', 'user123');
   * if (!account) {
   *   throw AppError.notFound('Bank account', 'acct123');
   * }
   */
  async getById(id: string, userId: string) {
    logger.debug('Fetching bank account', { id, userId })

    return prisma.bankAccount.findFirst({
      where: { id, userId },
      include: {
        documents: {
          orderBy: { uploadedAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { documents: true },
        },
      },
    })
  },

  /**
   * Creates a new bank account for a user.
   *
   * @param {string} userId - The ID of the user who owns this account
   * @param {CreateBankAccountData} data - Account creation data
   *
   * @returns {Promise<BankAccount>} The newly created bank account
   *
   * @example
   * const account = await bankAccountService.create('user123', {
   *   name: 'Amex Gold',
   *   bankName: 'American Express',
   *   accountType: 'CREDIT_CARD',
   *   lastFour: '1234'
   * });
   */
  async create(userId: string, data: CreateBankAccountData): Promise<BankAccount> {
    logger.info('Creating bank account', {
      userId,
      name: data.name,
      bankName: data.bankName,
      accountType: data.accountType,
    })

    const account = await prisma.bankAccount.create({
      data: {
        ...data,
        userId,
      },
    })

    logger.info('Bank account created', { userId, accountId: account.id })
    return account
  },

  /**
   * Updates an existing bank account.
   *
   * Verifies user ownership before updating. Only provided fields
   * will be updated; others remain unchanged.
   *
   * @param {string} id - The bank account ID to update
   * @param {string} userId - The ID of the user (for ownership verification)
   * @param {UpdateBankAccountData} data - Fields to update
   *
   * @returns {Promise<BankAccount>} The updated bank account
   *
   * @throws {AppError} 404 - If account not found or doesn't belong to user
   *
   * @example
   * const updated = await bankAccountService.update('acct123', 'user123', {
   *   name: 'Updated Name',
   *   isActive: false
   * });
   */
  async update(id: string, userId: string, data: UpdateBankAccountData): Promise<BankAccount> {
    logger.info('Updating bank account', { id, userId, fields: Object.keys(data) })

    // Verify ownership
    const existing = await prisma.bankAccount.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      logger.warn('Bank account not found for update', { id, userId })
      throw AppError.notFound('Bank account', id)
    }

    const updated = await prisma.bankAccount.update({
      where: { id },
      data,
    })

    logger.info('Bank account updated', { id, userId })
    return updated
  },

  /**
   * Deletes a bank account.
   *
   * Verifies user ownership before deleting. Associated documents
   * will have their bankAccountId set to null (not deleted).
   *
   * @param {string} id - The bank account ID to delete
   * @param {string} userId - The ID of the user (for ownership verification)
   *
   * @returns {Promise<BankAccount>} The deleted bank account
   *
   * @throws {AppError} 404 - If account not found or doesn't belong to user
   *
   * @example
   * await bankAccountService.delete('acct123', 'user123');
   */
  async delete(id: string, userId: string): Promise<BankAccount> {
    logger.info('Deleting bank account', { id, userId })

    // Verify ownership
    const existing = await prisma.bankAccount.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      logger.warn('Bank account not found for deletion', { id, userId })
      throw AppError.notFound('Bank account', id)
    }

    const deleted = await prisma.bankAccount.delete({
      where: { id },
    })

    logger.info('Bank account deleted', { id, userId })
    return deleted
  },
}
