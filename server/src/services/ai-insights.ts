/**
 * @fileoverview AI Spending Insights Service
 *
 * Provides AI-powered financial insights and recommendations.
 * Combines local data analysis with LLM-generated narratives.
 *
 * @module services/ai-insights
 */

import { prisma } from '../lib/prisma.js'
import { createLogger } from '../lib/logger.js'
import { createLLMProvider } from '../providers/registry.js'
import type { LLMMessage } from '../providers/llm/types.js'

const logger = createLogger('ai-insights-service')

/**
 * Spending summary for a user
 */
interface SpendingSummary {
  totalSpending: number
  avgMonthlySpending: number
  topCategory: string | null
  transactionCount: number
}

/**
 * Category breakdown item
 */
interface CategoryBreakdown {
  category: string
  total: number
  percentage: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

/**
 * Spending pattern analysis
 */
interface SpendingPatterns {
  summary: SpendingSummary
  categoryBreakdown: CategoryBreakdown[]
  monthlyTrend: Array<{ month: string; amount: number }>
  weekdayPattern: Array<{ day: string; avgAmount: number }>
}

/**
 * Detected spending anomaly
 */
interface Anomaly {
  id: string
  type: 'amount' | 'frequency' | 'category'
  severity: 'low' | 'medium' | 'high'
  description: string
  transactionId?: string
  amount?: number
  date?: Date
}

/**
 * Goal prediction
 */
interface GoalPrediction {
  goalId: string
  goalName: string
  targetAmount: number
  currentAmount: number
  progressPercent: number
  onTrack: boolean | null
  predictedCompletionDate: string | null
  recommendation: string
}

/**
 * Financial recommendation
 */
interface Recommendation {
  category: 'spending' | 'goals' | 'general'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  potentialImpact: number | null
  actionItems: string[]
}

/**
 * Full analysis response
 */
export interface FullAnalysis {
  spendingPatterns: SpendingPatterns | null
  goalPredictions: {
    summary: {
      totalGoals: number
      goalsOnTrack: number
      goalsBehind: number
    }
    predictions: GoalPrediction[]
  } | null
  anomalies: {
    summary: {
      totalAnomalies: number
      hasHighPriority: boolean
    }
    anomalies: Anomaly[]
  } | null
  recommendations: {
    summary: {
      totalRecommendations: number
      potentialSavings: number
    }
    recommendations: Recommendation[]
  }
  narrative?: string
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length)
}

/**
 * Analyze spending patterns
 */
async function analyzeSpendingPatterns(userId: string): Promise<SpendingPatterns | null> {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      date: { gte: sixMonthsAgo },
    },
    orderBy: { date: 'desc' },
  })

  if (transactions.length === 0) {
    return null
  }

  // Calculate summary
  const totalSpending = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const months = new Set(
    transactions.map(t => `${t.date.getFullYear()}-${t.date.getMonth()}`)
  ).size || 1
  const avgMonthlySpending = totalSpending / months

  // Category breakdown
  const categoryTotals: Record<string, { total: number; recentTotal: number; olderTotal: number }> = {}
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  transactions.forEach(t => {
    const cat = t.category
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { total: 0, recentTotal: 0, olderTotal: 0 }
    }
    categoryTotals[cat].total += Number(t.amount)
    if (t.date >= threeMonthsAgo) {
      categoryTotals[cat].recentTotal += Number(t.amount)
    } else {
      categoryTotals[cat].olderTotal += Number(t.amount)
    }
  })

  const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoryTotals)
    .map(([category, data]) => {
      const percentage = Math.round((data.total / totalSpending) * 100)
      // Compare recent 3 months to older 3 months
      const recentAvg = data.recentTotal / 3
      const olderAvg = data.olderTotal / 3
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
      if (olderAvg > 0) {
        const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100
        if (changePercent > 10) trend = 'increasing'
        else if (changePercent < -10) trend = 'decreasing'
      }
      return { category, total: data.total, percentage, trend }
    })
    .sort((a, b) => b.total - a.total)

  const topCategory = categoryBreakdown[0]?.category || null

  // Monthly trend
  const monthlyTotals: Record<string, number> = {}
  transactions.forEach(t => {
    const key = t.date.toLocaleString('en-US', { month: 'short', year: '2-digit' })
    monthlyTotals[key] = (monthlyTotals[key] || 0) + Number(t.amount)
  })

  const monthlyTrend = Object.entries(monthlyTotals)
    .map(([month, amount]) => ({ month, amount }))
    .reverse()

  // Weekday pattern
  const weekdayTotals: Record<number, { total: number; count: number }> = {}
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  transactions.forEach(t => {
    const day = t.date.getDay()
    if (!weekdayTotals[day]) {
      weekdayTotals[day] = { total: 0, count: 0 }
    }
    weekdayTotals[day].total += Number(t.amount)
    weekdayTotals[day].count++
  })

  const weekdayPattern = dayNames.map((day, i) => ({
    day,
    avgAmount: weekdayTotals[i] ? Math.round(weekdayTotals[i].total / weekdayTotals[i].count) : 0,
  }))

  return {
    summary: {
      totalSpending,
      avgMonthlySpending: Math.round(avgMonthlySpending),
      topCategory,
      transactionCount: transactions.length,
    },
    categoryBreakdown,
    monthlyTrend,
    weekdayPattern,
  }
}

