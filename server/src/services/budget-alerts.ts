/**
 * @fileoverview Budget Alert Service
 *
 * Monitors budget spending and creates notifications when
 * thresholds are crossed. Called when transactions are created
 * or when checking budget status.
 *
 * Thresholds:
 * - 80%: Warning - approaching budget limit
 * - 90%: Critical - almost at budget limit
 * - 100%+: Exceeded - over budget
 *
 * @module services/budget-alerts
 */

import { Budget } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { createLogger } from '../lib/logger.js'
import {
  createBudgetWarning,
  createBudgetCritical,
  createBudgetExceeded,
} from './notifications.js'

const logger = createLogger('budget-alerts')

/**
 * Alert thresholds as percentages
 */
const THRESHOLDS = {
  WARNING: 80,
  CRITICAL: 90,
  EXCEEDED: 100,
}

/**
 * Check a single budget and create appropriate alerts
 */
export async function checkBudgetAlerts(budget: Budget): Promise<void> {
  const spent = Number(budget.spent)
  const amount = Number(budget.amount)

  if (amount <= 0) return

  const percentage = (spent / amount) * 100

  const metadata = {
    budgetId: budget.id,
    budgetName: budget.name,
    spent,
    amount,
    percentage,
  }

  try {
    if (percentage >= THRESHOLDS.EXCEEDED) {
      await createBudgetExceeded(budget.userId, metadata)
    } else if (percentage >= THRESHOLDS.CRITICAL) {
      await createBudgetCritical(budget.userId, metadata)
    } else if (percentage >= THRESHOLDS.WARNING) {
      await createBudgetWarning(budget.userId, metadata)
    }
  } catch (error) {
    logger.error('Failed to check budget alerts', { error, budgetId: budget.id })
  }
}

/**
 * Check all budgets for a user and create alerts as needed
 */
export async function checkAllBudgetAlerts(userId: string): Promise<void> {
  try {
    const budgets = await prisma.budget.findMany({
      where: { userId },
    })

    for (const budget of budgets) {
      await checkBudgetAlerts(budget)
    }

    logger.debug('Checked all budget alerts', { userId, budgetCount: budgets.length })
  } catch (error) {
    logger.error('Failed to check all budget alerts', { error, userId })
  }
}

/**
 * Get budget status summary for a user
 * Returns counts of budgets in each status category
 */
export async function getBudgetAlertSummary(userId: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
  })

  let healthy = 0
  let warning = 0
  let critical = 0
  let exceeded = 0

  for (const budget of budgets) {
    const spent = Number(budget.spent)
    const amount = Number(budget.amount)
    if (amount <= 0) continue

    const percentage = (spent / amount) * 100

    if (percentage >= THRESHOLDS.EXCEEDED) {
      exceeded++
    } else if (percentage >= THRESHOLDS.CRITICAL) {
      critical++
    } else if (percentage >= THRESHOLDS.WARNING) {
      warning++
    } else {
      healthy++
    }
  }

  return {
    total: budgets.length,
    healthy,
    warning,
    critical,
    exceeded,
  }
}

/**
 * Get detailed budget status for all user budgets
 */
export async function getBudgetStatusDetails(userId: string) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return budgets.map((budget: Budget) => {
    const spent = Number(budget.spent)
    const amount = Number(budget.amount)
    const percentage = amount > 0 ? (spent / amount) * 100 : 0
    const remaining = amount - spent

    let status: 'healthy' | 'warning' | 'critical' | 'exceeded'
    if (percentage >= THRESHOLDS.EXCEEDED) {
      status = 'exceeded'
    } else if (percentage >= THRESHOLDS.CRITICAL) {
      status = 'critical'
    } else if (percentage >= THRESHOLDS.WARNING) {
      status = 'warning'
    } else {
      status = 'healthy'
    }

    return {
      id: budget.id,
      name: budget.name,
      category: budget.category,
      amount,
      spent,
      remaining,
      percentage,
      status,
    }
  })
}

export const budgetAlertsService = {
  checkBudgetAlerts,
  checkAllBudgetAlerts,
  getBudgetAlertSummary,
  getBudgetStatusDetails,
  THRESHOLDS,
}
