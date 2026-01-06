/**
 * @fileoverview Recurring Transactions management page for the Budget App.
 *
 * This page provides full CRUD operations for recurring transactions including
 * scheduled bills, subscriptions, and regular income entries.
 *
 * Features:
 * - Summary statistics (total expenses, income, active count)
 * - Upcoming transactions preview section
 * - List of all recurring transactions with management actions
 * - Process due transactions manually
 * - Create, edit, delete, and skip recurring transactions
 *
 * @module pages/RecurringTransactions
 */

import { useEffect, useState } from 'react'
import api from '../services/api'
import { RecurringTransaction, UpcomingRecurring, Transaction, FREQUENCY_INFO } from '../types'
import RecurringTransactionCard from '../components/RecurringTransactionCard'
import RecurringTransactionForm from '../components/RecurringTransactionForm'

/**
 * Recurring Transactions page component.
 *
 * Manages recurring transaction templates that automatically generate
 * transactions on a schedule.
 */
export default function RecurringTransactions() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingRecurring[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processResult, setProcessResult] = useState<{ count: number; transactions: Transaction[] } | null>(null)

  /** Fetches all recurring transactions */
  const fetchRecurring = async () => {
    try {
      const response = await api.get('/recurring')
      setRecurring(response.data)
    } catch (error) {
      console.error('Failed to fetch recurring transactions:', error)
    }
  }

  /** Fetches upcoming due transactions */
  const fetchUpcoming = async () => {
    try {
      const response = await api.get('/recurring/upcoming?days=14')
      setUpcoming(response.data)
    } catch (error) {
      console.error('Failed to fetch upcoming:', error)
    }
  }

  /** Initial data fetch */
  useEffect(() => {
    const fetchAll = async () => {
      await Promise.all([fetchRecurring(), fetchUpcoming()])
      setIsLoading(false)
    }
    fetchAll()
  }, [])

  /** Opens form in create mode */
  const handleCreate = () => {
    setEditingRecurring(null)
    setShowForm(true)
  }

  /** Opens form in edit mode */
  const handleEdit = (rec: RecurringTransaction) => {
    setEditingRecurring(rec)
    setShowForm(true)
  }

  /** Deletes a recurring transaction */
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring transaction?')) return
    try {
      await api.delete(`/recurring/${id}`)
      setRecurring(recurring.filter((r) => r.id !== id))
      setUpcoming(upcoming.filter((u) => u.recurring.id !== id))
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  /** Skips the next occurrence */
  const handleSkip = async (id: string) => {
    try {
      const response = await api.post(`/recurring/${id}/skip`)
      setRecurring(recurring.map((r) => (r.id === id ? response.data : r)))
      await fetchUpcoming()
    } catch (error) {
      console.error('Failed to skip:', error)
    }
  }

  /** Processes all due transactions */
  const handleProcess = async () => {
    setIsProcessing(true)
    setProcessResult(null)
    try {
      const response = await api.post('/recurring/process')
      setProcessResult({
        count: response.data.transactions.length,
        transactions: response.data.transactions,
      })
      await Promise.all([fetchRecurring(), fetchUpcoming()])
    } catch (error) {
      console.error('Failed to process:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  /** Form close handler */
  const handleFormClose = () => {
    setShowForm(false)
    setEditingRecurring(null)
  }

  /** Form success handler */
  const handleFormSuccess = async () => {
    handleFormClose()
    await Promise.all([fetchRecurring(), fetchUpcoming()])
  }

  // Calculate summary statistics
  const activeRecurring = recurring.filter((r) => r.isActive)
  const totalMonthlyExpenses = activeRecurring
    .filter((r) => r.type === 'expense')
    .reduce((sum, r) => {
      const amount = Number(r.amount)
      switch (r.frequency) {
        case 'DAILY': return sum + amount * 30
        case 'WEEKLY': return sum + amount * 4.33
        case 'BIWEEKLY': return sum + amount * 2.17
        case 'MONTHLY': return sum + amount
        case 'QUARTERLY': return sum + amount / 3
        case 'YEARLY': return sum + amount / 12
        default: return sum
      }
    }, 0)

  const totalMonthlyIncome = activeRecurring
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => {
      const amount = Number(r.amount)
      switch (r.frequency) {
        case 'DAILY': return sum + amount * 30
        case 'WEEKLY': return sum + amount * 4.33
        case 'BIWEEKLY': return sum + amount * 2.17
        case 'MONTHLY': return sum + amount
        case 'QUARTERLY': return sum + amount / 3
        case 'YEARLY': return sum + amount / 12
        default: return sum
      }
    }, 0)

  const dueNow = upcoming.filter((u) => {
    const due = new Date(u.dueDate)
    return due <= new Date()
  }).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Recurring Transactions
        </h1>
        <div className="flex gap-3">
          {dueNow > 0 && (
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : `Process ${dueNow} Due`}
            </button>
          )}
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            + New Recurring
          </button>
        </div>
      </div>

      {/* Process Result Banner */}
      {processResult && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">
                {processResult.count} transaction{processResult.count !== 1 ? 's' : ''} generated
              </span>
            </div>
            <button
              onClick={() => setProcessResult(null)}
              className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {recurring.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Expenses</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${totalMonthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Income</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${totalMonthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Net Monthly</p>
            <p className={`text-2xl font-bold ${totalMonthlyIncome - totalMonthlyExpenses >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${(totalMonthlyIncome - totalMonthlyExpenses).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Recurring</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeRecurring.length}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> / {recurring.length}</span>
            </p>
          </div>
        </div>
      )}

      {/* Upcoming Section */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Coming Up (Next 14 Days)
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
            {upcoming.slice(0, 5).map((item) => {
              const due = new Date(item.dueDate)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              due.setHours(0, 0, 0, 0)
              const isToday = due.getTime() === today.getTime()
              const isPast = due < today

              return (
                <div key={`${item.recurring.id}-${item.dueDate}`} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.recurring.type === 'expense'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-green-100 dark:bg-green-900/30'
                      }`}
                    >
                      <span
                        className={`text-lg ${
                          item.recurring.type === 'expense'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {item.recurring.type === 'expense' ? '-' : '+'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.recurring.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.recurring.category} • {FREQUENCY_INFO[item.recurring.frequency].label}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        item.recurring.type === 'expense'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {item.recurring.type === 'expense' ? '-' : '+'}$
                      {Number(item.recurring.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p
                      className={`text-sm ${
                        isPast
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : isToday
                          ? 'text-yellow-600 dark:text-yellow-400 font-medium'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {isPast
                        ? 'Overdue'
                        : isToday
                        ? 'Due Today'
                        : due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recurring.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">🔄</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No recurring transactions yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Set up recurring transactions for bills, subscriptions, and regular income to automate your tracking.
          </p>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Create Your First Recurring Transaction
          </button>
        </div>
      ) : (
        <>
          {/* Active Recurring */}
          {activeRecurring.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Active ({activeRecurring.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeRecurring.map((rec) => (
                  <RecurringTransactionCard
                    key={rec.id}
                    recurring={rec}
                    onEdit={() => handleEdit(rec)}
                    onDelete={() => handleDelete(rec.id)}
                    onSkip={() => handleSkip(rec.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Recurring */}
          {recurring.filter((r) => !r.isActive).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Inactive ({recurring.filter((r) => !r.isActive).length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recurring
                  .filter((r) => !r.isActive)
                  .map((rec) => (
                    <RecurringTransactionCard
                      key={rec.id}
                      recurring={rec}
                      onEdit={() => handleEdit(rec)}
                      onDelete={() => handleDelete(rec.id)}
                      onSkip={() => handleSkip(rec.id)}
                    />
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <RecurringTransactionForm
          recurring={editingRecurring}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}