/**
 * Detect spending anomalies using statistical methods
 */
async function detectAnomalies(userId: string): Promise<Anomaly[]> {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      date: { gte: threeMonthsAgo },
    },
    orderBy: { date: 'desc' },
  })

  if (transactions.length < 10) {
    return []
  }

  const anomalies: Anomaly[] = []
  const amounts = transactions.map(t => Number(t.amount))
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
  const stdDev = calculateStdDev(amounts)

  // Detect amount anomalies (Z-score > 2)
  transactions.forEach(t => {
    const amount = Number(t.amount)
    const zScore = stdDev > 0 ? (amount - mean) / stdDev : 0

    if (zScore > 2.5) {
      anomalies.push({
        id: `anomaly-${t.id}`,
        type: 'amount',
        severity: zScore > 3 ? 'high' : 'medium',
        description: `Unusually high transaction: $${amount.toFixed(2)} in ${t.category}`,
        transactionId: t.id,
        amount,
        date: t.date,
      })
    }
  })

  // Detect category spending spikes
  const categoryByMonth: Record<string, Record<string, number>> = {}

  transactions.forEach(t => {
    const monthKey = `${t.date.getFullYear()}-${t.date.getMonth()}`
    if (!categoryByMonth[t.category]) {
      categoryByMonth[t.category] = {}
    }
    categoryByMonth[t.category][monthKey] =
      (categoryByMonth[t.category][monthKey] || 0) + Number(t.amount)
  })

  Object.entries(categoryByMonth).forEach(([category, monthlySpending]) => {
    const values = Object.values(monthlySpending)
    if (values.length >= 2) {
      const monthMean = values.reduce((a, b) => a + b, 0) / values.length
      const monthStdDev = calculateStdDev(values)
      const latestMonth = Object.entries(monthlySpending).sort()[0]

      if (latestMonth && monthStdDev > 0) {
        const zScore = (latestMonth[1] - monthMean) / monthStdDev
        if (zScore > 2) {
          anomalies.push({
            id: `anomaly-cat-${category}`,
            type: 'category',
            severity: zScore > 2.5 ? 'high' : 'medium',
            description: `Spending in ${category} is ${Math.round((zScore - 1) * 100)}% above normal this month`,
          })
        }
      }
    }
  })

  return anomalies.slice(0, 10) // Limit to top 10
}

/**
 * Predict goal completion
 */
