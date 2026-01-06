/**
 * @fileoverview RecurringTransactionForm component for creating and editing recurring transactions.
 *
 * This component provides a modal form for managing recurring transactions with
 * frequency configuration, schedule settings, and optional budget linking.
 *
 * @module components/RecurringTransactionForm
 */

import { useState, useEffect } from 'react'
import api from '../services/api'
import {
  RecurringTransaction,
  RecurrenceFrequency,
  Budget,
  FREQUENCY_INFO,
  DAYS_OF_WEEK,
} from '../types'
import { useCategories } from '../hooks/useCategories'

/**
 * Props interface for the RecurringTransactionForm component.
 */
interface RecurringTransactionFormProps {
  /** Existing recurring transaction to edit, or null for creation */
  recurring: RecurringTransaction | null
  /** Callback to close the modal */
  onClose: () => void
  /** Callback after successful save */
  onSuccess: () => void
}

/** Available frequency options */
const frequencies: RecurrenceFrequency[] = [
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
]

/**
 * Modal form for creating and editing recurring transactions.
 *
 * Features:
 * - Configure name, description, amount, and transaction type
 * - Set frequency with specific day options (day of week/month)
 * - Set start and optional end dates
 * - Link to budgets for expense tracking
 * - Form validation and error handling
 */
export default function RecurringTransactionForm({
  recurring,
  onClose,
  onSuccess,
}: RecurringTransactionFormProps) {
  // Fetch user's categories
  const { expenseCategories, incomeCategories, isLoading: categoriesLoading } = useCategories()

  // Core fields
  const [name, setName] = useState(recurring?.name ?? '')
  const [description, setDescription] = useState(recurring?.description ?? '')
  const [amount, setAmount] = useState(recurring?.amount?.toString() ?? '')
  const [type, setType] = useState<'income' | 'expense'>(recurring?.type ?? 'expense')
  const [category, setCategory] = useState(recurring?.category ?? '')

  // Schedule fields
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(recurring?.frequency ?? 'MONTHLY')
  const [startDate, setStartDate] = useState(
    recurring?.startDate
      ? new Date(recurring.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(
    recurring?.endDate ? new Date(recurring.endDate).toISOString().split('T')[0] : ''
  )
  const [dayOfMonth, setDayOfMonth] = useState(recurring?.dayOfMonth?.toString() ?? '')
  const [dayOfWeek, setDayOfWeek] = useState(recurring?.dayOfWeek?.toString() ?? '')

  // Budget linking
  const [budgetId, setBudgetId] = useState(recurring?.budgetId ?? '')
  const [budgets, setBudgets] = useState<Budget[]>([])

  // Form state
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Fetch budgets for linking
  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const response = await api.get('/budgets')
        setBudgets(response.data)
      } catch (err) {
        console.error('Failed to fetch budgets:', err)
      }
    }
    fetchBudgets()
  }, [])

  // Get categories based on selected type
  const availableCategories = type === 'expense' ? expenseCategories : incomeCategories

  // Update category when type changes or categories load
  useEffect(() => {
    if (availableCategories.length > 0) {
      const categoryExists = availableCategories.some((c) => c.name === category)
      if (!categoryExists) {
        setCategory(availableCategories[0].name)
      }
    }
  }, [type, availableCategories, category])

  // Reset schedule-specific fields when frequency changes
  useEffect(() => {
    if (frequency !== 'WEEKLY') {
      setDayOfWeek('')
    }
    if (!['MONTHLY', 'QUARTERLY'].includes(frequency)) {
      setDayOfMonth('')
    }
  }, [frequency])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = {
        name,
        description,
        amount: parseFloat(amount),
        type,
        category,
        frequency,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth, 10) : null,
        dayOfWeek: dayOfWeek ? parseInt(dayOfWeek, 10) : null,
        budgetId: budgetId || null,
      }

      if (recurring) {
        await api.put(`/recurring/${recurring.id}`, data)
      } else {
        await api.post('/recurring', data)
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recurring transaction')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {recurring ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}
        </h2>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Netflix Subscription"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description for transactions"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Type toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2 px-3 rounded-md border-2 transition-all ${
                  type === 'expense'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2 px-3 rounded-md border-2 transition-all ${
                  type === 'income'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={categoriesLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
            >
              {categoriesLoading ? (
                <option>Loading...</option>
              ) : (
                availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {frequencies.map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFrequency(freq)}
                  className={`py-2 px-2 text-sm rounded-md border-2 transition-all ${
                    frequency === freq
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {FREQUENCY_INFO[freq].shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Day of Week (for weekly) */}
          {frequency === 'WEEKLY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Day of Week
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Any day</option>
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Day of Month (for monthly/quarterly) */}
          {(frequency === 'MONTHLY' || frequency === 'QUARTERLY') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Day of Month
              </label>
              <select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Same day as start</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                    {day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* End Date (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date (optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave empty for indefinite recurrence
            </p>
          </div>

          {/* Budget linking (expense only) */}
          {type === 'expense' && budgets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Link to Budget (optional)
              </label>
              <select
                value={budgetId}
                onChange={(e) => setBudgetId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">No budget</option>
                {budgets.map((budget) => (
                  <option key={budget.id} value={budget.id}>
                    {budget.name} ({budget.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Form actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : recurring ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
