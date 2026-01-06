/**
 * @fileoverview GoalCard component for displaying savings goal information.
 * This component renders a card showing savings goal details with visual progress
 * tracking, deadline information, and specialized displays for baby and house goals.
 * It provides actions for editing, deleting, and contributing to goals.
 */

import { Link } from 'react-router-dom'
import { SavingsGoal, GOAL_TYPE_INFO, BabyGoalMetadata, HouseGoalMetadata, PROPERTY_TYPE_INFO, PropertyType } from '../types'

/**
 * Props interface for the GoalCard component.
 * @interface GoalCardProps
 */
interface GoalCardProps {
  /** The savings goal object containing all goal data to display */
  goal: SavingsGoal
  /** Callback function triggered when the edit button is clicked */
  onEdit: () => void
  /** Callback function triggered when the delete button is clicked */
  onDelete: () => void
  /** Callback function triggered when the contribute button is clicked */
  onContribute: () => void
}

/**
 * A card component that displays savings goal information with visual progress tracking.
 *
 * Features:
 * - Displays goal name, type, icon, and color customization
 * - Shows progress bar with current amount vs target amount
 * - Calculates and displays days remaining until deadline
 * - Special display sections for baby goals (pregnancy status, due date)
 * - Special display sections for house goals (location, price, bedrooms, bathrooms)
 * - Provides edit, delete, and contribute action buttons
 * - Links to detailed views for baby and house goal types
 *
 * @param {GoalCardProps} props - The component props
 * @param {SavingsGoal} props.goal - The savings goal data to display
 * @param {Function} props.onEdit - Handler for edit button click
 * @param {Function} props.onDelete - Handler for delete button click
 * @param {Function} props.onContribute - Handler for contribute button click
 * @returns {JSX.Element} A styled card displaying savings goal information
 *
 * @example
 * <GoalCard
 *   goal={myGoal}
 *   onEdit={() => openEditModal(myGoal)}
 *   onDelete={() => confirmDelete(myGoal.id)}
 *   onContribute={() => openContributeModal(myGoal)}
 * />
 */
