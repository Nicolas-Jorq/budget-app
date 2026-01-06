/**
 * @fileoverview Baby Milestone Card Component
 *
 * This component displays a single baby-related savings milestone as a card.
 * It shows the milestone's progress toward a financial goal, category information,
 * and provides actions for contributing, editing, or deleting the milestone.
 *
 * @module components/baby/BabyMilestoneCard
 */

import { BabyMilestone, MILESTONE_CATEGORY_INFO } from '../../types'

/**
 * Props for the BabyMilestoneCard component.
 *
 * @interface BabyMilestoneCardProps
 * @property {BabyMilestone} milestone - The milestone data to display
 * @property {() => void} onContribute - Callback when user wants to add a contribution
 * @property {() => void} onEdit - Callback when user wants to edit the milestone
 * @property {() => void} onDelete - Callback when user wants to delete the milestone
 */
interface BabyMilestoneCardProps {
  milestone: BabyMilestone
  onContribute: () => void
  onEdit: () => void
  onDelete: () => void
}

/**
 * Renders a card displaying a baby savings milestone with progress tracking.
 *
 * Features:
 * - Visual category icon and colored label
 * - Progress bar showing savings progress toward target
 * - Due month display with smart formatting (before/after birth)
 * - Optional notes display (truncated to 2 lines)
 * - Action buttons for contribute, edit, and delete
 * - Completion indicator when goal is met
 * - Reduced opacity for completed milestones
 *
 * @param {BabyMilestoneCardProps} props - Component props
 * @param {BabyMilestone} props.milestone - Milestone data object
 * @param {() => void} props.onContribute - Contribute button handler
 * @param {() => void} props.onEdit - Edit button handler
 * @param {() => void} props.onDelete - Delete button handler
 * @returns {JSX.Element} A milestone card with progress and actions
 *
 * @example
 * <BabyMilestoneCard
 *   milestone={babyMilestone}
 *   onContribute={() => openContributeModal(milestone.id)}
 *   onEdit={() => openEditModal(milestone.id)}
 *   onDelete={() => confirmDelete(milestone.id)}
 * />
 */
export default function BabyMilestoneCard({
  milestone,
  onContribute,
  onEdit,
  onDelete,
}: BabyMilestoneCardProps) {
  // Get category display info (icon, color, label)
  const categoryInfo = MILESTONE_CATEGORY_INFO[milestone.category]

  // Calculate progress percentage, capped at 100%
  const percentage = milestone.targetAmount > 0
    ? Math.min((milestone.currentAmount / milestone.targetAmount) * 100, 100)
    : 0

  // Calculate remaining amount, minimum of 0 (for completed milestones)
  const remaining = Math.max(milestone.targetAmount - milestone.currentAmount, 0)

  /**
   * Formats the due month into a human-readable label.
   * Handles negative months (before birth), zero (at birth), and positive (after birth).
   *
   * @param {number | null} dueMonth - Months relative to birth (negative = before)
   * @returns {string | null} Formatted label or null if no due month set
   */
  const getDueMonthLabel = (dueMonth: number | null) => {
    if (dueMonth === null) return null
    if (dueMonth < 0) return `${Math.abs(dueMonth)} mo before birth`
    if (dueMonth === 0) return 'At birth'
    if (dueMonth <= 12) return `${dueMonth} mo old`
    // For ages over 12 months, show years and remaining months
    const years = Math.floor(dueMonth / 12)
    const months = dueMonth % 12
    return months > 0 ? `${years}y ${months}mo` : `${years} year${years > 1 ? 's' : ''}`
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${milestone.isCompleted ? 'opacity-75' : ''}`}>
      {/* Header with category icon, name, and completion status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryInfo.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{milestone.name}</h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${categoryInfo.color}20`, color: categoryInfo.color }}
            >
              {categoryInfo.label}
            </span>
          </div>
        </div>
        {milestone.isCompleted && (
          <span className="text-green-500 text-xl" title="Completed">✓</span>
        )}
      </div>

      {/* Progress section */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">
            ${milestone.currentAmount.toLocaleString()}
          </span>
          <span className="text-gray-900 dark:text-white font-medium">
            ${milestone.targetAmount.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${percentage}%`,
              backgroundColor: milestone.isCompleted ? '#10b981' : categoryInfo.color,
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-500 dark:text-gray-400">
            {percentage.toFixed(0)}% complete
          </span>
          {!milestone.isCompleted && remaining > 0 && (
            <span className="text-gray-500 dark:text-gray-400">
              ${remaining.toLocaleString()} to go
            </span>
          )}
        </div>
      </div>

      {/* Due month display */}
      {milestone.dueMonth !== null && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Target: {getDueMonthLabel(milestone.dueMonth)}
        </div>
      )}

      {/* Notes (truncated to 2 lines) */}
      {milestone.notes && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {milestone.notes}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {!milestone.isCompleted && (
          <button
            onClick={onContribute}
            className="flex-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
          >
            + Contribute
          </button>
        )}
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
