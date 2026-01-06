/**
 * @fileoverview Dashboard page with Batman-inspired theme.
 *
 * Main landing page showing financial overview with:
 * - Summary stat cards with gold accents
 * - Visual charts for spending analysis
 * - Savings goals progress
 * - Recent activity
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

interface DashboardStats {
  totalBudget: number
  totalSpent: number
  totalIncome: number
  totalExpenses: number
  budgetCount: number
  transactionCount: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [goalsSummary, setGoalsSummary] = useState<GoalsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
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
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  // Calculate net (income - expenses)
  const netAmount = (stats?.totalIncome ?? 0) - (stats?.totalExpenses ?? 0)

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-content-primary">Dashboard</h1>
        <span className="text-sm text-content-tertiary">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Stats Cards - 4 column grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget Card */}
        <div className="stat-card p-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-content-tertiary uppercase tracking-wide">Budget</span>
            <div className="w-8 h-8 rounded bg-info/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-content-primary">
            ${(stats?.totalBudget ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-content-tertiary mt-1">{stats?.budgetCount ?? 0} active budgets</p>
        </div>

        {/* Spent Card */}
        <div className="stat-card p-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-content-tertiary uppercase tracking-wide">Spent</span>
            <div className="w-8 h-8 rounded bg-danger/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-danger">
            ${(stats?.totalSpent ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-content-tertiary mt-1">This month</p>
        </div>

        {/* Income Card */}
        <div className="stat-card p-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-content-tertiary uppercase tracking-wide">Income</span>
            <div className="w-8 h-8 rounded bg-success/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-success">
            ${(stats?.totalIncome ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-content-tertiary mt-1">Total earned</p>
        </div>

        {/* Net Card */}
        <div className="stat-card p-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-content-tertiary uppercase tracking-wide">Net</span>
            <div className={`w-8 h-8 rounded flex items-center justify-center ${netAmount >= 0 ? 'bg-primary-500/10' : 'bg-danger/10'}`}>
              <svg className={`w-4 h-4 ${netAmount >= 0 ? 'text-primary-500' : 'text-danger'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={netAmount >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
              </svg>
            </div>
          </div>
          <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-primary-500' : 'text-danger'}`}>
            {netAmount >= 0 ? '+' : '-'}${Math.abs(netAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-content-tertiary mt-1">Income - Expenses</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Spending by Category */}
        <div className="card p-card">
          <h2 className="text-sm font-semibold text-content-primary mb-3">Spending by Category</h2>
          <SpendingPieChart data={chartData?.spendingByCategory ?? []} />
        </div>

        {/* Income vs Expenses */}
        <div className="card p-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-content-primary">Income vs Expenses</h2>
            <span className="text-xs text-content-tertiary">Last 6 months</span>
          </div>
          <IncomeExpenseChart data={chartData?.monthlyComparison ?? []} />
        </div>
      </div>

      {/* Spending Trend */}
      <div className="card p-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-content-primary">Daily Spending</h2>
          <span className="text-xs text-content-tertiary">This month</span>
        </div>
        <SpendingTrendChart data={chartData?.dailySpending ?? []} />
      </div>

      {/* Bottom Row - Goals & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Savings Goals Summary */}
        <div className="card p-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-content-primary">Savings Goals</h2>
            <Link to="/goals" className="text-xs text-primary-500 hover:text-primary-400 transition-colors">
              View all
            </Link>
          </div>

          {goalsSummary && goalsSummary.goals.length > 0 ? (
            <div className="space-y-3">
              {/* Overall Progress Bar */}
              <div className="p-3 bg-theme-elevated rounded border border-border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-content-secondary">Total Progress</span>
                  <span className="text-xs font-medium text-primary-500">{goalsSummary.overallProgress}%</span>
                </div>
                <div className="w-full bg-theme-accent rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-primary-500 transition-all"
                    style={{ width: `${Math.min(goalsSummary.overallProgress, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-success">
                    ${goalsSummary.totalSaved.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-content-tertiary">
                    of ${goalsSummary.totalTarget.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Top 3 Goals */}
              <div className="space-y-2">
                {goalsSummary.goals.slice(0, 3).map((goal) => {
                  const percentage = Number(goal.targetAmount) > 0
                    ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100
                    : 0
                  const typeInfo = GOAL_TYPE_INFO[goal.type]

                  return (
                    <div key={goal.id} className="flex items-center gap-3">
                      <span className="text-lg">{goal.icon || typeInfo.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-content-primary truncate">{goal.name}</span>
                          <span className="text-xs text-content-tertiary ml-2">{percentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-theme-accent rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min(percentage, 100)}%`,
                              backgroundColor: goal.color || typeInfo.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {goalsSummary.goals.length > 3 && (
                <p className="text-xs text-content-tertiary text-center">
                  +{goalsSummary.goals.length - 3} more goals
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-content-tertiary mb-2">No savings goals yet</p>
              <Link to="/goals" className="text-xs text-primary-500 hover:text-primary-400">
                Create your first goal
              </Link>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card p-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-content-primary">Recent Activity</h2>
            <Link to="/transactions" className="text-xs text-primary-500 hover:text-primary-400 transition-colors">
              View all
            </Link>
          </div>

          {chartData?.recentTransactions && chartData.recentTransactions.length > 0 ? (
            <div className="space-y-1">
              {chartData.recentTransactions.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-content-primary truncate">{t.description}</p>
                    <p className="text-xs text-content-tertiary">
                      {t.category} • {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ml-3 ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-content-tertiary">No recent transactions</p>
            </div>
          )}
        </div>
      </div>

      {/* Budget Progress */}
      <div className="card p-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-content-primary">Budget Progress</h2>
          <Link to="/budgets" className="text-xs text-primary-500 hover:text-primary-400 transition-colors">
            Manage budgets
          </Link>
        </div>
        <BudgetProgressChart data={chartData?.budgetProgress ?? []} />
      </div>
    </div>
  )
}
