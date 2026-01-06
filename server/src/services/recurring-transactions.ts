/**
 * @fileoverview Recurring Transactions Service
 *
 * Handles CRUD operations for recurring transactions and automatic
 * generation of transaction instances based on schedule.
 *
 * Features:
 * - Create/update/delete recurring transaction templates
 * - Calculate next due dates based on frequency
 * - Generate transactions when due
 * - Process all pending recurring transactions for a user
 *
 * @module services/recurring-transactions
 */

import { prisma } from '../lib/prisma.js'
import { RecurringTransaction, RecurrenceFrequency, Transaction } from '@prisma/client'
import { createLogger } from '../lib/logger.js'
import { AppError } from '../utils/errors.js'

const logger = createLogger('recurring-transactions-service')

/**
 * Input data for creating a recurring transaction
 */
export interface CreateRecurringTransactionInput {
  name: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  frequency: RecurrenceFrequency
  startDate: string
  endDate?: string
  dayOfMonth?: number
  dayOfWeek?: number
  budgetId?: string
}

/**
 * Input data for updating a recurring transaction
 */
export interface UpdateRecurringTransactionInput {
  name?: string
  description?: string
  amount?: number
  type?: 'income' | 'expense'
  category?: string
  frequency?: RecurrenceFrequency
  startDate?: string
  endDate?: string | null
  dayOfMonth?: number | null
  dayOfWeek?: number | null
  budgetId?: string | null
  isActive?: boolean
}

/**
 * Recurring transaction with count of generated transactions
 */
export interface RecurringTransactionWithStats extends RecurringTransaction {
  _count: {
    generatedTransactions: number
  }
}

/**
 * Calculate the next due date based on frequency and current date
 */
function calculateNextDueDate(
  frequency: RecurrenceFrequency,
  fromDate: Date,
  dayOfMonth?: number | null,
  dayOfWeek?: number | null
): Date {
  const next = new Date(fromDate)

  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1)
      break

    case 'WEEKLY':
      next.setDate(next.getDate() + 7)
      if (dayOfWeek !== null && dayOfWeek !== undefined) {
        // Adjust to specific day of week
        const currentDay = next.getDay()
        const daysToAdd = (dayOfWeek - currentDay + 7) % 7
        next.setDate(next.getDate() + (daysToAdd === 0 ? 7 : daysToAdd))
      }
      break

    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14)
      break

    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1)
      if (dayOfMonth !== null && dayOfMonth !== undefined) {
        // Set to specific day of month, handling month-end
        const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
        next.setDate(Math.min(dayOfMonth, lastDayOfMonth))
      }
      break

    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3)
      if (dayOfMonth !== null && dayOfMonth !== undefined) {
        const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
        next.setDate(Math.min(dayOfMonth, lastDayOfMonth))
      }
      break

    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1)
      break
  }

  return next
}

/**
 * Calculate the initial next due date from start date
 */
function calculateInitialNextDueDate(
  frequency: RecurrenceFrequency,
  startDate: Date,
  dayOfMonth?: number | null,
  dayOfWeek?: number | null
): Date {
  const now = new Date()
  let nextDue = new Date(startDate)

  // If start date is in the past, find the next occurrence
  while (nextDue < now) {
    nextDue = calculateNextDueDate(frequency, nextDue, dayOfMonth, dayOfWeek)
  }

  return nextDue
}

