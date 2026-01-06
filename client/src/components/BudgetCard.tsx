/**
 * @fileoverview BudgetCard component for displaying individual budget information.
 * This component renders a card showing budget details including name, category,
 * spending progress, and remaining amount. It provides visual feedback through
 * a progress bar that changes color based on spending percentage.
 */

import { Budget } from '../types'

/**
 * Props interface for the BudgetCard component.
 * @interface BudgetCardProps
 */
interface BudgetCardProps {
  /** The budget object containing all budget data to display */
  budget: Budget
  /** Callback function triggered when the edit button is clicked */
  onEdit: () => void
  /** Callback function triggered when the delete button is clicked */
  onDelete: () => void
}

/**
 * A card component that displays budget information with visual progress tracking.
 *
 * Features:
 * - Displays budget name and category
 * - Shows spending progress with a color-coded progress bar
 * - Indicates remaining or over-budget amount
 * - Provides edit and delete action buttons
 *
 * @param {BudgetCardProps} props - The component props
 * @param {Budget} props.budget - The budget data to display
 * @param {Function} props.onEdit - Handler for edit button click
 * @param {Function} props.onDelete - Handler for delete button click
 * @returns {JSX.Element} A styled card displaying budget information
 *
 * @example
 * <BudgetCard
 *   budget={myBudget}
 *   onEdit={() => openEditModal(myBudget)}
 *   onDelete={() => confirmDelete(myBudget.id)}
 * />
 */
export default function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  // Convert values to numbers to ensure proper arithmetic operations
  const spent = Number(budget.spent)
  const amount = Number(budget.amount)

  // Calculate spending percentage, avoiding division by zero
  const percentage = amount > 0 ? (spent / amount) * 100 : 0

  // Calculate remaining budget (negative if over budget)
  const remaining = amount - spent

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header section with budget name, category, and action buttons */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{budget.name}</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {budget.category}
          </span>
        </div>
        <div className="flex gap-2">
          {/* Edit button */}
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {/* Delete button */}
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar section showing spent vs budget amount */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">
            ${spent.toLocaleString('en-US', { minimumFractionDigits: 2 })} spent
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        {/* Color-coded progress bar: red >90%, yellow >70%, green otherwise */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-primary-600'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer showing remaining amount and percentage */}
      <div className="flex justify-between items-center">
        {/* Display remaining amount in green, or over-budget amount in red */}
        <span className={`text-sm font-medium ${remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          ${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })} {remaining >= 0 ? 'remaining' : 'over budget'}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  )
}
