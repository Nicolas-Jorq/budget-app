/**
 * @fileoverview RecurringTransactionCard component for displaying recurring transaction info.
 *
 * This component renders a card showing recurring transaction details with frequency,
 * next due date, and action buttons for edit, delete, and skip operations.
 *
 * @module components/RecurringTransactionCard
 */

import { RecurringTransaction, FREQUENCY_INFO, DAYS_OF_WEEK } from '../types'

/**
 * Props interface for the RecurringTransactionCard component.
 */
interface RecurringTransactionCardProps {
  /** The recurring transaction to display */
  recurring: RecurringTransaction
  /** Callback when edit button is clicked */
  onEdit: () => void
  /** Callback when delete button is clicked */
  onDelete: () => void
  /** Callback when skip button is clicked */
  onSkip: () => void
}

/**
 * Formats a date string to a readable format.
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Gets the schedule description for a recurring transaction.
 */
function getScheduleDescription(recurring: RecurringTransaction): string {
  const freq = FREQUENCY_INFO[recurring.frequency].label

  if (recurring.frequency === 'WEEKLY' && recurring.dayOfWeek !== null) {
    const day = DAYS_OF_WEEK.find((d) => d.value === recurring.dayOfWeek)
    return `${freq} on ${day?.label || 'day'}`
  }

  if (
    (recurring.frequency === 'MONTHLY' || recurring.frequency === 'QUARTERLY') &&
    recurring.dayOfMonth !== null
  ) {
    const suffix =
      recurring.dayOfMonth === 1 ? 'st' :
      recurring.dayOfMonth === 2 ? 'nd' :
      recurring.dayOfMonth === 3 ? 'rd' : 'th'
    return `${freq} on the ${recurring.dayOfMonth}${suffix}`
  }

  return freq
}

/**
 * Card component displaying recurring transaction information.
 *
 * Features:
 * - Shows name, description, amount, and type (income/expense)
 * - Displays frequency schedule and next due date
 * - Shows linked budget if applicable
 * - Provides edit, delete, and skip next occurrence actions
 * - Visual indicators for active/inactive status
 */
export default function RecurringTransactionCard({
  recurring,
  onEdit,
  onDelete,
  onSkip,
}: RecurringTransactionCardProps) {
  const amount = Number(recurring.amount)
  const isExpense = recurring.type === 'expense'
  const nextDue = new Date(recurring.nextDueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  nextDue.setHours(0, 0, 0, 0)

  const daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0
  const isOverdue = daysUntilDue < 0

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-5 ${
        !recurring.isActive ? 'opacity-60' : ''
      }`}
    >
      {/* Header with name and actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {recurring.name}
            </h3>
            {!recurring.isActive && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {recurring.description}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Amount and type */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-2xl font-bold ${
            isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          }`}
        >
          {isExpense ? '-' : '+'}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            isExpense
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
          }`}
        >
          {isExpense ? 'Expense' : 'Income'}
        </span>
      </div>

      {/* Schedule info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{getScheduleDescription(recurring)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <svg
            className={`w-4 h-4 ${
              isOverdue
                ? 'text-red-500'
                : isDueSoon
                ? 'text-yellow-500'
                : 'text-gray-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span
            className={
              isOverdue
                ? 'text-red-600 dark:text-red-400 font-medium'
                : isDueSoon
                ? 'text-yellow-600 dark:text-yellow-400 font-medium'
                : 'text-gray-600 dark:text-gray-400'
            }
          >
            {isOverdue
              ? `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`
              : daysUntilDue === 0
              ? 'Due today'
              : daysUntilDue === 1
              ? 'Due tomorrow'
              : `Due ${formatDate(recurring.nextDueDate)}`}
          </span>
        </div>

        {recurring.category && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>{recurring.category}</span>
          </div>
        )}

        {recurring.budget && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Budget: {recurring.budget.name}</span>
          </div>
        )}
      </div>

      {/* Stats and actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {recurring._count?.generatedTransactions ?? 0} transactions generated
        </div>

        {recurring.isActive && (
          <button
            onClick={onSkip}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Skip Next
          </button>
        )}
      </div>
    </div>
  )
}
