/**
 * @fileoverview Savings Goals Service for the Budget App.
 *
 * This service provides comprehensive functionality for managing user savings goals
 * and their associated contributions. It enables users to:
 * - Create, read, update, and delete savings goals
 * - Track progress towards financial targets
 * - Add and remove contributions to goals
 * - View aggregated summaries for dashboard displays
 *
 * The service uses Prisma ORM for database operations and ensures data integrity
 * through atomic transactions when updating goal amounts. All operations are
 * scoped to the authenticated user to maintain data isolation.
 *
 * @module services/goals
 * @see {@link goalsService} - The main service object containing all goal operations
 *
 * @example
 * // Import and use the goals service
 * import { goalsService } from './services/goals.js';
 *
 * // Get all goals for a user
 * const goals = await goalsService.getAll(userId);
 *
 * // Create a new savings goal
 * const goal = await goalsService.create(userId, {
 *   name: 'Emergency Fund',
 *   type: 'EMERGENCY',
 *   targetAmount: 10000,
 *   deadline: '2024-12-31',
 * });
 */

import { GoalType, Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { createLogger } from '../lib/logger.js'
import { AppError } from '../utils/errors.js'

/**
 * Logger instance for the goals service.
 * Used for tracking operations, debugging, and monitoring.
 */
const logger = createLogger('goals-service')

/**
 * Input data required to create a new savings goal.
 *
 * @interface CreateGoalInput
 *
 * @property {string} name - The display name for the goal (e.g., "Vacation Fund", "Emergency Savings")
 * @property {GoalType} type - The category/type of the goal from the GoalType enum
 * @property {number} targetAmount - The target amount to save, in the user's currency
 * @property {string} [deadline] - Optional ISO 8601 date string for when the goal should be completed
 * @property {number} [priority] - Optional priority level for sorting (lower number = higher priority, defaults to 1)
 * @property {string} [icon] - Optional icon identifier for UI display
 * @property {string} [color] - Optional color code (hex or named) for UI theming
 * @property {Record<string, unknown>} [metadata] - Optional additional metadata for extensibility
 *
 * @example
 * const input: CreateGoalInput = {
 *   name: 'New Car',
 *   type: 'SAVINGS',
 *   targetAmount: 25000,
 *   deadline: '2025-06-15',
 *   priority: 2,
 *   icon: 'car',
 *   color: '#4CAF50',
 * };
 */
export interface CreateGoalInput {
  name: string
  type: GoalType
  targetAmount: number
  deadline?: string
  priority?: number
  icon?: string
  color?: string
  metadata?: Record<string, unknown>
}

/**
 * Input data for updating an existing savings goal.
 * All fields are optional; only provided fields will be updated.
 *
 * @interface UpdateGoalInput
 *
 * @property {string} [name] - Updated display name for the goal
 * @property {GoalType} [type] - Updated goal category/type
 * @property {number} [targetAmount] - Updated target amount to save
 * @property {string | null} [deadline] - Updated deadline (null to remove deadline)
 * @property {number} [priority] - Updated priority level for sorting
 * @property {string} [icon] - Updated icon identifier
 * @property {string} [color] - Updated color code
 * @property {Record<string, unknown>} [metadata] - Updated metadata object
 * @property {boolean} [isCompleted] - Manually mark goal as completed/incomplete
 *
 * @example
 * const update: UpdateGoalInput = {
 *   targetAmount: 30000,  // Increase target
 *   deadline: null,       // Remove deadline
 * };
 */
export interface UpdateGoalInput {
  name?: string
  type?: GoalType
  targetAmount?: number
  deadline?: string | null
  priority?: number
  icon?: string
  color?: string
  metadata?: Record<string, unknown>
  isCompleted?: boolean
}

/**
 * Input data for creating a new contribution to a savings goal.
 *
 * @interface CreateContributionInput
 *
 * @property {number} amount - The contribution amount (must be positive)
 * @property {string} [note] - Optional note describing the contribution
 * @property {string} [transactionId] - Optional ID linking to a transaction record
 *
 * @example
 * const contribution: CreateContributionInput = {
 *   amount: 500,
 *   note: 'Monthly savings deposit',
 *   transactionId: 'txn_abc123',
 * };
 */
export interface CreateContributionInput {
  amount: number
  note?: string
  transactionId?: string
}

/**
 * Goals service object containing all savings goal management operations.
 *
 * This service provides CRUD operations for savings goals and their contributions,
 * with built-in logging, error handling, and transaction support for data integrity.
 *
 * @namespace goalsService
 */
export const goalsService = {
  /**
   * Retrieves all savings goals for a user.
   *
   * Returns goals ordered by priority (ascending) and creation date (descending).
   * Each goal includes the 5 most recent contributions and a count of total contributions.
   *
   * @param {string} userId - The unique identifier of the user
   * @returns {Promise<Array>} Array of savings goals with contributions and counts
   *
   * @example
   * const goals = await goalsService.getAll('user_123');
   * console.log(`User has ${goals.length} savings goals`);
   * goals.forEach(goal => {
   *   console.log(`${goal.name}: ${goal.currentAmount}/${goal.targetAmount}`);
   * });
   */
  async getAll(userId: string) {
    logger.debug('Fetching all savings goals', { userId })
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      include: {
        contributions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { contributions: true },
        },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    })
    logger.debug('Savings goals fetched', { userId, count: goals.length })
    return goals
  },

  /**
   * Retrieves a single savings goal by ID.
   *
   * Returns the goal with all contributions and their linked transactions.
   * Returns null if the goal doesn't exist or doesn't belong to the user.
   *
   * @param {string} id - The unique identifier of the savings goal
   * @param {string} userId - The unique identifier of the user (for authorization)
   * @returns {Promise<Object | null>} The savings goal with contributions, or null if not found
   *
   * @example
   * const goal = await goalsService.getById('goal_abc', 'user_123');
   * if (goal) {
   *   console.log(`Goal "${goal.name}" has ${goal.contributions.length} contributions`);
   * }
   */
  async getById(id: string, userId: string) {
    logger.debug('Fetching savings goal by ID', { goalId: id, userId })
    return prisma.savingsGoal.findFirst({
      where: { id, userId },
      include: {
        contributions: {
          orderBy: { createdAt: 'desc' },
          include: {
            transaction: {
              select: { id: true, description: true, date: true },
            },
          },
        },
      },
    })
  },

  /**
   * Creates a new savings goal for a user.
   *
   * Initializes the goal with zero current amount and not completed status.
   * The priority defaults to 1 if not specified.
   *
   * @param {string} userId - The unique identifier of the user creating the goal
   * @param {CreateGoalInput} data - The goal creation data
   * @returns {Promise<Object>} The newly created savings goal
   *
   * @example
   * const goal = await goalsService.create('user_123', {
   *   name: 'Emergency Fund',
   *   type: 'EMERGENCY',
   *   targetAmount: 10000,
   *   deadline: '2024-12-31',
   *   priority: 1,
   *   icon: 'shield',
   *   color: '#FF5722',
   * });
   * console.log(`Created goal with ID: ${goal.id}`);
   */
  async create(userId: string, data: CreateGoalInput) {
    logger.info('Creating savings goal', {
      userId,
      name: data.name,
      type: data.type,
      targetAmount: data.targetAmount,
    })

    const goal = await prisma.savingsGoal.create({
      data: {
        name: data.name,
        type: data.type,
        targetAmount: data.targetAmount,
        deadline: data.deadline ? new Date(data.deadline) : null,
        priority: data.priority ?? 1,
        icon: data.icon,
        color: data.color,
        metadata: data.metadata as Prisma.JsonObject | undefined,
        userId,
      },
    })

    logger.info('Savings goal created', { goalId: goal.id, userId })
    return goal
  },

  /**
   * Updates an existing savings goal.
   *
   * Only the provided fields will be updated; undefined fields are ignored.
   * Setting deadline to null explicitly removes the deadline.
   *
   * @param {string} id - The unique identifier of the goal to update
   * @param {string} userId - The unique identifier of the user (for authorization)
   * @param {UpdateGoalInput} data - The fields to update
   * @returns {Promise<Object>} The updated savings goal
   * @throws {AppError} 404 error if the goal is not found or doesn't belong to the user
   *
   * @example
   * const updated = await goalsService.update('goal_abc', 'user_123', {
   *   targetAmount: 15000,
   *   deadline: '2025-06-30',
   * });
   * console.log(`Goal target updated to ${updated.targetAmount}`);
   */
  async update(id: string, userId: string, data: UpdateGoalInput) {
    logger.info('Updating savings goal', { goalId: id, userId, updates: data })

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId },
    })

    if (!goal) {
      logger.warn('Savings goal not found for update', { goalId: id, userId })
      throw AppError.notFound('Savings goal', id)
    }

    const updateData: Prisma.SavingsGoalUpdateInput = {
      ...data,
      deadline: data.deadline === null ? null : data.deadline ? new Date(data.deadline) : undefined,
      metadata: data.metadata as Prisma.JsonObject | undefined,
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: updateData,
    })

    logger.info('Savings goal updated', { goalId: id, userId })
    return updated
  },

  /**
   * Deletes a savings goal and all associated contributions.
   *
   * This operation is irreversible. All contributions linked to the goal
   * will be deleted due to cascade delete in the database schema.
   *
   * @param {string} id - The unique identifier of the goal to delete
   * @param {string} userId - The unique identifier of the user (for authorization)
   * @returns {Promise<Object>} The deleted savings goal
   * @throws {AppError} 404 error if the goal is not found or doesn't belong to the user
   *
   * @example
   * const deleted = await goalsService.delete('goal_abc', 'user_123');
   * console.log(`Deleted goal: ${deleted.name}`);
   */
  async delete(id: string, userId: string) {
    logger.info('Deleting savings goal', { goalId: id, userId })

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId },
    })

    if (!goal) {
      logger.warn('Savings goal not found for deletion', { goalId: id, userId })
      throw AppError.notFound('Savings goal', id)
    }

    await prisma.savingsGoal.delete({
      where: { id },
    })

    logger.info('Savings goal deleted', { goalId: id, userId })
    return goal
  },

  // Contribution methods

  /**
   * Adds a contribution to a savings goal.
   *
   * This operation uses a database transaction to ensure atomicity when:
   * 1. Creating the contribution record
   * 2. Updating the goal's current amount
   * 3. Checking and updating the goal's completion status
   *
   * The goal is automatically marked as completed if the new current amount
   * reaches or exceeds the target amount.
   *
   * @param {string} goalId - The unique identifier of the goal to contribute to
   * @param {string} userId - The unique identifier of the user (for authorization)
   * @param {CreateContributionInput} data - The contribution data
   * @returns {Promise<Object>} The newly created contribution record
   * @throws {AppError} 404 error if the goal is not found or doesn't belong to the user
   *
   * @example
   * const contribution = await goalsService.addContribution(
   *   'goal_abc',
   *   'user_123',
   *   {
   *     amount: 250,
   *     note: 'Bonus from work',
   *   }
   * );
   * console.log(`Added contribution of ${contribution.amount}`);
   */
  async addContribution(goalId: string, userId: string, data: CreateContributionInput) {
    logger.info('Adding contribution to goal', {
      goalId,
      userId,
      amount: data.amount,
    })

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId },
    })

    if (!goal) {
      logger.warn('Savings goal not found for contribution', { goalId, userId })
      throw AppError.notFound('Savings goal', goalId)
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create contribution
      const contribution = await tx.contribution.create({
        data: {
          amount: data.amount,
          note: data.note,
          goalId,
          transactionId: data.transactionId,
        },
      })

      // Update goal's current amount
      const newAmount = Number(goal.currentAmount) + data.amount
      const isNowCompleted = newAmount >= Number(goal.targetAmount)

      await tx.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: newAmount,
          isCompleted: isNowCompleted,
        },
      })

      return contribution
    })

    logger.info('Contribution added', {
      contributionId: result.id,
      goalId,
      amount: data.amount,
    })

    return result
  },

  /**
   * Removes a contribution from a savings goal.
   *
   * This operation uses a database transaction to ensure atomicity when:
   * 1. Deleting the contribution record
   * 2. Updating the goal's current amount (subtracting the contribution)
   * 3. Recalculating the goal's completion status
   *
   * The current amount will not go below zero.
   *
   * @param {string} contributionId - The unique identifier of the contribution to remove
   * @param {string} userId - The unique identifier of the user (for authorization)
   * @returns {Promise<Object>} The deleted contribution record
   * @throws {AppError} 404 error if the contribution is not found or doesn't belong to the user
   *
   * @example
   * const removed = await goalsService.removeContribution('contrib_xyz', 'user_123');
   * console.log(`Removed contribution of ${removed.amount}`);
   */
  async removeContribution(contributionId: string, userId: string) {
    logger.info('Removing contribution', { contributionId, userId })

    const contribution = await prisma.contribution.findFirst({
      where: { id: contributionId },
      include: { goal: true },
    })

    if (!contribution || contribution.goal.userId !== userId) {
      logger.warn('Contribution not found or unauthorized', { contributionId, userId })
      throw AppError.notFound('Contribution', contributionId)
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete contribution
      await tx.contribution.delete({
        where: { id: contributionId },
      })

      // Update goal's current amount
      const newAmount = Math.max(0, Number(contribution.goal.currentAmount) - Number(contribution.amount))

      await tx.savingsGoal.update({
        where: { id: contribution.goalId },
        data: {
          currentAmount: newAmount,
          isCompleted: newAmount >= Number(contribution.goal.targetAmount),
        },
      })
    })

    logger.info('Contribution removed', { contributionId, goalId: contribution.goalId })
    return contribution
  },

  /**
   * Retrieves all contributions for a specific savings goal.
   *
   * Returns contributions ordered by creation date (newest first),
   * including linked transaction details when available.
   *
   * @param {string} goalId - The unique identifier of the savings goal
   * @param {string} userId - The unique identifier of the user (for authorization)
   * @returns {Promise<Array>} Array of contributions with transaction details
   * @throws {AppError} 404 error if the goal is not found or doesn't belong to the user
   *
   * @example
   * const contributions = await goalsService.getContributions('goal_abc', 'user_123');
   * const total = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
   * console.log(`Total contributed: ${total}`);
   */
  async getContributions(goalId: string, userId: string) {
    logger.debug('Fetching contributions for goal', { goalId, userId })

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId },
    })

    if (!goal) {
      logger.warn('Savings goal not found', { goalId, userId })
      throw AppError.notFound('Savings goal', goalId)
    }

    return prisma.contribution.findMany({
      where: { goalId },
      orderBy: { createdAt: 'desc' },
      include: {
        transaction: {
          select: { id: true, description: true, date: true, amount: true },
        },
      },
    })
  },

  // Summary for dashboard

  /**
   * Retrieves an aggregated summary of all savings goals for dashboard display.
   *
   * Calculates overall statistics including:
   * - List of all goals with essential fields
   * - Total target amount across all goals
   * - Total amount saved across all goals
   * - Count of completed and active goals
   * - Overall progress percentage
   *
   * @param {string} userId - The unique identifier of the user
   * @returns {Promise<Object>} Summary object containing goals and aggregated statistics
   *
   * @example
   * const summary = await goalsService.getSummary('user_123');
   * console.log(`Overall progress: ${summary.overallProgress}%`);
   * console.log(`Total saved: ${summary.totalSaved} / ${summary.totalTarget}`);
   * console.log(`Completed: ${summary.completedCount}, Active: ${summary.activeCount}`);
   *
   * @returns {Promise<{
   *   goals: Array<{id: string, name: string, type: GoalType, targetAmount: number, currentAmount: number, deadline: Date | null, isCompleted: boolean, color: string | null, icon: string | null}>,
   *   totalTarget: number,
   *   totalSaved: number,
   *   completedCount: number,
   *   activeCount: number,
   *   overallProgress: number
   * }>}
   */
  async getSummary(userId: string) {
    logger.debug('Fetching goals summary', { userId })

    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        targetAmount: true,
        currentAmount: true,
        deadline: true,
        isCompleted: true,
        color: true,
        icon: true,
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    })

    const totalTarget = goals.reduce((sum, g) => sum + Number(g.targetAmount), 0)
    const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentAmount), 0)
    const completedCount = goals.filter((g) => g.isCompleted).length
    const activeCount = goals.filter((g) => !g.isCompleted).length

    return {
      goals,
      totalTarget,
      totalSaved,
      completedCount,
      activeCount,
      overallProgress: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0,
    }
  },
}
