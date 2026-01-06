import { useEffect, useState } from 'react'
import api from '../services/api'

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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats')
        setStats(response.data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Budget', value: stats?.totalBudget ?? 0, color: 'bg-blue-500' },
    { label: 'Total Spent', value: stats?.totalSpent ?? 0, color: 'bg-red-500' },
    { label: 'Total Income', value: stats?.totalIncome ?? 0, color: 'bg-green-500' },
    { label: 'Total Expenses', value: stats?.totalExpenses ?? 0, color: 'bg-orange-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
              <span className="text-white text-xl font-bold">$</span>
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">
              ${stat.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget Overview</h2>
          <p className="text-gray-500">
            You have {stats?.budgetCount ?? 0} active budgets
          </p>
          {stats && stats.totalBudget > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Spent</span>
                <span>{((stats.totalSpent / stats.totalBudget) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min((stats.totalSpent / stats.totalBudget) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <p className="text-gray-500">
            You have {stats?.transactionCount ?? 0} transactions
          </p>
        </div>
      </div>
    </div>
  )
}
