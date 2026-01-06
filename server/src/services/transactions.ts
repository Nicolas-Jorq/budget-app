import { prisma } from '../lib/prisma.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('transaction-service')

export interface CreateTransactionInput {
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string
  budgetId?: string
}

export interface UpdateTransactionInput {
  description?: string
  amount?: number
  type?: 'income' | 'expense'
  category?: string
  date?: string
  budgetId?: string | null
}

export const transactionService = {
  async getAll(userId: string) {
    logger.debug('Fetching all transactions', { userId })
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: { budget: true },
    })
    logger.debug('Transactions fetched', { userId, count: transactions.length })
    return transactions
  },

  async getById(id: string, userId: string) {
    logger.debug('Fetching transaction by ID', { transactionId: id, userId })
    return prisma.transaction.findFirst({
      where: { id, userId },
      include: { budget: true },
    })
  },

  async create(userId: string, data: CreateTransactionInput) {
    logger.info('Creating transaction', {
      userId,
      type: data.type,
      amount: data.amount,
      category: data.category,
      budgetId: data.budgetId
    })

    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        date: new Date(data.date),
        userId,
      },
    })

    // Update budget spent amount if linked to a budget
    if (data.budgetId && data.type === 'expense') {
      logger.debug('Updating budget spent amount', { budgetId: data.budgetId, increment: data.amount })
      await prisma.budget.update({
        where: { id: data.budgetId },
        data: {
          spent: { increment: data.amount },
        },
      })
    }

    logger.info('Transaction created', { transactionId: transaction.id, userId })
    return transaction
  },

  async update(id: string, userId: string, data: UpdateTransactionInput) {
    logger.info('Updating transaction', { transactionId: id, userId, updates: data })

    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      logger.warn('Transaction not found for update', { transactionId: id, userId })
      throw new Error('Transaction not found')
    }

    // Handle budget updates
    if (existing.budgetId && existing.type === 'expense') {
      logger.debug('Reverting previous budget amount', { budgetId: existing.budgetId, decrement: existing.amount })
      await prisma.budget.update({
        where: { id: existing.budgetId },
        data: {
          spent: { decrement: Number(existing.amount) },
        },
      })
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    })

    // Add new amount to budget
    const newBudgetId = data.budgetId ?? existing.budgetId
    const newType = data.type ?? existing.type
    const newAmount = data.amount ?? Number(existing.amount)

    if (newBudgetId && newType === 'expense') {
      logger.debug('Applying new budget amount', { budgetId: newBudgetId, increment: newAmount })
      await prisma.budget.update({
        where: { id: newBudgetId },
        data: {
          spent: { increment: newAmount },
        },
      })
    }

    logger.info('Transaction updated', { transactionId: id, userId })
    return transaction
  },

  async delete(id: string, userId: string) {
    logger.info('Deleting transaction', { transactionId: id, userId })

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
    })

    if (!transaction) {
      logger.warn('Transaction not found for deletion', { transactionId: id, userId })
      throw new Error('Transaction not found')
    }

    // Update budget if linked
    if (transaction.budgetId && transaction.type === 'expense') {
      logger.debug('Reverting budget amount on delete', { budgetId: transaction.budgetId, decrement: transaction.amount })
      await prisma.budget.update({
        where: { id: transaction.budgetId },
        data: {
          spent: { decrement: Number(transaction.amount) },
        },
      })
    }

    await prisma.transaction.delete({
      where: { id },
    })

    logger.info('Transaction deleted', { transactionId: id, userId })
    return transaction
  },
}
