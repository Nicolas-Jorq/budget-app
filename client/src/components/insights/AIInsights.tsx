/**
 * @fileoverview AI Insights Component
 *
 * This component displays AI-powered financial insights and recommendations
 * based on user spending patterns and goals. It fetches analysis data from
 * the AI service and presents personalized recommendations, goal predictions,
 * and spending summaries.
 *
 * @module components/insights/AIInsights
 */

import { useState, useEffect } from 'react'
import api from '../../services/api'

/**
 * Represents a single AI-generated financial recommendation.
 *
 * @interface Recommendation
 * @property {string} category - Category of the recommendation (spending, goals, general)
 * @property {'high' | 'medium' | 'low'} priority - Urgency level of the recommendation
 * @property {string} title - Brief title of the recommendation
 * @property {string} description - Detailed description of the recommendation
 * @property {number | null} potentialImpact - Estimated dollar savings if implemented
 * @property {string[]} actionItems - List of specific actions to take
 */
interface Recommendation {
  category: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  potentialImpact: number | null
  actionItems: string[]
}

/**
 * Summary statistics for user spending patterns.
 *
 * @interface SpendingSummary
 * @property {number} totalSpending - Total amount spent in the analysis period
 * @property {number} avgMonthlySpending - Average monthly spending
 * @property {string | null} topCategory - Highest spending category
 * @property {number} transactionCount - Number of transactions analyzed
 */
interface SpendingSummary {
  totalSpending: number
  avgMonthlySpending: number
  topCategory: string | null
  transactionCount: number
}

/**
 * AI prediction for a single financial goal's progress.
 *
 * @interface GoalPrediction
 * @property {string} goalId - Unique identifier of the goal
 * @property {string} goalName - Display name of the goal
 * @property {number} targetAmount - Target amount for the goal
 * @property {number} currentAmount - Current saved amount
 * @property {number} progressPercent - Percentage progress (0-100)
 * @property {boolean | null} onTrack - Whether goal is on track to be met
 * @property {string | null} predictedCompletionDate - Estimated completion date
 * @property {string} recommendation - AI recommendation for the goal
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
 * Complete analysis data structure returned from the AI service.
 *
 * @interface AnalysisData
 * @property {object | null} spendingPatterns - Spending analysis with summary and breakdown
 * @property {object | null} goalPredictions - Goal predictions with summary and individual predictions
 * @property {object | null} anomalies - Detected spending anomalies summary
 * @property {object} recommendations - AI recommendations with summary and list
 * @property {string} [narrative] - AI-generated narrative insight
 */
interface AnalysisData {
  spendingPatterns: {
    summary: SpendingSummary
    categoryBreakdown: Array<{
      category: string
      total: number
      percentage: number
      trend?: 'increasing' | 'decreasing' | 'stable'
    }>
    monthlyTrend?: Array<{ month: string; amount: number }>
    weekdayPattern?: Array<{ day: string; avgAmount: number }>
  } | null
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
    anomalies?: Array<{
      id: string
      type: string
      severity: string
      description: string
    }>
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
 * Props for the AIInsights component.
 * Note: userId is no longer needed as the API uses the authenticated user's token.
 */
type AIInsightsProps = Record<string, never>

/**
 * Renders an AI-powered financial insights dashboard.
 *
 * Features:
 * - Gradient header with quick stats (recommendations, goals on track, alerts)
 * - Top recommendations with priority badges and expandable action items
 * - Goal predictions showing progress and on-track status
 * - Spending summary with average monthly spending and category breakdown
 * - Category breakdown with percentage bars
 * - Loading skeleton during data fetch
 * - Error state with retry option
 * - Dark mode support throughout
 *
 * @param {AIInsightsProps} _props - Component props (currently empty)
 * @returns {JSX.Element} AI insights dashboard with recommendations and analysis
 *
 * @example
 * <AIInsights />
 */
export function AIInsights(_props: AIInsightsProps) {
  // Component state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Fetch analysis data when component mounts
  useEffect(() => {
    fetchAnalysis()
  }, [])

  /**
   * Fetches full analysis data from the finance insights API.
   * Handles loading state and error display.
   */
  const fetchAnalysis = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get<AnalysisData>('/finance/insights/full-analysis')
      setAnalysis(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Returns appropriate Tailwind CSS classes for priority badge styling.
   *
   * @param {string} priority - Priority level (high, medium, low)
   * @returns {string} Tailwind CSS classes for the priority badge
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  /**
   * Returns an emoji icon for the recommendation category.
   *
   * @param {string} category - Category type (spending, goals, general)
   * @returns {string} Emoji representing the category
   */
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spending':
        return '💸'
      case 'goals':
        return '🎯'
      case 'general':
        return '💡'
      default:
        return '📊'
    }
  }

