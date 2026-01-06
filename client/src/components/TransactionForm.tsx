/**
 * @fileoverview TransactionForm component for creating and editing financial transactions.
 * This component provides a modal form for managing both income and expense transactions.
 * It supports linking expenses to budgets and includes date selection and categorization.
 */

import { useState, useEffect } from 'react'
import api from '../services/api'
import { Transaction, Budget } from '../types'
import { ALL_CATEGORIES } from '../utils/constants'

/**
 * Props interface for the TransactionForm component.
 * @interface TransactionFormProps
 */
interface TransactionFormProps {
  /** Existing transaction to edit, or null when creating a new transaction */
  transaction: Transaction | null
  /** Callback function to close the modal */
  onClose: () => void
  /** Callback function triggered after successful save operation */
  onSuccess: () => void
}

/**
 * A modal form component for creating and editing transactions.
 *
 * Features:
 * - Toggle between income and expense transaction types
 * - Create and edit transactions with description, amount, category, and date
 * - Link expense transactions to existing budgets for tracking
 * - Pre-populates form fields when editing existing transactions
 * - Fetches available budgets on mount for expense linking
 * - Form validation with loading state and error handling
 *
 * @param {TransactionFormProps} props - The component props
 * @param {Transaction | null} props.transaction - Existing transaction for editing, null for creation
 * @param {Function} props.onClose - Handler to close the modal
 * @param {Function} props.onSuccess - Handler called after successful save
 * @returns {JSX.Element} A modal dialog containing the transaction form
 *
 * @example
 * // Create new transaction
 * <TransactionForm
 *   transaction={null}
 *   onClose={() => setShowForm(false)}
 *   onSuccess={() => { setShowForm(false); refreshTransactions(); }}
 * />
 *
 * @example
 * // Edit existing transaction
 * <TransactionForm
 *   transaction={selectedTransaction}
 *   onClose={() => setEditingTransaction(null)}
 *   onSuccess={() => { setEditingTransaction(null); refreshTransactions(); }}
 * />
 */
export default function TransactionForm({ transaction, onClose, onSuccess }: TransactionFormProps) {
  // Initialize form state with existing transaction values or defaults
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '')
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type ?? 'expense')
  const [category, setCategory] = useState(transaction?.category ?? ALL_CATEGORIES[0])

  // Initialize date field: parse existing date or use today's date
  const [date, setDate] = useState(
    transaction?.date
      ? new Date(transaction.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )

  // Budget linking state - allows expenses to be associated with a budget
  const [budgetId, setBudgetId] = useState(transaction?.budgetId ?? '')
  const [budgets, setBudgets] = useState<Budget[]>([])

  // Form state management
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Fetches available budgets on component mount.
   * Budgets are used for linking expense transactions to track spending.
   */
  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const response = await api.get('/budgets')
        setBudgets(response.data)
      } catch (err) {
        // Silently log error - budgets are optional for transactions
        console.error('Failed to fetch budgets:', err)
      }
    }
    fetchBudgets()
  }, [])

  /**
   * Handles form submission for creating or updating a transaction.
   * Validates input, prepares data, and makes the appropriate API call.
   *
   * @param {React.FormEvent} e - The form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent page reload on form submission
    e.preventDefault()

    // Reset error state and show loading indicator
    setError('')
    setIsLoading(true)

    try {
      // Prepare transaction data with proper type conversions
      const data = {
        description,
        amount: parseFloat(amount),
        type,
        category,
        date: new Date(date).toISOString(),
        // Only include budgetId if one is selected (converts empty string to undefined)
        budgetId: budgetId || undefined,
      }

      // Determine whether to create or update based on existing transaction
      if (transaction) {
        // Update existing transaction via PUT request
        await api.put(`/transactions/${transaction.id}`, data)
      } else {
        // Create new transaction via POST request
        await api.post('/transactions', data)
      }

      // Notify parent component of successful operation
      onSuccess()
    } catch (err) {
      // Display error message to user
      setError(err instanceof Error ? err.message : 'Failed to save transaction')
    } finally {
      // Always reset loading state
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal header - shows different text for create vs edit mode */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {transaction ? 'Edit Transaction' : 'Add Transaction'}
        </h2>

        {/* Error message display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-3 rounded-md mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction type selector - income or expense */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <div className="flex gap-4">
              {/* Expense radio option */}
              <label className="flex items-center">
                <input
                  type="radio"
                  value="expense"
                  checked={type === 'expense'}
                  onChange={() => setType('expense')}
                  className="mr-2"
                />
                <span className="text-red-600 dark:text-red-400">Expense</span>
              </label>
              {/* Income radio option */}
              <label className="flex items-center">
                <input
                  type="radio"
                  value="income"
                  checked={type === 'income'}
                  onChange={() => setType('income')}
                  className="mr-2"
                />
                <span className="text-green-600 dark:text-green-400">Income</span>
              </label>
            </div>
          </div>

          {/* Description input field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Grocery shopping"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Amount input field with number validation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Category dropdown selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date picker input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Budget linking dropdown - only shown for expenses when budgets exist */}
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
                  <option key={budget.id} value={budget.id}>{budget.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Form action buttons */}
          <div className="flex gap-3 pt-4">
            {/* Cancel button - closes modal without saving */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            {/* Submit button - shows loading state and appropriate label */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : transaction ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
