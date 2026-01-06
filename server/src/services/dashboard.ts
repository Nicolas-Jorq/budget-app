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

  async getChartData(userId: string) {
    const [budgets, transactions] = await Promise.all([
      prisma.budget.findMany({ where: { userId } }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
      }),
    ])

    // Spending by category (expenses only)
    const expensesByCategory = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category
        acc[category] = (acc[category] || 0) + Number(t.amount)
        return acc
      }, {} as Record<string, number>)

    const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0)

    const spendingByCategory = Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }))

    // Monthly comparison (last 6 months)
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const monthlyData: Record<string, { income: number; expenses: number }> = {}

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = date.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      monthlyData[key] = { income: 0, expenses: 0 }
    }

    transactions
      .filter((t) => new Date(t.date) >= sixMonthsAgo)
      .forEach((t) => {
        const date = new Date(t.date)
        const key = date.toLocaleString('en-US', { month: 'short', year: '2-digit' })
        if (monthlyData[key]) {
          if (t.type === 'income') {
            monthlyData[key].income += Number(t.amount)
          } else {
            monthlyData[key].expenses += Number(t.amount)
          }
        }
      })

    const monthlyComparison = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
    }))

    // Daily spending for current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const dailyData: Record<string, number> = {}

    // Initialize all days of current month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(now.getFullYear(), now.getMonth(), day)
      const key = date.toISOString().split('T')[0]
      dailyData[key] = 0
    }

    transactions
      .filter((t) => t.type === 'expense' && new Date(t.date) >= startOfMonth)
      .forEach((t) => {
        const key = new Date(t.date).toISOString().split('T')[0]
        if (dailyData[key] !== undefined) {
          dailyData[key] += Number(t.amount)
        }
      })

    const dailySpending = Object.entries(dailyData).map(([date, amount]) => ({
      date,
      amount,
    }))

    // Budget progress
    const budgetProgress = budgets.map((b) => ({
      id: b.id,
      name: b.name,
      category: b.category,
      spent: Number(b.spent),
      limit: Number(b.amount),
      percentage: Number(b.amount) > 0
        ? Math.round((Number(b.spent) / Number(b.amount)) * 100)
        : 0,
    }))

    // Recent transactions (last 5)
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        type: t.type,
        category: t.category,
        date: t.date,
      }))

    return {
      spendingByCategory,
      monthlyComparison,
      dailySpending,
      budgetProgress,
      recentTransactions,
    }
  },
}
