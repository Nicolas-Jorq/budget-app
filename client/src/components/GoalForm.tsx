/**
 * @fileoverview GoalForm component for creating and editing savings goals.
 * This component provides a comprehensive modal form for managing savings goals
 * with support for different goal types including Baby, House, and general goals.
 * It handles specialized metadata fields for different goal types and manages
 * API communication for goal creation, updates, and related configurations.
 */

import { useState } from 'react'
import api from '../services/api'
import { SavingsGoal, GoalType, GOAL_TYPE_INFO, BabyGoalMetadata, HouseGoalMetadata, PropertyType, PROPERTY_TYPE_INFO } from '../types'

/**
 * Props interface for the GoalForm component.
 * @interface GoalFormProps
 */
interface GoalFormProps {
  /** Existing goal to edit, or null when creating a new goal */
  goal: SavingsGoal | null
  /** Callback function to close the modal */
  onClose: () => void
  /** Callback function triggered after successful save operation */
  onSuccess: () => void
}

/**
 * Available goal types for savings goals.
 * Each type has associated metadata and display configuration.
 * @constant {GoalType[]}
 */
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

/**
 * Available property types for house goals.
 * @constant {PropertyType[]}
 */
const propertyTypes: PropertyType[] = ['single_family', 'condo', 'townhouse', 'multi_family', 'apartment', 'land', 'other']

/**
 * A comprehensive modal form component for creating and editing savings goals.
 *
 * Features:
 * - Create and edit goals with name, type, target amount, deadline, and priority
 * - Visual goal type selector with icons
 * - Specialized fields for Baby goals (baby name, pregnancy status, due date)
 * - Specialized fields for House goals (price, location, bedrooms, bathrooms, down payment %)
 * - Optional creation of default milestones for baby goals
 * - Form validation with loading state and error handling
 * - Handles creation of related configurations (house goal config, baby milestones)
 *
 * @param {GoalFormProps} props - The component props
 * @param {SavingsGoal | null} props.goal - Existing goal for editing, null for creation
 * @param {Function} props.onClose - Handler to close the modal
 * @param {Function} props.onSuccess - Handler called after successful save
 * @returns {JSX.Element} A modal dialog containing the goal form
 *
 * @example
 * // Create new goal
 * <GoalForm
 *   goal={null}
 *   onClose={() => setShowForm(false)}
 *   onSuccess={() => { setShowForm(false); refreshGoals(); }}
 * />
 *
 * @example
 * // Edit existing goal
 * <GoalForm
 *   goal={selectedGoal}
 *   onClose={() => setEditingGoal(null)}
 *   onSuccess={() => { setEditingGoal(null); refreshGoals(); }}
 * />
 */
