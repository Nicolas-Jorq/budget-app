/**
 * @fileoverview Data Export Service
 *
 * Provides functionality to export user data in CSV and JSON formats.
 * Supports exporting transactions, budgets, savings goals, and categories.
 *
 * @module services/export
 */

import { prisma } from '../lib/prisma.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('export-service')

/**
 * Export format type
 */
export type ExportFormat = 'csv' | 'json'

/**
 * Export data type
 */
export type ExportDataType = 'transactions' | 'budgets' | 'goals' | 'categories' | 'all'

/**
 * Date range filter
 */
interface DateRange {
  startDate?: Date
  endDate?: Date
}

/**
 * Convert an array of objects to CSV format
 */
function objectsToCSV(data: Record<string, unknown>[], columns?: string[]): string {
  if (data.length === 0) return ''

  // Get column headers
  const headers = columns || Object.keys(data[0])

  // Build CSV header row
  const headerRow = headers.map((h) => `"${h}"`).join(',')

  // Build data rows
  const rows = data.map((obj) =>
    headers
      .map((h) => {
        const value = obj[h]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
        if (value instanceof Date) return `"${value.toISOString()}"`
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        return String(value)
      })
      .join(',')
  )

  return [headerRow, ...rows].join('\n')
}

/**
 * Export transactions
 */
async function exportTransactions(
  userId: string,
  format: ExportFormat,
  dateRange?: DateRange
): Promise<string> {
  logger.debug('Exporting transactions', { userId, format, dateRange })

  const where: Record<string, unknown> = { userId }
  if (dateRange?.startDate) {
    where.date = { ...(where.date as object || {}), gte: dateRange.startDate }
  }
  if (dateRange?.endDate) {
    where.date = { ...(where.date as object || {}), lte: dateRange.endDate }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      budget: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
  })

  const data = transactions.map((t) => ({
    id: t.id,
    date: t.date.toISOString().split('T')[0],
    description: t.description,
    amount: Number(t.amount),
    type: t.type,
    category: t.category,
    budget: t.budget?.name || '',
    createdAt: t.createdAt.toISOString(),
  }))

  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  }

  return objectsToCSV(data, [
    'id',
    'date',
    'description',
    'amount',
    'type',
    'category',
    'budget',
    'createdAt',
  ])
}

/**
 * Export budgets
 */
async function exportBudgets(userId: string, format: ExportFormat): Promise<string> {
  logger.debug('Exporting budgets', { userId, format })

  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const data = budgets.map((b) => ({
    id: b.id,
    name: b.name,
    category: b.category,
    amount: Number(b.amount),
    spent: Number(b.spent),
    remaining: Number(b.amount) - Number(b.spent),
    percentUsed: Number(b.amount) > 0 ? ((Number(b.spent) / Number(b.amount)) * 100).toFixed(1) : '0',
    createdAt: b.createdAt.toISOString(),
  }))

  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  }

  return objectsToCSV(data, [
    'id',
    'name',
    'category',
    'amount',
    'spent',
    'remaining',
    'percentUsed',
    'createdAt',
  ])
}

/**
 * Export savings goals
 */
async function exportGoals(userId: string, format: ExportFormat): Promise<string> {
  logger.debug('Exporting goals', { userId, format })

  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    include: {
      contributions: {
        orderBy: { createdAt: 'desc' },
        take: 10, // Last 10 contributions
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const data = goals.map((g) => ({
    id: g.id,
    name: g.name,
    type: g.type,
    targetAmount: Number(g.targetAmount),
    currentAmount: Number(g.currentAmount),
    progress: Number(g.targetAmount) > 0
      ? ((Number(g.currentAmount) / Number(g.targetAmount)) * 100).toFixed(1)
      : '0',
    deadline: g.deadline?.toISOString().split('T')[0] || '',
    priority: g.priority,
    isCompleted: g.isCompleted,
    contributionCount: g.contributions.length,
    createdAt: g.createdAt.toISOString(),
  }))

  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  }

  return objectsToCSV(data, [
    'id',
    'name',
    'type',
    'targetAmount',
    'currentAmount',
    'progress',
    'deadline',
    'priority',
    'isCompleted',
    'contributionCount',
    'createdAt',
  ])
}

/**
 * Export categories
 */
async function exportCategories(userId: string, format: ExportFormat): Promise<string> {
  logger.debug('Exporting categories', { userId, format })

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { sortOrder: 'asc' },
  })

  const data = categories.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    color: c.color || '',
    icon: c.icon || '',
    isDefault: c.isDefault,
    sortOrder: c.sortOrder,
  }))

  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  }

  return objectsToCSV(data, [
    'id',
    'name',
    'type',
    'color',
    'icon',
    'isDefault',
    'sortOrder',
  ])
}