  // Loading state - show skeleton UI
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  // Error state - show warning with retry button
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-medium">AI Insights Unavailable</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {error}. Please try again later.
            </p>
          </div>
        </div>
        <button
          onClick={fetchAnalysis}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Try again
        </button>
      </div>
    )
  }

  // No data state
  if (!analysis) return null

  // Extract recommendations for display (limit to top 3)
  const recommendations = analysis.recommendations?.recommendations || []
  const topRecommendations = recommendations.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* AI Insights Header with gradient background */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🤖</span>
          <h2 className="text-xl font-bold">AI Financial Insights</h2>
        </div>
        <p className="text-purple-100 text-sm">
          Personalized recommendations based on your spending patterns and goals.
        </p>

        {/* Quick stats grid */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{recommendations.length}</div>
            <div className="text-xs text-purple-200">Recommendations</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">
              {analysis.goalPredictions?.summary.goalsOnTrack || 0}
            </div>
            <div className="text-xs text-purple-200">Goals On Track</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">
              {analysis.anomalies?.summary.totalAnomalies || 0}
            </div>
            <div className="text-xs text-purple-200">Alerts</div>
          </div>
        </div>

        {/* AI Narrative Insight */}
        {analysis.narrative && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <p className="text-sm text-purple-50 whitespace-pre-line">{analysis.narrative}</p>
          </div>
        )}
      </div>

      {/* Top Recommendations Section */}
      {topRecommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Top Recommendations
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {topRecommendations.map((rec, index) => (
              <div key={index} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getCategoryIcon(rec.category)}</span>
                  <div className="flex-1">
                    {/* Recommendation header with title and priority badge */}
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {rec.title}
                      </h4>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(rec.priority)}`}
                      >
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {rec.description}
                    </p>

                    {/* Expandable action items section */}
                    {rec.actionItems.length > 0 && (
                      <div>
                        <button
                          onClick={() =>
                            setExpanded(expanded === `rec-${index}` ? null : `rec-${index}`)
                          }
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                        >
                          {expanded === `rec-${index}` ? '▼' : '▶'} Action Items
                        </button>
                        {expanded === `rec-${index}` && (
                          <ul className="mt-2 space-y-1 pl-4">
                            {rec.actionItems.map((item, i) => (
                              <li
                                key={i}
                                className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                              >
                                <span className="text-green-500">✓</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Potential savings display */}
                    {rec.potentialImpact && (
                      <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                        Potential savings: ${rec.potentialImpact.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal Predictions Section */}
      {analysis.goalPredictions?.predictions &&
        analysis.goalPredictions.predictions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Goal Predictions
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Show top 3 goal predictions */}
              {analysis.goalPredictions.predictions.slice(0, 3).map((goal) => (
                <div
                  key={goal.goalId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {goal.goalName}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {goal.recommendation}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {goal.progressPercent.toFixed(0)}%
                    </div>
                    {/* On-track indicator */}
                    {goal.onTrack !== null && (
                      <div
                        className={`text-xs ${goal.onTrack ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                      >
                        {goal.onTrack ? '✓ On Track' : '⚠ Behind'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Spending Summary Section */}
      {analysis.spendingPatterns?.summary &&
        analysis.spendingPatterns.summary.transactionCount > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Spending Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Average monthly spending */}
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${analysis.spendingPatterns.summary.avgMonthlySpending.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Avg Monthly Spending
                </div>
              </div>
              {/* Top spending category */}
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analysis.spendingPatterns.summary.topCategory || 'N/A'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Top Category</div>
              </div>
            </div>

            {/* Category breakdown with percentage bars */}
            {analysis.spendingPatterns.categoryBreakdown.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category Breakdown
                </h4>
                <div className="space-y-2">
                  {/* Show top 5 categories */}
                  {analysis.spendingPatterns.categoryBreakdown.slice(0, 5).map((cat) => (
                    <div key={cat.category} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">
                            {cat.category}
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            {cat.percentage}%
                          </span>
                        </div>
                        {/* Percentage bar visualization */}
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  )
}
