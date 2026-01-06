import { useEffect, useState } from 'react'
import api from '../services/api'
import { ChartData } from '../types'
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/charts'),
        ])
        setStats(statsRes.data)
        setChartData(chartsRes.data)
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
