import { prisma } from '../lib/prisma.js'

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
    return prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  },

  async getById(id: string, userId: string) {
    return prisma.budget.findFirst({
      where: { id, userId },
    })
  },

  async create(userId: string, data: CreateBudgetInput) {
    return prisma.budget.create({
      data: {
        ...data,
        userId,
      },
    })
  },

  async update(id: string, userId: string, data: UpdateBudgetInput) {
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    })

    if (!budget) {
      throw new Error('Budget not found')
    }

    return prisma.budget.update({
      where: { id },
      data,
    })
  },

  async delete(id: string, userId: string) {
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    })

    if (!budget) {
      throw new Error('Budget not found')
    }

    return prisma.budget.delete({
      where: { id },
    })
  },
}