export default function GoalCard({ goal, onEdit, onDelete, onContribute }: GoalCardProps) {
  // Determine goal type for conditional rendering of specialized sections
  const isBabyGoal = goal.type === 'BABY'
  const isHouseGoal = goal.type === 'HOUSE'

  // Extract type-specific metadata with proper type casting
  const babyMetadata = isBabyGoal ? goal.metadata as BabyGoalMetadata | null : null
  const houseMetadata = isHouseGoal ? goal.metadata as HouseGoalMetadata | null : null

  // Convert values to numbers for arithmetic operations
  const currentAmount = Number(goal.currentAmount)
  const targetAmount = Number(goal.targetAmount)

  // Calculate progress percentage, avoiding division by zero
  const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0

  // Calculate remaining amount needed to reach the goal
  const remaining = targetAmount - currentAmount

  // Get default icon and color from goal type configuration
  const typeInfo = GOAL_TYPE_INFO[goal.type]
  const displayIcon = goal.icon || typeInfo.icon
  const displayColor = goal.color || typeInfo.color

  // Calculate days remaining until deadline (null if no deadline set)
  const daysRemaining = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header section with goal icon, name, type, and action buttons */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Goal icon with semi-transparent background using goal color */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${displayColor}20` }}
          >
            {displayIcon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {typeInfo.label}
            </span>
          </div>
        </div>
        {/* Action buttons for edit and delete */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            title="Edit goal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete goal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Section - shows current vs target amount with visual progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">
            ${currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            ${targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        {/* Progress bar with animated width and goal-specific color */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: displayColor,
            }}
          />
        </div>
        {/* Progress summary with completion status or remaining amount */}
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm font-medium" style={{ color: displayColor }}>
            {percentage.toFixed(1)}% complete
          </span>
          {goal.isCompleted ? (
            // Show completion badge when goal is achieved
            <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Completed!
            </span>
          ) : (
            // Show remaining amount when goal is still in progress
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })} to go
            </span>
          )}
        </div>
      </div>

      {/* Deadline section - displays days remaining or overdue status */}
      {goal.deadline && (
        <div className="mb-4 text-sm">
          {daysRemaining !== null && daysRemaining > 0 ? (
            // Days remaining until deadline
            <span className="text-gray-500 dark:text-gray-400">
              {daysRemaining} days remaining
            </span>
          ) : daysRemaining !== null && daysRemaining <= 0 ? (
            // Deadline reached or passed - show warning in red
            <span className="text-red-500 dark:text-red-400">
              {daysRemaining === 0 ? 'Due today' : `${Math.abs(daysRemaining)} days overdue`}
            </span>
          ) : null}
        </div>
      )}

      {/* Baby Goal Info - specialized display for baby-related savings goals */}
      {isBabyGoal && babyMetadata && (
        <div className="mb-4 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-pink-700 dark:text-pink-300">
            {/* Icon changes based on pregnancy status */}
            <span>{babyMetadata.isPregnancy ? '🤰' : '👶'}</span>
            <span>
              {babyMetadata.babyName ? `${babyMetadata.babyName} - ` : ''}
              {babyMetadata.isPregnancy ? 'Expecting' : 'Born'}
              {/* Show due date for expecting babies */}
              {babyMetadata.expectedDueDate && babyMetadata.isPregnancy && (
                <span className="ml-1">
                  (Due {new Date(babyMetadata.expectedDueDate).toLocaleDateString()})
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* House Goal Info - specialized display for house-related savings goals */}
      {isHouseGoal && houseMetadata && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex flex-col gap-1 text-sm text-blue-700 dark:text-blue-300">
            {/* Location display */}
            {houseMetadata.targetLocation && (
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{houseMetadata.targetLocation}</span>
              </div>
            )}
            {/* Property details: price, bedrooms, bathrooms, type */}
            <div className="flex items-center gap-4 flex-wrap">
              {houseMetadata.targetPrice && (
                <span>
                  ${houseMetadata.targetPrice.toLocaleString('en-US')} target
                </span>
              )}
              {houseMetadata.targetBedrooms && (
                <span>{houseMetadata.targetBedrooms} bed</span>
              )}
              {houseMetadata.targetBathrooms && (
                <span>{houseMetadata.targetBathrooms} bath</span>
              )}
              {houseMetadata.propertyType && PROPERTY_TYPE_INFO[houseMetadata.propertyType as PropertyType] && (
                <span>{PROPERTY_TYPE_INFO[houseMetadata.propertyType as PropertyType].icon}</span>
              )}
            </div>
            {/* Down payment percentage info */}
            {houseMetadata.downPaymentPct && (
              <span className="text-xs opacity-75">
                {houseMetadata.downPaymentPct}% down payment goal
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions section - contribute button and detail links */}
      <div className="flex gap-2">
        {/* Contribute button - only shown for incomplete goals */}
        {!goal.isCompleted && (
          <button
            onClick={onContribute}
            className="flex-1 py-2 px-4 rounded-md text-white font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: displayColor }}
          >
            + Contribute
          </button>
        )}
        {/* View Details link for baby goals */}
        {isBabyGoal && (
          <Link
            to={`/goals/${goal.id}/baby`}
            className="flex-1 py-2 px-4 rounded-md border-2 font-medium text-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
            style={{ borderColor: displayColor, color: displayColor }}
          >
            View Details
          </Link>
        )}
        {/* View Details link for house goals */}
        {isHouseGoal && (
          <Link
            to={`/goals/${goal.id}/house`}
            className="flex-1 py-2 px-4 rounded-md border-2 font-medium text-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
            style={{ borderColor: displayColor, color: displayColor }}
          >
            View Details
          </Link>
        )}
      </div>
    </div>
  )
}
