import { useState } from 'react'
import api from '../../services/api'
import { BabyMilestone, MilestoneCategory, MILESTONE_CATEGORY_INFO } from '../../types'

interface BabyMilestoneFormProps {
  goalId: string
  milestone: BabyMilestone | null
  onClose: () => void
  onSuccess: () => void
}

const milestoneCategories: MilestoneCategory[] = [
  'PRE_BIRTH',
  'NURSERY',
  'GEAR',
  'FIRST_YEAR',
  'CHILDCARE',
  'HEALTHCARE',
  'EDUCATION',
]

export default function BabyMilestoneForm({
  goalId,
  milestone,
  onClose,
  onSuccess,
}: BabyMilestoneFormProps) {
  const [name, setName] = useState(milestone?.name ?? '')
  const [category, setCategory] = useState<MilestoneCategory>(milestone?.category ?? 'GEAR')
  const [targetAmount, setTargetAmount] = useState(milestone?.targetAmount?.toString() ?? '')
  const [dueMonth, setDueMonth] = useState(milestone?.dueMonth?.toString() ?? '0')
  const [notes, setNotes] = useState(milestone?.notes ?? '')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Auto-fill defaults when category changes
  const handleCategoryChange = (newCategory: MilestoneCategory) => {
    setCategory(newCategory)
    if (!milestone) {
      const info = MILESTONE_CATEGORY_INFO[newCategory]
      if (!name) setName(info.label)
      if (!targetAmount) setTargetAmount(info.defaultAmount.toString())
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = {
        name,
        category,
        targetAmount: parseFloat(targetAmount),
        dueMonth: dueMonth ? parseInt(dueMonth, 10) : null,
        notes: notes || null,
      }

      if (milestone) {
        await api.put(`/goals/${goalId}/milestones/${milestone.id}`, data)
      } else {
        await api.post(`/goals/${goalId}/milestones`, data)
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save milestone')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {milestone ? 'Edit Milestone' : 'Add Milestone'}
        </h2>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {milestoneCategories.map((cat) => {
                const info = MILESTONE_CATEGORY_INFO[cat]
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`p-2 rounded-md border-2 transition-all flex flex-col items-center gap-1 ${
                      category === cat
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <span className="text-xl">{info.icon}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate w-full text-center">
                      {info.label.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Milestone Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Nursery Setup"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Due Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Time (months from birth)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={dueMonth}
                onChange={(e) => setDueMonth(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {parseInt(dueMonth) < 0
                  ? `${Math.abs(parseInt(dueMonth))} months before birth`
                  : parseInt(dueMonth) === 0
                  ? 'at birth'
                  : `${dueMonth} months after birth`}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use negative numbers for pre-birth expenses (e.g., -3 for 3 months before)
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional details..."
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
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : milestone ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
