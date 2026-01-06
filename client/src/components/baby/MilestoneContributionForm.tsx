import { useState } from 'react'
import api from '../../services/api'
import { BabyMilestone, MILESTONE_CATEGORY_INFO } from '../../types'

interface MilestoneContributionFormProps {
  goalId: string
  milestone: BabyMilestone
  onClose: () => void
  onSuccess: () => void
}

export default function MilestoneContributionForm({
  goalId,
  milestone,
  onClose,
  onSuccess,
}: MilestoneContributionFormProps) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const categoryInfo = MILESTONE_CATEGORY_INFO[milestone.category]
  const remaining = Math.max(milestone.targetAmount - milestone.currentAmount, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await api.post(`/goals/${goalId}/milestones/${milestone.id}/contribute`, {
        amount: parseFloat(amount),
        note: note || undefined,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contribution')
    } finally {
      setIsLoading(false)
    }
  }

  const quickAmounts = [50, 100, 250, 500]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{categoryInfo.icon}</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Contribute to {milestone.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ${remaining.toLocaleString()} remaining to goal
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">
              ${milestone.currentAmount.toLocaleString()} saved
            </span>
            <span className="text-gray-900 dark:text-white font-medium">
              ${milestone.targetAmount.toLocaleString()} target
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${Math.min((milestone.currentAmount / milestone.targetAmount) * 100, 100)}%`,
                backgroundColor: categoryInfo.color,
              }}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick amount buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Add
            </label>
            <div className="flex gap-2 flex-wrap">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount.toString())}
                  className={`px-3 py-1.5 rounded-md border transition-colors ${
                    amount === quickAmount.toString()
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                  }`}
                >
                  ${quickAmount}
                </button>
              ))}
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(remaining.toString())}
                  className={`px-3 py-1.5 rounded-md border transition-colors ${
                    amount === remaining.toString()
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                  }`}
                >
                  Complete (${remaining.toLocaleString()})
                </button>
              )}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Monthly savings"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Actions */}
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
              disabled={isLoading || !amount}
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
