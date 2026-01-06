import { useState, useEffect } from 'react'

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'

interface Recommendation {
  category: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  potentialImpact: number | null
  actionItems: string[]
}

interface SpendingSummary {
  totalSpending: number
  avgMonthlySpending: number
  topCategory: string | null
  transactionCount: number
}

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

interface AnalysisData {
  spendingPatterns: {
    summary: SpendingSummary
    categoryBreakdown: Array<{
      category: string
      total: number
      percentage: number
    }>
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
  } | null
  recommendations: {
    summary: {
      totalRecommendations: number
      potentialSavings: number
    }
    recommendations: Recommendation[]
  }
}

interface AIInsightsProps {
  userId: string
}

export function AIInsights({ userId }: AIInsightsProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalysis()
  }, [userId])

  const fetchAnalysis = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${AI_SERVICE_URL}/api/analytics/full-analysis/${userId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analysis')
      }

      const data = await response.json()
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

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

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-medium">AI Insights Unavailable</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {error}. Make sure the AI service is running on port 8000.
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

  if (!analysis) return null

  const recommendations = analysis.recommendations?.recommendations || []
  const topRecommendations = recommendations.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🤖</span>
          <h2 className="text-xl font-bold">AI Financial Insights</h2>
        </div>
        <p className="text-purple-100 text-sm">
          Personalized recommendations based on your spending patterns and goals.
        </p>

        {/* Quick Stats */}
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
      </div>

      {/* Top Recommendations */}
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

                    {/* Expandable Action Items */}
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

      {/* Goal Predictions */}
      {analysis.goalPredictions?.predictions &&
        analysis.goalPredictions.predictions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Goal Predictions
              </h3>
            </div>
            <div className="p-4 space-y-4">
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

      {/* Spending Summary */}
      {analysis.spendingPatterns?.summary &&
        analysis.spendingPatterns.summary.transactionCount > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Spending Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${analysis.spendingPatterns.summary.avgMonthlySpending.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Avg Monthly Spending
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analysis.spendingPatterns.summary.topCategory || 'N/A'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Top Category</div>
              </div>
            </div>

            {/* Category Breakdown */}
            {analysis.spendingPatterns.categoryBreakdown.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category Breakdown
                </h4>
                <div className="space-y-2">
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
