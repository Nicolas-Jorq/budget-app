/**
 * @fileoverview ContributionForm component for adding contributions to savings goals.
 * This component provides a modal form for contributing money to a specific savings
 * goal, with quick-select amount buttons and optional note functionality.
 */

import { useState } from 'react'
import api from '../services/api'
import { SavingsGoal, GOAL_TYPE_INFO } from '../types'

/**
 * Props interface for the ContributionForm component.
 * @interface ContributionFormProps
 */
interface ContributionFormProps {
  /** The savings goal to contribute to */
  goal: SavingsGoal
  /** Callback function to close the modal */
  onClose: () => void
  /** Callback function triggered after successful contribution */
  onSuccess: () => void
}

/**
 * A modal form component for adding contributions to savings goals.
 *
 * Features:
 * - Displays goal information (icon, name, remaining amount)
 * - Custom amount input with currency formatting
 * - Quick-select buttons for common contribution amounts ($50, $100, $250, $500)
 * - "All" button to contribute the full remaining amount
 * - Optional note field for contribution description
 * - Form validation with loading state and error handling
 *
 * @param {ContributionFormProps} props - The component props
 * @param {SavingsGoal} props.goal - The savings goal to contribute to
 * @param {Function} props.onClose - Handler to close the modal
 * @param {Function} props.onSuccess - Handler called after successful contribution
 * @returns {JSX.Element} A modal dialog containing the contribution form
 *
 * @example
 * <ContributionForm
 *   goal={selectedGoal}
 *   onClose={() => setShowContributeForm(false)}
 *   onSuccess={() => { setShowContributeForm(false); refreshGoals(); }}
 * />
 */
export default function ContributionForm({ goal, onClose, onSuccess }: ContributionFormProps) {
  // Form field state
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  // Form state management
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Get display properties from goal type configuration
  const typeInfo = GOAL_TYPE_INFO[goal.type]
  const displayIcon = goal.icon || typeInfo.icon

  // Calculate remaining amount needed to complete the goal
  const remaining = Number(goal.targetAmount) - Number(goal.currentAmount)

  /**
   * Handles form submission for adding a contribution to the goal.
   * Validates input, makes API call, and triggers success callback.
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
      // Make API request to add contribution to the goal
      await api.post(`/finance/goals/${goal.id}/contributions`, {
        amount: parseFloat(amount),
        // Only include note if provided (converts empty string to undefined)
        note: note || undefined,
      })

      // Notify parent component of successful operation
      onSuccess()
    } catch (err) {
      // Display error message to user
      setError(err instanceof Error ? err.message : 'Failed to add contribution')
    } finally {
      // Always reset loading state
      setIsLoading(false)
    }
  }

  /**
   * Handles quick amount button clicks by setting the amount field.
   * Used for preset contribution amounts ($50, $100, $250, $500, or remaining).
   *
   * @param {number} value - The amount to set in the form
   */
  const handleQuickAmount = (value: number) => {
    setAmount(value.toString())
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        {/* Header section with goal icon and name */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{displayIcon}</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Add Contribution
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{goal.name}</p>
          </div>
        </div>

        {/* Goal progress summary showing remaining amount */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Remaining to goal:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Error message display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount input field with currency prefix */}
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

          {/* Quick amount selection buttons for common contribution values */}
          <div className="flex gap-2">
            {[50, 100, 250, 500].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAmount(val)}
                className="flex-1 py-1 px-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                ${val}
              </button>
            ))}
            {/* "All" button - only shown when there's a remaining amount */}
            {remaining > 0 && (
              <button
                type="button"
                onClick={() => handleQuickAmount(remaining)}
                className="flex-1 py-1 px-2 text-sm border border-primary-500 rounded-md text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
              >
                All
              </button>
            )}
          </div>

          {/* Optional note input field for contribution description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Birthday money"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
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
            {/* Submit button - shows loading state */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Contribution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
