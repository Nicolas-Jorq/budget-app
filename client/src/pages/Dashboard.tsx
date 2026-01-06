/**
 * @fileoverview Dashboard page component for the Budget App.
 *
 * This is the main landing page after user authentication. It provides a comprehensive
 * overview of the user's financial status including:
 * - Summary statistics cards (total budget, spent, income, expenses)
 * - Visual charts for spending analysis and trends
 * - Savings goals progress summary
 * - AI-powered financial insights
 * - Recent transaction activity
 *
 * The dashboard fetches data from multiple API endpoints in parallel on mount
 * and displays various visualization components to help users understand their
 * financial health at a glance.
 *
 * @module pages/Dashboard
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { ChartData, GoalsSummary, GOAL_TYPE_INFO } from '../types'
import SpendingPieChart from '../components/charts/SpendingPieChart'
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart'
import SpendingTrendChart from '../components/charts/SpendingTrendChart'
import BudgetProgressChart from '../components/charts/BudgetProgressChart'
import { AIInsights } from '../components/insights'
import { useAuth } from '../context/AuthContext'

/**
 * Aggregated statistics for the user's financial dashboard.
 * These values are computed on the server from the user's budgets and transactions.
 *
 * @interface DashboardStats
 * @property {number} totalBudget - Sum of all budget allocations
 * @property {number} totalSpent - Total amount spent across all categories
 * @property {number} totalIncome - Total income recorded
 * @property {number} totalExpenses - Total expenses recorded
 * @property {number} budgetCount - Number of active budgets
 * @property {number} transactionCount - Total number of transactions
 */
interface DashboardStats {
  totalBudget: number
  totalSpent: number
  totalIncome: number
  totalExpenses: number
  budgetCount: number
  transactionCount: number
}

/**
 * Dashboard page component that displays the user's financial overview.
 *
 * This component serves as the main hub for financial insights, combining
 * multiple data sources to present a holistic view of the user's finances.
 * It fetches dashboard statistics, chart data, and goals summary in parallel
 * on component mount for optimal performance.
 *
 * @component
 * @returns {JSX.Element} The rendered Dashboard page with stats, charts, and insights
 *
 * @example
 * // Used in router configuration
 * <Route path="/" element={<Dashboard />} />
 */
export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [goalsSummary, setGoalsSummary] = useState<GoalsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch all dashboard data on component mount
  // Uses Promise.all for parallel requests to optimize load time
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel API calls for stats, chart data, and goals summary
        const [statsRes, chartsRes, goalsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/charts'),
          api.get('/goals/summary'),
        ])
        setStats(statsRes.data)
        setChartData(chartsRes.data)
        setGoalsSummary(goalsRes.data)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Configuration for the four main stats cards displayed at the top
  // Each card has a label, value from stats, color theme, and SVG icon path
  const statCards = [
    { label: 'Total Budget', value: stats?.totalBudget ?? 0, color: 'bg-blue-500', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { label: 'Total Spent', value: stats?.totalSpent ?? 0, color: 'bg-red-500', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Total Income', value: stats?.totalIncome ?? 0, color: 'bg-green-500', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Total Expenses', value: stats?.totalExpenses ?? 0, color: 'bg-orange-500', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${stat.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spending by Category</h2>
          <SpendingPieChart data={chartData?.spendingByCategory ?? []} />
        </div>

        {/* Income vs Expenses */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Income vs Expenses</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Last 6 months</p>
          <IncomeExpenseChart data={chartData?.monthlyComparison ?? []} />
        </div>
      </div>

      {/* Spending Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Daily Spending This Month</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Track your daily expenses</p>
        <SpendingTrendChart data={chartData?.dailySpending ?? []} />
      </div>

      {/* Savings Goals Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Savings Goals</h2>
          <Link
            to="/goals"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            View all
          </Link>
        </div>
        {goalsSummary && goalsSummary.goals.length > 0 ? (
          <div className="space-y-4">
            {/* Overall Progress */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Saved</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  ${goalsSummary.totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">of ${goalsSummary.totalTarget.toLocaleString()}</p>
                <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                  {goalsSummary.overallProgress}% complete
                </p>
              </div>
            </div>

            {/* Top 3 Goals */}
            <div className="space-y-3">
              {/* Display top 3 goals with progress bars */}
            {goalsSummary.goals.slice(0, 3).map((goal) => {
                // Calculate percentage progress, avoiding division by zero
                const percentage = Number(goal.targetAmount) > 0
                  ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100
                  : 0
                // Get goal type styling info, fallback to custom color if set
                const typeInfo = GOAL_TYPE_INFO[goal.type]
                const displayColor = goal.color || typeInfo.color

                return (
                  <div key={goal.id} className="flex items-center gap-3">
                    <span className="text-xl">{goal.icon || typeInfo.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {goal.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: displayColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {goalsSummary.goals.length > 3 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                +{goalsSummary.goals.length - 3} more goals
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400 mb-3">No savings goals yet</p>
            <Link
              to="/goals"
              className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
            >
              Create your first goal
            </Link>
          </div>
        )}
      </div>

      {/* AI Insights */}
      {user && (
        <AIInsights userId={user.id} />
      )}

      {/* Budget Progress & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Budget Progress</h2>
          <BudgetProgressChart data={chartData?.budgetProgress ?? []} />
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h2>
          {chartData?.recentTransactions && chartData.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {chartData.recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t.category} • {new Date(t.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`font-semibold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent transactions</p>
          )}
        </div>
      </div>
    </div>
  )
}
