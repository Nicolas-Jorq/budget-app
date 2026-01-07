/**
 * @fileoverview Transaction management service for income and expense tracking.
 *
 * This service handles CRUD operations for financial transactions, including:
 * - Recording income and expense transactions
 * - Automatic budget synchronization when transactions are linked to budgets
 * - Category-based organization
 *
 * Budget Synchronization:
 * When a transaction is linked to a budget (via budgetId):
 * - Creating an expense increases the budget's spent amount
 * - Updating a transaction recalculates the budget's spent amount
 * - Deleting a transaction decreases the budget's spent amount
 *
 * @module services/transactions
 */

import { prisma } from '../lib/prisma.js'
import { Transaction } from '@prisma/client'
import { createLogger } from '../lib/logger.js'
import { AppError } from '../utils/errors.js'
import { checkBudgetAlerts } from './budget-alerts.js'

const logger = createLogger('transaction-service')

/**
 * Transaction type constants for type safety.
 */
export type TransactionType = 'income' | 'expense'

/**
 * Data required to create a new transaction.
 *
 * @interface CreateTransactionInput
 * @property {string} description - Description of the transaction
 * @property {number} amount - Transaction amount (always positive)
 * @property {TransactionType} type - Whether this is income or expense
 * @property {string} category - Category for organization (e.g., "Groceries", "Salary")
 * @property {string} date - ISO date string for when the transaction occurred
 * @property {string} [budgetId] - Optional budget to link this transaction to
 */
export interface CreateTransactionInput {
  description: string
  amount: number
  type: TransactionType
  category: string
  date: string
  budgetId?: string
}

/**
 * Data for updating an existing transaction.
 * All fields are optional - only provided fields will be updated.
 *
 * @interface UpdateTransactionInput
 * @property {string} [description] - Updated description
 * @property {number} [amount] - Updated amount
 * @property {TransactionType} [type] - Updated type (income/expense)
 * @property {string} [category] - Updated category
 * @property {string} [date] - Updated date
 * @property {string | null} [budgetId] - Updated budget link (null to unlink)
 */
export interface UpdateTransactionInput {
  description?: string
  amount?: number
  type?: TransactionType
  category?: string
  date?: string
  budgetId?: string | null
}

/**
 * Transaction with related budget information.
 *
 * @interface TransactionWithBudget
 * @extends Transaction
 * @property {Object | null} budget - The linked budget, if any
 */
export interface TransactionWithBudget extends Transaction {
  budget: {
    id: string
    name: string
    category: string
    amount: number
    spent: number
  } | null
}

/**
 * Transaction service providing CRUD operations with automatic budget tracking.
 *
 * Key Features:
 * - Automatic budget spent amount updates
 * - Budget amount recalculation on updates
 * - Proper cleanup on deletion
 *
 * @example
 * // Create an expense linked to a budget
 * const transaction = await transactionService.create(userId, {
 *   description: 'Weekly groceries',
 *   amount: 85.50,
 *   type: 'expense',
 *   category: 'Groceries',
 *   date: '2024-01-15',
 *   budgetId: 'budget123'  // Automatically updates budget.spent
 * });
 *
 * @example
 * // Create income (not linked to budget)
 * const income = await transactionService.create(userId, {
 *   description: 'Salary',
 *   amount: 5000,
 *   type: 'income',
 *   category: 'Salary',
 *   date: '2024-01-01'
 * });
 */
