import { useState } from 'react'
import api from '../services/api'
import { SavingsGoal, GoalType, GOAL_TYPE_INFO, BabyGoalMetadata } from '../types'

interface GoalFormProps {
  goal: SavingsGoal | null
  onClose: () => void
  onSuccess: () => void
}

const goalTypes: GoalType[] = [
  'EMERGENCY_FUND',
  'BABY',
  'HOUSE',
  'VEHICLE',
  'VACATION',
  'EDUCATION',
  'RETIREMENT',
  'CUSTOM',
]

export default function GoalForm({ goal, onClose, onSuccess }: GoalFormProps) {
  // Extract baby metadata if editing a baby goal
  const existingBabyMetadata = goal?.type === 'BABY' ? goal.metadata as BabyGoalMetadata | null : null

  const [name, setName] = useState(goal?.name ?? '')
  const [type, setType] = useState<GoalType>(goal?.type ?? 'CUSTOM')
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount?.toString() ?? '')
  const [deadline, setDeadline] = useState(
    goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : ''
  )
  const [priority, setPriority] = useState(goal?.priority?.toString() ?? '1')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Baby-specific fields
  const [babyName, setBabyName] = useState(existingBabyMetadata?.babyName ?? '')
  const [isPregnancy, setIsPregnancy] = useState(existingBabyMetadata?.isPregnancy ?? true)
  const [expectedDueDate, setExpectedDueDate] = useState(
    existingBabyMetadata?.expectedDueDate
      ? new Date(existingBabyMetadata.expectedDueDate).toISOString().split('T')[0]
      : ''
  )
  const [actualBirthDate, setActualBirthDate] = useState(
    existingBabyMetadata?.actualBirthDate
      ? new Date(existingBabyMetadata.actualBirthDate).toISOString().split('T')[0]
      : ''
  )
  const [createDefaultMilestones, setCreateDefaultMilestones] = useState(!goal)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Build baby metadata if type is BABY
      let metadata: BabyGoalMetadata | undefined
      if (type === 'BABY') {
        metadata = {
          babyName: babyName || undefined,
          isPregnancy,
          expectedDueDate: isPregnancy && expectedDueDate ? expectedDueDate : undefined,
          actualBirthDate: !isPregnancy && actualBirthDate ? actualBirthDate : undefined,
        }
      }

      const data = {
        name,
        type,
        targetAmount: parseFloat(targetAmount),
        deadline: deadline || null,
        priority: parseInt(priority, 10),
        metadata,
      }

      let createdGoal
      if (goal) {
        await api.put(`/goals/${goal.id}`, data)
      } else {
        const response = await api.post('/goals', data)
        createdGoal = response.data

        // Create default milestones for new baby goals
        if (type === 'BABY' && createDefaultMilestones && createdGoal?.id) {
          await api.post(`/goals/${createdGoal.id}/milestones/defaults`)
        }
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {goal ? 'Edit Savings Goal' : 'Create Savings Goal'}
        </h2>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Goal Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Emergency Fund"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Goal Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {goalTypes.map((t) => {
                const info = GOAL_TYPE_INFO[t]
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`p-2 rounded-md border-2 transition-all flex flex-col items-center gap-1 ${
                      type === t
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Date (optional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="1">High Priority</option>
              <option value="2">Medium Priority</option>
              <option value="3">Low Priority</option>
            </select>
          </div>

          {/* Baby-specific fields */}
          {type === 'BABY' && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>👶</span> Baby Details
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Baby's Name (optional)
                </label>
                <input
                  type="text"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  placeholder="e.g., Emma"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPregnancy(true)}
                    className={`flex-1 py-2 px-3 rounded-md border-2 transition-all flex items-center justify-center gap-2 ${
                      isPregnancy
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <span>🤰</span> Expecting
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPregnancy(false)}
                    className={`flex-1 py-2 px-3 rounded-md border-2 transition-all flex items-center justify-center gap-2 ${
                      !isPregnancy
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <span>👶</span> Already Born
                  </button>
                </div>
              </div>

              {isPregnancy ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expected Due Date
                  </label>
                  <input
                    type="date"
                    value={expectedDueDate}
                    onChange={(e) => setExpectedDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    value={actualBirthDate}
                    onChange={(e) => setActualBirthDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}

              {!goal && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createDefaultMilestones"
                    checked={createDefaultMilestones}
                    onChange={(e) => setCreateDefaultMilestones(e.target.checked)}
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                  />
                  <label
                    htmlFor="createDefaultMilestones"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    Create default milestones (nursery, gear, etc.)
                  </label>
                </div>
              )}
            </div>
          )}

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
              {isLoading ? 'Saving...' : goal ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
