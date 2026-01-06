/**
 * @fileoverview Budget management service for creating and tracking spending budgets.
 *
 * This service handles CRUD operations for budgets, which allow users to:
 * - Set spending limits by category
 * - Track spending against budgets
 * - Monitor budget utilization over time
 *
 * Budgets are linked to transactions through the category field.
 * When transactions are created with a matching category and budgetId,
 * the budget's spent amount is automatically updated.
 *
 * @module services/budgets
 */

import { prisma } from '../lib/prisma.js'
import { Budget } from '@prisma/client'
import { createLogger } from '../lib/logger.js'
import { AppError } from '../utils/errors.js'

const logger = createLogger('budget-service')

/**
 * Data required to create a new budget.
 *
 * @interface CreateBudgetInput
 * @property {string} name - Descriptive name for the budget (e.g., "Groceries", "Entertainment")
 * @property {number} amount - Target budget amount in dollars
 * @property {string} category - Spending category this budget tracks
 */
export interface CreateBudgetInput {
  name: string
  amount: number
  category: string
}

/**
 * Data for updating an existing budget.
 * All fields are optional - only provided fields will be updated.
 *
 * @interface UpdateBudgetInput
 * @property {string} [name] - Updated budget name
 * @property {number} [amount] - Updated target amount
 * @property {string} [category] - Updated category
 * @property {number} [spent] - Current spent amount (usually updated automatically)
 */
export interface UpdateBudgetInput {
  name?: string
  amount?: number
  category?: string
  spent?: number
}

/**
 * Budget service providing CRUD operations for budget management.
 *
 * All operations verify user ownership before modifying data.
 *
 * @example
 * // Create a new budget
 * const budget = await budgetService.create(userId, {
 *   name: 'Monthly Groceries',
 *   amount: 500,
 *   category: 'Groceries'
 * });
 *
 * @example
 * // Get all budgets for a user
 * const budgets = await budgetService.getAll(userId);
 * budgets.forEach(b => {
 *   const utilization = (b.spent / b.amount) * 100;
 *   console.log(`${b.name}: ${utilization.toFixed(1)}% used`);
 * });
 */
export const budgetService = {
  /**
   * Retrieves all budgets for a user.
   *
   * Returns budgets ordered by creation date (newest first).
   *
   * @param {string} userId - The ID of the user
   *
   * @returns {Promise<Budget[]>} Array of budget records
   *
   * @example
   * const budgets = await budgetService.getAll('user123');
   * // Returns: [{ id: '...', name: 'Groceries', amount: 500, spent: 250 }, ...]
   */
  async getAll(userId: string): Promise<Budget[]> {
    logger.debug('Fetching all budgets', { userId })

    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    logger.debug('Budgets fetched', { userId, count: budgets.length })
    return budgets
  },

  /**
   * Retrieves a single budget by ID.
   *
   * Returns null if budget not found or doesn't belong to user.
   *
   * @param {string} id - The budget ID
   * @param {string} userId - The ID of the user (for ownership verification)
   *
   * @returns {Promise<Budget | null>} Budget record or null if not found
   *
   * @example
   * const budget = await budgetService.getById('budget123', 'user123');
   * if (!budget) {
   *   throw AppError.notFound('Budget', 'budget123');
   * }
   */
  async getById(id: string, userId: string): Promise<Budget | null> {
    logger.debug('Fetching budget by ID', { budgetId: id, userId })

    return prisma.budget.findFirst({
      where: { id, userId },
    })
  },

  /**
   * Creates a new budget for a user.
   *
   * The budget starts with spent = 0. Spending is tracked automatically
   * when transactions are linked to this budget.
   *
   * @param {string} userId - The ID of the user who owns this budget
   * @param {CreateBudgetInput} data - Budget creation data
   *
   * @returns {Promise<Budget>} The newly created budget
   *
   * @example
   * const budget = await budgetService.create('user123', {
   *   name: 'Dining Out',
   *   amount: 200,
   *   category: 'Dining'
   * });
   * console.log(`Created budget with ID: ${budget.id}`);
   */
  async create(userId: string, data: CreateBudgetInput): Promise<Budget> {
    logger.info('Creating budget', {
      userId,
      name: data.name,
      amount: data.amount,
      category: data.category,
    })

    const budget = await prisma.budget.create({
      data: {
        ...data,
        userId,
      },
    })

    logger.info('Budget created', { budgetId: budget.id, userId })
    return budget
  },

  /**
   * Updates an existing budget.
   *
   * Verifies user ownership before updating. Only provided fields
   * will be updated; others remain unchanged.
   *
   * @param {string} id - The budget ID to update
   * @param {string} userId - The ID of the user (for ownership verification)
   * @param {UpdateBudgetInput} data - Fields to update
   *
   * @returns {Promise<Budget>} The updated budget
   *
   * @throws {AppError} 404 - If budget not found or doesn't belong to user
   *
   * @example
   * // Increase budget amount
   * const updated = await budgetService.update('budget123', 'user123', {
   *   amount: 750
   * });
   */
  async update(id: string, userId: string, data: UpdateBudgetInput): Promise<Budget> {
    logger.info('Updating budget', { budgetId: id, userId, updates: data })

    // Verify ownership
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    })

    if (!budget) {
      logger.warn('Budget not found for update', { budgetId: id, userId })
      throw AppError.notFound('Budget', id)
    }

    const updated = await prisma.budget.update({
      where: { id },
      data,
    })

    logger.info('Budget updated', { budgetId: id, userId })
    return updated
  },

  /**
   * Deletes a budget.
   *
   * Verifies user ownership before deleting. Transactions linked to
   * this budget will have their budgetId set to null (not deleted).
   *
   * @param {string} id - The budget ID to delete
   * @param {string} userId - The ID of the user (for ownership verification)
   *
   * @returns {Promise<Budget>} The deleted budget
   *
   * @throws {AppError} 404 - If budget not found or doesn't belong to user
   *
   * @example
   * const deleted = await budgetService.delete('budget123', 'user123');
   * console.log(`Deleted budget: ${deleted.name}`);
   */
  async delete(id: string, userId: string): Promise<Budget> {
    logger.info('Deleting budget', { budgetId: id, userId })

    // Verify ownership
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    })

    if (!budget) {
      logger.warn('Budget not found for deletion', { budgetId: id, userId })
      throw AppError.notFound('Budget', id)
    }

    await prisma.budget.delete({
      where: { id },
    })

    logger.info('Budget deleted', { budgetId: id, userId })
    return budget
  },
}
