import { SavingsGoal, GOAL_TYPE_INFO } from '../types'

interface GoalCardProps {
  goal: SavingsGoal
  onEdit: () => void
  onDelete: () => void
  onContribute: () => void
}

export default function GoalCard({ goal, onEdit, onDelete, onContribute }: GoalCardProps) {
  const currentAmount = Number(goal.currentAmount)
  const targetAmount = Number(goal.targetAmount)
  const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
  const remaining = targetAmount - currentAmount

  const typeInfo = GOAL_TYPE_INFO[goal.type]
  const displayIcon = goal.icon || typeInfo.icon
  const displayColor = goal.color || typeInfo.color

  const daysRemaining = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
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

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">
            ${currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            ${targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: displayColor,
            }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm font-medium" style={{ color: displayColor }}>
            {percentage.toFixed(1)}% complete
          </span>
          {goal.isCompleted ? (
            <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Completed!
            </span>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })} to go
            </span>
          )}
        </div>
      </div>

      {/* Deadline */}
      {goal.deadline && (
        <div className="mb-4 text-sm">
          {daysRemaining !== null && daysRemaining > 0 ? (
            <span className="text-gray-500 dark:text-gray-400">
              {daysRemaining} days remaining
            </span>
          ) : daysRemaining !== null && daysRemaining <= 0 ? (
            <span className="text-red-500 dark:text-red-400">
              {daysRemaining === 0 ? 'Due today' : `${Math.abs(daysRemaining)} days overdue`}
            </span>
          ) : null}
        </div>
      )}

      {/* Contribute Button */}
      {!goal.isCompleted && (
        <button
          onClick={onContribute}
          className="w-full py-2 px-4 rounded-md text-white font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: displayColor }}
        >
          + Add Contribution
        </button>
      )}
    </div>
  )
}