export const recurringTransactionService = {
  /**
   * Get all recurring transactions for a user
   */
  async getAll(userId: string): Promise<RecurringTransactionWithStats[]> {
    logger.debug('Fetching all recurring transactions', { userId })

    const recurring = await prisma.recurringTransaction.findMany({
      where: { userId },
      include: {
        budget: true,
        _count: {
          select: { generatedTransactions: true },
        },
      },
      orderBy: { nextDueDate: 'asc' },
    })

    logger.debug('Recurring transactions fetched', { userId, count: recurring.length })
    return recurring as RecurringTransactionWithStats[]
  },

  /**
   * Get a single recurring transaction by ID
   */
  async getById(id: string, userId: string): Promise<RecurringTransactionWithStats | null> {
    logger.debug('Fetching recurring transaction', { id, userId })

    const recurring = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
      include: {
        budget: true,
        _count: {
          select: { generatedTransactions: true },
        },
      },
    })

    return recurring as RecurringTransactionWithStats | null
  },

  /**
   * Create a new recurring transaction
   */
  async create(userId: string, data: CreateRecurringTransactionInput): Promise<RecurringTransaction> {
    logger.info('Creating recurring transaction', {
      userId,
      name: data.name,
      frequency: data.frequency,
    })

    const startDate = new Date(data.startDate)
    const nextDueDate = calculateInitialNextDueDate(
      data.frequency,
      startDate,
      data.dayOfMonth,
      data.dayOfWeek
    )

    const recurring = await prisma.recurringTransaction.create({
      data: {
        name: data.name,
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category,
        frequency: data.frequency,
        startDate,
        endDate: data.endDate ? new Date(data.endDate) : null,
        dayOfMonth: data.dayOfMonth,
        dayOfWeek: data.dayOfWeek,
        budgetId: data.budgetId,
        nextDueDate,
        userId,
      },
    })

    logger.info('Recurring transaction created', { id: recurring.id, userId })
    return recurring
  },

  /**
   * Update a recurring transaction
   */
  async update(
    id: string,
    userId: string,
    data: UpdateRecurringTransactionInput
  ): Promise<RecurringTransaction> {
    logger.info('Updating recurring transaction', { id, userId })

    // Verify ownership
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      logger.warn('Recurring transaction not found', { id, userId })
      throw AppError.notFound('Recurring transaction', id)
    }

    // Recalculate next due date if frequency or dates changed
    let nextDueDate = existing.nextDueDate
    if (data.frequency || data.startDate || data.dayOfMonth !== undefined || data.dayOfWeek !== undefined) {
      const frequency = data.frequency || existing.frequency
      const startDate = data.startDate ? new Date(data.startDate) : existing.startDate
      const dayOfMonth = data.dayOfMonth !== undefined ? data.dayOfMonth : existing.dayOfMonth
      const dayOfWeek = data.dayOfWeek !== undefined ? data.dayOfWeek : existing.dayOfWeek

      nextDueDate = calculateInitialNextDueDate(frequency, startDate, dayOfMonth, dayOfWeek)
    }

    const recurring = await prisma.recurringTransaction.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate === null ? null : data.endDate ? new Date(data.endDate) : undefined,
        nextDueDate,
      },
    })

    logger.info('Recurring transaction updated', { id, userId })
    return recurring
  },

  /**
   * Delete a recurring transaction
   */
  async delete(id: string, userId: string): Promise<RecurringTransaction> {
    logger.info('Deleting recurring transaction', { id, userId })

    // Verify ownership
    const recurring = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
    })

    if (!recurring) {
      logger.warn('Recurring transaction not found', { id, userId })
      throw AppError.notFound('Recurring transaction', id)
    }

    await prisma.recurringTransaction.delete({
      where: { id },
    })

    logger.info('Recurring transaction deleted', { id, userId })
    return recurring
  },

  /**
   * Generate a transaction instance from a recurring transaction
   */
  async generateTransaction(recurring: RecurringTransaction): Promise<Transaction> {
    logger.info('Generating transaction from recurring', {
      recurringId: recurring.id,
      dueDate: recurring.nextDueDate,
    })

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        description: recurring.description,
        amount: recurring.amount,
        type: recurring.type,
        category: recurring.category,
        date: recurring.nextDueDate,
        budgetId: recurring.budgetId,
        userId: recurring.userId,
        recurringTransactionId: recurring.id,
      },
    })

    // Update budget spent amount if linked and is expense
    if (recurring.budgetId && recurring.type === 'expense') {
      await prisma.budget.update({
        where: { id: recurring.budgetId },
        data: {
          spent: { increment: Number(recurring.amount) },
        },
      })
    }

    // Calculate and update next due date
    const nextDueDate = calculateNextDueDate(
      recurring.frequency,
      recurring.nextDueDate,
      recurring.dayOfMonth,
      recurring.dayOfWeek
    )

    // Check if we've passed the end date
    const isStillActive = !recurring.endDate || nextDueDate <= recurring.endDate

    await prisma.recurringTransaction.update({
      where: { id: recurring.id },
      data: {
        lastGeneratedDate: recurring.nextDueDate,
        nextDueDate,
        isActive: isStillActive,
      },
    })

    logger.info('Transaction generated', {
      transactionId: transaction.id,
      recurringId: recurring.id,
      nextDueDate,
    })

    return transaction
  },

  /**
   * Process all due recurring transactions for a user
   * Returns the generated transactions
   */
  async processDueTransactions(userId: string): Promise<Transaction[]> {
    logger.info('Processing due recurring transactions', { userId })

    const now = new Date()

    // Find all active recurring transactions that are due
    const dueRecurring = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        nextDueDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
    })

    logger.debug('Found due recurring transactions', {
      userId,
      count: dueRecurring.length,
    })

    const generatedTransactions: Transaction[] = []

    for (const recurring of dueRecurring) {
      // Generate transactions for all missed occurrences (in case of backlog)
      let currentRecurring = recurring
      while (currentRecurring.nextDueDate <= now) {
        const transaction = await this.generateTransaction(currentRecurring)
        generatedTransactions.push(transaction)

        // Refresh to get updated nextDueDate
        const updated = await prisma.recurringTransaction.findUnique({
          where: { id: currentRecurring.id },
        })

        if (!updated || !updated.isActive) break
        currentRecurring = updated
      }
    }

    logger.info('Due transactions processed', {
      userId,
      generatedCount: generatedTransactions.length,
    })

    return generatedTransactions
  },

  /**
   * Get upcoming recurring transactions (preview)
   */
  async getUpcoming(userId: string, days: number = 30): Promise<Array<{
    recurring: RecurringTransaction
    dueDate: Date
  }>> {
    logger.debug('Getting upcoming recurring transactions', { userId, days })

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    const active = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        nextDueDate: { lte: endDate },
      },
      orderBy: { nextDueDate: 'asc' },
    })

    return active.map((r) => ({
      recurring: r,
      dueDate: r.nextDueDate,
    }))
  },

  /**
   * Get generated transactions for a recurring transaction
   */
  async getGeneratedTransactions(
    recurringId: string,
    userId: string,
    limit: number = 10
  ): Promise<Transaction[]> {
    // Verify ownership
    const recurring = await prisma.recurringTransaction.findFirst({
      where: { id: recurringId, userId },
    })

    if (!recurring) {
      throw AppError.notFound('Recurring transaction', recurringId)
    }

    return prisma.transaction.findMany({
      where: { recurringTransactionId: recurringId },
      orderBy: { date: 'desc' },
      take: limit,
    })
  },

  /**
   * Skip the next occurrence of a recurring transaction
   */
  async skipNext(id: string, userId: string): Promise<RecurringTransaction> {
    logger.info('Skipping next occurrence', { id, userId })

    const recurring = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
    })

    if (!recurring) {
      throw AppError.notFound('Recurring transaction', id)
    }

    const nextDueDate = calculateNextDueDate(
      recurring.frequency,
      recurring.nextDueDate,
      recurring.dayOfMonth,
      recurring.dayOfWeek
    )

    return prisma.recurringTransaction.update({
      where: { id },
      data: { nextDueDate },
    })
  },
}