export default function GoalForm({ goal, onClose, onSuccess }: GoalFormProps) {
  // Extract existing metadata if editing a baby or house goal
  const existingBabyMetadata = goal?.type === 'BABY' ? goal.metadata as BabyGoalMetadata | null : null
  const existingHouseMetadata = goal?.type === 'HOUSE' ? goal.metadata as HouseGoalMetadata | null : null

  // Core goal fields - initialize with existing values or defaults
  const [name, setName] = useState(goal?.name ?? '')
  const [type, setType] = useState<GoalType>(goal?.type ?? 'CUSTOM')
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount?.toString() ?? '')
  const [deadline, setDeadline] = useState(
    goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : ''
  )
  const [priority, setPriority] = useState(goal?.priority?.toString() ?? '1')

  // Form state management
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Baby-specific fields - initialized from existing metadata or defaults
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
  // Option to create default milestones (nursery setup, baby gear, etc.) for new baby goals
  const [createDefaultMilestones, setCreateDefaultMilestones] = useState(!goal)

  // House-specific fields - initialized from existing metadata or defaults
  const [targetPrice, setTargetPrice] = useState(existingHouseMetadata?.targetPrice?.toString() ?? '')
  const [targetLocation, setTargetLocation] = useState(existingHouseMetadata?.targetLocation ?? '')
  const [targetBedrooms, setTargetBedrooms] = useState(existingHouseMetadata?.targetBedrooms?.toString() ?? '')
  const [targetBathrooms, setTargetBathrooms] = useState(existingHouseMetadata?.targetBathrooms?.toString() ?? '')
  const [downPaymentPct, setDownPaymentPct] = useState(existingHouseMetadata?.downPaymentPct?.toString() ?? '20')
  const [propertyType, setPropertyType] = useState<PropertyType | ''>(existingHouseMetadata?.propertyType ?? '')

  /**
   * Handles form submission for creating or updating a savings goal.
   * Builds type-specific metadata, makes API calls, and handles related
   * configurations like house goal settings and baby milestones.
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
      // Build type-specific metadata based on goal type
      let metadata: BabyGoalMetadata | HouseGoalMetadata | undefined

      if (type === 'BABY') {
        // Construct baby goal metadata with conditional date fields
        metadata = {
          babyName: babyName || undefined,
          isPregnancy,
          expectedDueDate: isPregnancy && expectedDueDate ? expectedDueDate : undefined,
          actualBirthDate: !isPregnancy && actualBirthDate ? actualBirthDate : undefined,
        }
      } else if (type === 'HOUSE') {
        // Construct house goal metadata with property details
        metadata = {
          targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
          targetLocation: targetLocation || undefined,
          targetBedrooms: targetBedrooms ? parseInt(targetBedrooms, 10) : undefined,
          targetBathrooms: targetBathrooms ? parseFloat(targetBathrooms) : undefined,
          downPaymentPct: downPaymentPct ? parseFloat(downPaymentPct) : 20,
          propertyType: propertyType || undefined,
        }
      }

      // Prepare the main goal data payload
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
        // Update existing goal via PUT request
        await api.put(`/goals/${goal.id}`, data)

        // Update house goal configuration if editing a house goal with price
        if (type === 'HOUSE' && targetPrice) {
          try {
            await api.put(`/goals/${goal.id}/house`, {
              targetPrice: parseFloat(targetPrice),
              targetLocation: targetLocation || null,
              targetBedrooms: targetBedrooms ? parseInt(targetBedrooms, 10) : null,
              targetBathrooms: targetBathrooms ? parseFloat(targetBathrooms) : null,
              downPaymentPct: parseFloat(downPaymentPct) || 20,
              propertyType: propertyType || null,
            })
          } catch {
            // Silently handle - house goal config might not exist for older goals
          }
        }
      } else {
        // Create new goal via POST request
        const response = await api.post('/goals', data)
        createdGoal = response.data

        // Create default milestones for new baby goals if option is selected
        if (type === 'BABY' && createDefaultMilestones && createdGoal?.id) {
          await api.post(`/goals/${createdGoal.id}/milestones/defaults`)
        }

        // Create house goal configuration for new house goals
        if (type === 'HOUSE' && createdGoal?.id && targetPrice) {
          await api.post(`/goals/${createdGoal.id}/house`, {
            targetPrice: parseFloat(targetPrice),
            targetLocation: targetLocation || null,
            targetBedrooms: targetBedrooms ? parseInt(targetBedrooms, 10) : null,
            targetBathrooms: targetBathrooms ? parseFloat(targetBathrooms) : null,
            downPaymentPct: parseFloat(downPaymentPct) || 20,
            propertyType: propertyType || null,
          })
        }
      }

      // Notify parent component of successful operation
      onSuccess()
    } catch (err) {
      // Display error message to user
      setError(err instanceof Error ? err.message : 'Failed to save goal')
    } finally {
      // Always reset loading state
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal header - shows different text for create vs edit mode */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {goal ? 'Edit Savings Goal' : 'Create Savings Goal'}
        </h2>

        {/* Error message display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Goal name input field */}
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

          {/* Goal type visual selector - grid of icons */}
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

          {/* Target amount input field with currency prefix */}
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

          {/* Target date input field (optional) */}
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

          {/* Priority selector dropdown */}
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

          {/* Baby-specific fields - conditionally rendered when goal type is BABY */}
          {type === 'BABY' && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>👶</span> Baby Details
              </h3>

              {/* Baby name input (optional) */}
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

              {/* Pregnancy status toggle buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex gap-2">
                  {/* Expecting option */}
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
                  {/* Already born option */}
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

              {/* Conditional date field based on pregnancy status */}
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

              {/* Default milestones checkbox - only shown when creating new baby goal */}
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

          {/* House-specific fields - conditionally rendered when goal type is HOUSE */}
          {type === 'HOUSE' && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>🏠</span> House Details
              </h3>

              {/* Target home price input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Home Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="450000"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Target location input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Location
                </label>
                <input
                  type="text"
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  placeholder="e.g., Austin, TX or 78701"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Bedrooms and bathrooms inputs in a grid layout */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={targetBedrooms}
                    onChange={(e) => setTargetBedrooms(e.target.value)}
                    placeholder="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={targetBathrooms}
                    onChange={(e) => setTargetBathrooms(e.target.value)}
                    placeholder="2"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Down payment percentage input with helper text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Down Payment %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={downPaymentPct}
                    onChange={(e) => setDownPaymentPct(e.target.value)}
                    placeholder="20"
                    className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <span className="absolute right-3 top-2 text-gray-500 dark:text-gray-400">%</span>
                </div>
                {/* PMI avoidance tip */}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  20% or more avoids PMI (private mortgage insurance)
                </p>
              </div>

              {/* Property type visual selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Property Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {propertyTypes.slice(0, 4).map((pt) => {
                    const info = PROPERTY_TYPE_INFO[pt]
                    return (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setPropertyType(propertyType === pt ? '' : pt)}
                        className={`p-2 rounded-md border-2 transition-all flex flex-col items-center gap-1 ${
                          propertyType === pt
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <span className="text-lg">{info.icon}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate w-full text-center">
                          {info.label.split(' ')[0]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

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
              {isLoading ? 'Saving...' : goal ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
