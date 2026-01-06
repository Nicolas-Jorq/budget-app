import { prisma } from '../lib/prisma.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('budget-service')

export interface CreateBudgetInput {
  name: string
  amount: number
  category: string
}

export interface UpdateBudgetInput {
  name?: string
  amount?: number
  category?: string
  spent?: number
}

export const budgetService = {
  async getAll(userId: string) {
    logger.debug('Fetching all budgets', { userId })
    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    logger.debug('Budgets fetched', { userId, count: budgets.length })
    return budgets
  },

  async getById(id: string, userId: string) {
    logger.debug('Fetching budget by ID', { budgetId: id, userId })
    return prisma.budget.findFirst({
      where: { id, userId },
    })
  },

  async create(userId: string, data: CreateBudgetInput) {
    logger.info('Creating budget', { userId, name: data.name, amount: data.amount, category: data.category })
    const budget = await prisma.budget.create({
      data: {
        ...data,
        userId,
      },
    })
    logger.info('Budget created', { budgetId: budget.id, userId })
    return budget
  },

  async update(id: string, userId: string, data: UpdateBudgetInput) {
    logger.info('Updating budget', { budgetId: id, userId, updates: data })
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    })

    if (!budget) {
      logger.warn('Budget not found for update', { budgetId: id, userId })
      throw new Error('Budget not found')
    }

    const updated = await prisma.budget.update({
      where: { id },
      data,
    })
    logger.info('Budget updated', { budgetId: id, userId })
    return updated
  },

  async delete(id: string, userId: string) {
    logger.info('Deleting budget', { budgetId: id, userId })
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    })

    if (!budget) {
      logger.warn('Budget not found for deletion', { budgetId: id, userId })
      throw new Error('Budget not found')
    }

    await prisma.budget.delete({
      where: { id },
    })
    logger.info('Budget deleted', { budgetId: id, userId })
    return budget
  },
}
