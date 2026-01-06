/**
 * @fileoverview BudgetForm component for creating and editing budgets.
 * This component provides a modal form for budget management, supporting
 * both creation of new budgets and editing of existing ones. It handles
 * form state, validation, and API communication.
 */

import { useState } from 'react'
import api from '../services/api'
import { Budget } from '../types'

/**
 * Props interface for the BudgetForm component.
 * @interface BudgetFormProps
 */
interface BudgetFormProps {
  /** Existing budget to edit, or null when creating a new budget */
  budget: Budget | null
  /** Callback function to close the modal */
  onClose: () => void
  /** Callback function triggered after successful save operation */
  onSuccess: () => void
}

/**
 * Predefined list of budget categories.
 * These categories help users organize their budgets by expense type.
 * @constant {string[]}
 */
const categories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Health',
  'Travel',
  'Education',
  'Other',
]

/**
 * A modal form component for creating and editing budgets.
 *
 * Features:
 * - Create new budgets with name, amount, and category
 * - Edit existing budgets with pre-populated values
 * - Form validation via HTML5 required attributes
 * - Loading state feedback during API operations
 * - Error handling with user-friendly messages
 *
 * @param {BudgetFormProps} props - The component props
 * @param {Budget | null} props.budget - Existing budget for editing, null for creation
 * @param {Function} props.onClose - Handler to close the modal
 * @param {Function} props.onSuccess - Handler called after successful save
 * @returns {JSX.Element} A modal dialog containing the budget form
 *
 * @example
 * // Create new budget
 * <BudgetForm
 *   budget={null}
 *   onClose={() => setShowForm(false)}
 *   onSuccess={() => { setShowForm(false); refreshBudgets(); }}
 * />
 *
 * @example
 * // Edit existing budget
 * <BudgetForm
 *   budget={selectedBudget}
 *   onClose={() => setEditingBudget(null)}
 *   onSuccess={() => { setEditingBudget(null); refreshBudgets(); }}
 * />
 */
export default function BudgetForm({ budget, onClose, onSuccess }: BudgetFormProps) {
  // Initialize form state with existing budget values or defaults
  const [name, setName] = useState(budget?.name ?? '')
  const [amount, setAmount] = useState(budget?.amount?.toString() ?? '')
  const [category, setCategory] = useState(budget?.category ?? categories[0])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Handles form submission for creating or updating a budget.
   * Prevents default form behavior, validates input, and makes the appropriate API call.
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
      // Prepare budget data, converting amount string to number
      const data = { name, amount: parseFloat(amount), category }

      // Determine whether to create or update based on existing budget
      if (budget) {
        // Update existing budget via PUT request
        await api.put(`/budgets/${budget.id}`, data)
      } else {
        // Create new budget via POST request
        await api.post('/budgets', data)
      }

      // Notify parent component of successful operation
      onSuccess()
    } catch (err) {
      // Display error message to user
      setError(err instanceof Error ? err.message : 'Failed to save budget')
    } finally {
      // Always reset loading state
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        {/* Modal header - shows different text for create vs edit mode */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {budget ? 'Edit Budget' : 'Create Budget'}
        </h2>

        {/* Error message display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-3 rounded-md mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Budget name input field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Budget Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Monthly Groceries"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Budget amount input field with number validation */}
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
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

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
              {isLoading ? 'Saving...' : budget ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
