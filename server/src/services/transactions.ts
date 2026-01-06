import { prisma } from '../lib/prisma.js'

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
    return prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: { budget: true },
    })
  },

  async getById(id: string, userId: string) {
    return prisma.transaction.findFirst({
      where: { id, userId },
      include: { budget: true },
    })
  },

  async create(userId: string, data: CreateTransactionInput) {
    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        date: new Date(data.date),
        userId,
      },
    })

    // Update budget spent amount if linked to a budget
    if (data.budgetId && data.type === 'expense') {
      await prisma.budget.update({
        where: { id: data.budgetId },
        data: {
          spent: { increment: data.amount },
        },
      })
    }

    return transaction
  },

  async update(id: string, userId: string, data: UpdateTransactionInput) {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      throw new Error('Transaction not found')
    }

    // Handle budget updates
    if (existing.budgetId && existing.type === 'expense') {
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
      await prisma.budget.update({
        where: { id: newBudgetId },
        data: {
          spent: { increment: newAmount },
        },
      })
    }

    return transaction
  },

  async delete(id: string, userId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
    })

    if (!transaction) {
      throw new Error('Transaction not found')
    }

    // Update budget if linked
    if (transaction.budgetId && transaction.type === 'expense') {
      await prisma.budget.update({
        where: { id: transaction.budgetId },
        data: {
          spent: { decrement: Number(transaction.amount) },
        },
      })
    }

    return prisma.transaction.delete({
      where: { id },
    })
  },
}