async function predictGoals(userId: string): Promise<GoalPrediction[]> {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId, isCompleted: false },
    include: {
      contributions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  return goals.map(goal => {
    const targetAmount = Number(goal.targetAmount)
    const currentAmount = Number(goal.currentAmount)
    const progressPercent = targetAmount > 0
      ? Math.round((currentAmount / targetAmount) * 100)
      : 0

    // Calculate savings velocity from recent contributions
    const contributions = goal.contributions
    let monthlyRate = 0

    if (contributions.length >= 2) {
      const totalContributed = contributions.reduce((sum, c) => sum + Number(c.amount), 0)
      const firstDate = contributions[contributions.length - 1].createdAt
      const lastDate = contributions[0].createdAt
      const monthsDiff = Math.max(1,
        (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
      monthlyRate = totalContributed / monthsDiff
    }

    // Predict completion
    const remaining = targetAmount - currentAmount
    let predictedCompletionDate: string | null = null
    let onTrack: boolean | null = null

    if (monthlyRate > 0) {
      const monthsToComplete = remaining / monthlyRate
      const completionDate = new Date()
      completionDate.setMonth(completionDate.getMonth() + Math.ceil(monthsToComplete))
      predictedCompletionDate = completionDate.toISOString().split('T')[0]

      if (goal.deadline) {
        onTrack = completionDate <= goal.deadline
      }
    }

    // Generate recommendation
    let recommendation = 'Keep up the good work!'
    if (progressPercent >= 90) {
      recommendation = 'Almost there! Consider a final push to reach your goal.'
    } else if (onTrack === false) {
      const monthsRemaining = goal.deadline
        ? Math.max(1, Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
        : 12
      const requiredMonthly = remaining / monthsRemaining
      recommendation = `Increase monthly savings to $${Math.round(requiredMonthly)} to meet your deadline.`
    } else if (monthlyRate === 0 && contributions.length === 0) {
      recommendation = 'Start contributing to make progress toward this goal.'
    }

    return {
      goalId: goal.id,
      goalName: goal.name,
      targetAmount,
      currentAmount,
      progressPercent,
      onTrack,
      predictedCompletionDate,
      recommendation,
    }
  })
}

/**
 * Generate recommendations based on spending and goals
 */
async function generateRecommendations(
  userId: string,
  patterns: SpendingPatterns | null,
  anomalies: Anomaly[],
  goalPredictions: GoalPrediction[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = []

  // Budget-based recommendations
  const budgets = await prisma.budget.findMany({
    where: { userId },
  })

  budgets.forEach(budget => {
    const spent = Number(budget.spent)
    const limit = Number(budget.amount)
    const percentUsed = limit > 0 ? (spent / limit) * 100 : 0

    if (percentUsed >= 90) {
      recommendations.push({
        category: 'spending',
        priority: percentUsed >= 100 ? 'high' : 'medium',
        title: `${budget.name} budget ${percentUsed >= 100 ? 'exceeded' : 'nearly exhausted'}`,
        description: `You've used ${Math.round(percentUsed)}% of your ${budget.name} budget ($${spent.toFixed(0)} of $${limit.toFixed(0)}).`,
        potentialImpact: percentUsed >= 100 ? spent - limit : null,
        actionItems: [
          'Review recent transactions in this category',
          'Consider adjusting budget for next period',
          'Look for areas to reduce spending',
        ],
      })
    }
  })

  // Spending pattern recommendations
  if (patterns) {
    const increasingCategories = patterns.categoryBreakdown
      .filter(c => c.trend === 'increasing' && c.percentage > 10)
      .slice(0, 2)

    increasingCategories.forEach(cat => {
      recommendations.push({
        category: 'spending',
        priority: 'medium',
        title: `Rising spending in ${cat.category}`,
        description: `Your ${cat.category} spending has been increasing recently. It now accounts for ${cat.percentage}% of your expenses.`,
        potentialImpact: Math.round(cat.total * 0.1),
        actionItems: [
          `Review your ${cat.category} transactions`,
          'Identify any unnecessary expenses',
          'Consider setting a specific budget for this category',
        ],
      })
    })
  }

  // Goal recommendations
  goalPredictions
    .filter(g => g.onTrack === false)
    .slice(0, 2)
    .forEach(goal => {
      recommendations.push({
        category: 'goals',
        priority: 'high',
        title: `${goal.goalName} behind schedule`,
        description: goal.recommendation,
        potentialImpact: null,
        actionItems: [
          'Review and adjust your savings plan',
          'Look for additional income sources',
          'Consider extending your deadline if possible',
        ],
      })
    })

  // Anomaly recommendations
  const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high')
  if (highSeverityAnomalies.length > 0) {
    recommendations.push({
      category: 'spending',
      priority: 'medium',
      title: 'Unusual spending detected',
      description: `We detected ${highSeverityAnomalies.length} unusual transactions that may need your attention.`,
      potentialImpact: highSeverityAnomalies
        .filter(a => a.amount)
        .reduce((sum, a) => sum + (a.amount || 0), 0),
      actionItems: [
        'Review the flagged transactions',
        'Verify they are legitimate expenses',
        'Update your budget if these are expected',
      ],
    })
  }

  // General recommendations if few others exist
  if (recommendations.length < 3) {
    if (patterns && patterns.summary.avgMonthlySpending > 0) {
      recommendations.push({
        category: 'general',
        priority: 'low',
        title: 'Build an emergency fund',
        description: `Based on your average spending of $${patterns.summary.avgMonthlySpending}/month, aim to save 3-6 months of expenses.`,
        potentialImpact: null,
        actionItems: [
          `Target: $${(patterns.summary.avgMonthlySpending * 3).toLocaleString()} - $${(patterns.summary.avgMonthlySpending * 6).toLocaleString()}`,
          'Set up automatic transfers to savings',
          'Start with a smaller goal and build up',
        ],
      })
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recommendations.slice(0, 5) // Limit to top 5
}

/**
 * Generate LLM-powered narrative insight
 */
async function generateNarrative(analysis: Omit<FullAnalysis, 'narrative'>): Promise<string> {
  try {
    const llmProvider = await createLLMProvider()

    // Build context for LLM
    const context: string[] = []

    if (analysis.spendingPatterns) {
      const sp = analysis.spendingPatterns
      context.push(`Monthly spending: $${sp.summary.avgMonthlySpending}`)
      context.push(`Top category: ${sp.summary.topCategory} (${sp.categoryBreakdown[0]?.percentage || 0}%)`)

      const increasing = sp.categoryBreakdown.filter(c => c.trend === 'increasing')
      if (increasing.length > 0) {
        context.push(`Increasing: ${increasing.map(c => c.category).join(', ')}`)
      }
    }

    if (analysis.goalPredictions) {
      const gp = analysis.goalPredictions
      context.push(`Goals: ${gp.summary.goalsOnTrack} on track, ${gp.summary.goalsBehind} behind`)
    }

    if (analysis.anomalies && analysis.anomalies.summary.totalAnomalies > 0) {
      context.push(`Anomalies detected: ${analysis.anomalies.summary.totalAnomalies}`)
    }

    if (analysis.recommendations.recommendations.length > 0) {
      const topRec = analysis.recommendations.recommendations[0]
      context.push(`Top recommendation: ${topRec.title}`)
    }

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are a friendly financial advisor providing brief, actionable insights. Keep responses under 150 words. Be encouraging but honest. Focus on 1-2 key points.`,
      },
      {
        role: 'user',
        content: `Based on this financial data, provide a personalized insight:
${context.join('\n')}

Give a brief, friendly summary highlighting the most important thing this person should focus on.`,
      },
    ]

    const response = await llmProvider.complete({
      messages,
      temperature: 0.7,
      maxTokens: 200,
    })

    return response.content
  } catch (error) {
    logger.error('Failed to generate narrative', { error })
    return ''
  }
}

/**
 * Get full financial analysis for a user
 */
export async function getFullAnalysis(userId: string): Promise<FullAnalysis> {
  logger.info('Generating full analysis', { userId })

  // Run analyses in parallel
  const [patterns, anomalies, goalPredictions] = await Promise.all([
    analyzeSpendingPatterns(userId),
    detectAnomalies(userId),
    predictGoals(userId),
  ])

  // Generate recommendations based on analysis
  const recommendations = await generateRecommendations(
    userId,
    patterns,
    anomalies,
    goalPredictions
  )

  // Calculate summaries
  const goalsSummary = {
    totalGoals: goalPredictions.length,
    goalsOnTrack: goalPredictions.filter(g => g.onTrack === true).length,
    goalsBehind: goalPredictions.filter(g => g.onTrack === false).length,
  }

  const analysis: FullAnalysis = {
    spendingPatterns: patterns,
    goalPredictions: goalPredictions.length > 0 ? {
      summary: goalsSummary,
      predictions: goalPredictions,
    } : null,
    anomalies: anomalies.length > 0 ? {
      summary: {
        totalAnomalies: anomalies.length,
        hasHighPriority: anomalies.some(a => a.severity === 'high'),
      },
      anomalies,
    } : null,
    recommendations: {
      summary: {
        totalRecommendations: recommendations.length,
        potentialSavings: recommendations
          .filter(r => r.potentialImpact)
          .reduce((sum, r) => sum + (r.potentialImpact || 0), 0),
      },
      recommendations,
    },
  }

  // Generate narrative insight (non-blocking, but we await for better UX)
  const narrative = await generateNarrative(analysis)
  if (narrative) {
    analysis.narrative = narrative
  }

  logger.info('Analysis complete', {
    userId,
    hasPatterns: !!patterns,
    anomalyCount: anomalies.length,
    goalCount: goalPredictions.length,
    recommendationCount: recommendations.length,
  })

  return analysis
}

/**
 * Get quick spending summary (lighter weight than full analysis)
 */
export async function getQuickSummary(userId: string): Promise<SpendingSummary | null> {
  const patterns = await analyzeSpendingPatterns(userId)
  return patterns?.summary || null
}

export const aiInsightsService = {
  getFullAnalysis,
  getQuickSummary,
  analyzeSpendingPatterns,
  detectAnomalies,
  predictGoals,
}