export const transactionService = {
  /**
   * Retrieves all transactions for a user.
   *
   * Returns transactions ordered by date (newest first) with
   * linked budget information included.
   *
   * @param {string} userId - The ID of the user
   *
   * @returns {Promise<TransactionWithBudget[]>} Array of transactions with budget info
   *
   * @example
   * const transactions = await transactionService.getAll('user123');
   * const totalIncome = transactions
   *   .filter(t => t.type === 'income')
   *   .reduce((sum, t) => sum + Number(t.amount), 0);
   */
  async getAll(userId: string): Promise<TransactionWithBudget[]> {
    logger.debug('Fetching all transactions', { userId })

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: { budget: true },
    })

    logger.debug('Transactions fetched', { userId, count: transactions.length })
    return transactions as TransactionWithBudget[]
  },

  /**
   * Retrieves a single transaction by ID.
   *
   * Returns null if transaction not found or doesn't belong to user.
   *
   * @param {string} id - The transaction ID
   * @param {string} userId - The ID of the user (for ownership verification)
   *
   * @returns {Promise<TransactionWithBudget | null>} Transaction with budget info or null
   *
   * @example
   * const transaction = await transactionService.getById('txn123', 'user123');
   * if (!transaction) {
   *   throw AppError.notFound('Transaction', 'txn123');
   * }
   */
  async getById(id: string, userId: string): Promise<TransactionWithBudget | null> {
    logger.debug('Fetching transaction by ID', { transactionId: id, userId })

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { budget: true },
    })

    return transaction as TransactionWithBudget | null
  },

  /**
   * Creates a new transaction.
   *
   * If the transaction is an expense linked to a budget, the budget's
   * spent amount is automatically increased.
   *
   * @param {string} userId - The ID of the user who owns this transaction
   * @param {CreateTransactionInput} data - Transaction creation data
   *
   * @returns {Promise<Transaction>} The newly created transaction
   *
   * @example
   * // Create expense with budget tracking
   * const expense = await transactionService.create('user123', {
   *   description: 'Coffee',
   *   amount: 5.50,
   *   type: 'expense',
   *   category: 'Dining',
   *   date: '2024-01-15',
   *   budgetId: 'dining-budget-id'
   * });
   *
   * @example
   * // Create income without budget
   * const income = await transactionService.create('user123', {
   *   description: 'Freelance payment',
   *   amount: 500,
   *   type: 'income',
   *   category: 'Freelance',
   *   date: '2024-01-10'
   * });
   */
  async create(userId: string, data: CreateTransactionInput): Promise<Transaction> {
    logger.info('Creating transaction', {
      userId,
      type: data.type,
      amount: data.amount,
      category: data.category,
      budgetId: data.budgetId,
    })

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        date: new Date(data.date),
        userId,
      },
    })

    // Update budget spent amount if linked to a budget (expenses only)
    if (data.budgetId && data.type === 'expense') {
      logger.debug('Updating budget spent amount', {
        budgetId: data.budgetId,
        increment: data.amount,
      })

      const updatedBudget = await prisma.budget.update({
        where: { id: data.budgetId },
        data: {
          spent: { increment: data.amount },
        },
      })

      // Check for budget alerts after updating spent amount
      await checkBudgetAlerts(updatedBudget)
    }

    logger.info('Transaction created', { transactionId: transaction.id, userId })
    return transaction
  },

  /**
   * Updates an existing transaction.
   *
   * Handles budget synchronization:
   * 1. Reverts the old amount from the old budget (if any)
   * 2. Applies the new amount to the new budget (if any)
   *
   * This ensures budget spent amounts stay accurate when:
   * - Amount changes
   * - Budget link changes
   * - Type changes (expense to income or vice versa)
   *
   * @param {string} id - The transaction ID to update
   * @param {string} userId - The ID of the user (for ownership verification)
   * @param {UpdateTransactionInput} data - Fields to update
   *
   * @returns {Promise<Transaction>} The updated transaction
   *
   * @throws {AppError} 404 - If transaction not found or doesn't belong to user
   *
   * @example
   * // Update amount and description
   * const updated = await transactionService.update('txn123', 'user123', {
   *   amount: 100,
   *   description: 'Updated description'
   * });
   *
   * @example
   * // Move transaction to different budget
   * const moved = await transactionService.update('txn123', 'user123', {
   *   budgetId: 'new-budget-id'  // Old budget's spent decreases, new budget's spent increases
   * });
   */
  async update(id: string, userId: string, data: UpdateTransactionInput): Promise<Transaction> {
    logger.info('Updating transaction', { transactionId: id, userId, updates: data })

    // Verify ownership and get existing data
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      logger.warn('Transaction not found for update', { transactionId: id, userId })
      throw AppError.notFound('Transaction', id)
    }

    // Step 1: Revert amount from old budget (if it was an expense with a budget)
    if (existing.budgetId && existing.type === 'expense') {
      logger.debug('Reverting previous budget amount', {
        budgetId: existing.budgetId,
        decrement: existing.amount,
      })

      await prisma.budget.update({
        where: { id: existing.budgetId },
        data: {
          spent: { decrement: Number(existing.amount) },
        },
      })
    }

    // Step 2: Update the transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    })

    // Step 3: Add new amount to new budget (if it's an expense with a budget)
    const newBudgetId = data.budgetId ?? existing.budgetId
    const newType = data.type ?? existing.type
    const newAmount = data.amount ?? Number(existing.amount)

    if (newBudgetId && newType === 'expense') {
      logger.debug('Applying new budget amount', {
        budgetId: newBudgetId,
        increment: newAmount,
      })

      const updatedBudget = await prisma.budget.update({
        where: { id: newBudgetId },
        data: {
          spent: { increment: newAmount },
        },
      })

      // Check for budget alerts after updating spent amount
      await checkBudgetAlerts(updatedBudget)
    }

    logger.info('Transaction updated', { transactionId: id, userId })
    return transaction
  },

  /**
   * Deletes a transaction.
   *
   * If the transaction was an expense linked to a budget, the budget's
   * spent amount is automatically decreased.
   *
   * @param {string} id - The transaction ID to delete
   * @param {string} userId - The ID of the user (for ownership verification)
   *
   * @returns {Promise<Transaction>} The deleted transaction
   *
   * @throws {AppError} 404 - If transaction not found or doesn't belong to user
   *
   * @example
   * const deleted = await transactionService.delete('txn123', 'user123');
   * console.log(`Deleted: ${deleted.description}`);
   */
  async delete(id: string, userId: string): Promise<Transaction> {
    logger.info('Deleting transaction', { transactionId: id, userId })

    // Verify ownership and get existing data
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
    })

    if (!transaction) {
      logger.warn('Transaction not found for deletion', { transactionId: id, userId })
      throw AppError.notFound('Transaction', id)
    }

    // Revert budget amount if linked (expenses only)
    if (transaction.budgetId && transaction.type === 'expense') {
      logger.debug('Reverting budget amount on delete', {
        budgetId: transaction.budgetId,
        decrement: transaction.amount,
      })

      await prisma.budget.update({
        where: { id: transaction.budgetId },
        data: {
          spent: { decrement: Number(transaction.amount) },
        },
      })
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id },
    })

    logger.info('Transaction deleted', { transactionId: id, userId })
    return transaction
  },
}