/**
 * Export all finance data
 */
async function exportAll(
  userId: string,
  format: ExportFormat,
  dateRange?: DateRange
): Promise<string> {
  logger.debug('Exporting all data', { userId, format, dateRange })

  const [transactions, budgets, goals, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        ...(dateRange?.startDate && { date: { gte: dateRange.startDate } }),
        ...(dateRange?.endDate && { date: { lte: dateRange.endDate } }),
      },
      include: { budget: { select: { name: true } } },
      orderBy: { date: 'desc' },
    }),
    prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.savingsGoal.findMany({
      where: { userId },
      include: { contributions: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  const data = {
    exportedAt: new Date().toISOString(),
    dateRange: dateRange ? {
      startDate: dateRange.startDate?.toISOString(),
      endDate: dateRange.endDate?.toISOString(),
    } : null,
    summary: {
      transactionCount: transactions.length,
      budgetCount: budgets.length,
      goalCount: goals.length,
      categoryCount: categories.length,
      totalIncome: transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      totalExpenses: transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0),
    },
    transactions: transactions.map((t) => ({
      id: t.id,
      date: t.date.toISOString(),
      description: t.description,
      amount: Number(t.amount),
      type: t.type,
      category: t.category,
      budget: t.budget?.name || null,
    })),
    budgets: budgets.map((b) => ({
      id: b.id,
      name: b.name,
      category: b.category,
      amount: Number(b.amount),
      spent: Number(b.spent),
    })),
    goals: goals.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      deadline: g.deadline?.toISOString() || null,
      isCompleted: g.isCompleted,
      contributions: g.contributions.map((c) => ({
        amount: Number(c.amount),
        note: c.note,
        date: c.createdAt.toISOString(),
      })),
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      color: c.color,
      icon: c.icon,
    })),
  }

  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  }

  // For CSV format of "all", we just export transactions as that's the most useful
  // Include a note about other data
  const csvData = transactions.map((t) => ({
    date: t.date.toISOString().split('T')[0],
    description: t.description,
    amount: Number(t.amount),
    type: t.type,
    category: t.category,
    budget: t.budget?.name || '',
  }))

  return objectsToCSV(csvData, ['date', 'description', 'amount', 'type', 'category', 'budget'])
}

/**
 * Main export function
 */
export async function exportData(
  userId: string,
  dataType: ExportDataType,
  format: ExportFormat,
  dateRange?: DateRange
): Promise<{ data: string; filename: string; mimeType: string }> {
  logger.info('Starting data export', { userId, dataType, format })

  let data: string
  const date = new Date().toISOString().split('T')[0]

  switch (dataType) {
    case 'transactions':
      data = await exportTransactions(userId, format, dateRange)
      break
    case 'budgets':
      data = await exportBudgets(userId, format)
      break
    case 'goals':
      data = await exportGoals(userId, format)
      break
    case 'categories':
      data = await exportCategories(userId, format)
      break
    case 'all':
      data = await exportAll(userId, format, dateRange)
      break
    default:
      throw new Error(`Unknown data type: ${dataType}`)
  }

  const extension = format === 'json' ? 'json' : 'csv'
  const mimeType = format === 'json' ? 'application/json' : 'text/csv'
  const filename = `budget-app-${dataType}-${date}.${extension}`

  logger.info('Data export completed', { userId, dataType, format, size: data.length })

  return { data, filename, mimeType }
}

export const exportService = {
  exportData,
  exportTransactions,
  exportBudgets,
  exportGoals,
  exportCategories,
  exportAll,
}
