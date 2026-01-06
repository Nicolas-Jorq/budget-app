import { prisma } from '../lib/prisma.js'

export const dashboardService = {
  async getStats(userId: string) {
    const [budgets, transactions] = await Promise.all([
      prisma.budget.findMany({ where: { userId } }),
      prisma.transaction.findMany({ where: { userId } }),
    ])

    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
    const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent), 0)

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      totalBudget,
      totalSpent,
      totalIncome,
      totalExpenses,
      budgetCount: budgets.length,
      transactionCount: transactions.length,
    }
  },
}
