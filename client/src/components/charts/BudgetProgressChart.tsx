/**
 * @fileoverview Budget Progress Chart Component
 *
 * This component displays a list of budget progress bars, showing how much of each
 * budget has been spent. It provides visual feedback through color-coded progress
 * bars that change from green to yellow to red as spending approaches or exceeds
 * the budget limit.
 *
 * @module components/charts/BudgetProgressChart
 */

import { BudgetProgress } from '../../types'

/**
 * Props for the BudgetProgressChart component.
 *
 * @interface BudgetProgressChartProps
 * @property {BudgetProgress[]} data - Array of budget progress data containing
 *   budget id, name, category, spent amount, limit, and percentage used
 */
interface BudgetProgressChartProps {
  data: BudgetProgress[]
}

/**
 * Determines the progress bar fill color based on budget usage percentage.
 * Uses a traffic light color scheme - visible colors on dark theme.
 *
 * @param {number} percentage - The percentage of budget used (0-100+)
 * @returns {string} Tailwind CSS background color class
 *
 * @example
 * getProgressColor(50)  // Returns green (safe)
 * getProgressColor(75)  // Returns amber (warning)
 * getProgressColor(95)  // Returns red (danger)
 */
function getProgressColor(percentage: number): string {
  if (percentage >= 90) return 'bg-[#ef4444]'  // red-500 - visible
  if (percentage >= 70) return 'bg-[#f59e0b]'  // amber-500 - visible
  return 'bg-[#22c55e]'  // green-500 - visible
}

/**
 * Determines the progress bar background color based on budget usage percentage.
 * Provides a subtle colored background that matches the progress bar fill.
 *
 * @param {number} percentage - The percentage of budget used (0-100+)
 * @returns {string} Tailwind CSS background color class
 */
function getProgressBgColor(percentage: number): string {
  if (percentage >= 90) return 'bg-[#ef4444]/20'
  if (percentage >= 70) return 'bg-[#f59e0b]/20'
  return 'bg-[#22c55e]/20'
}

/**
 * Renders a list of budget progress indicators with visual spending status.
 *
 * Features:
 * - Color-coded progress bars (green < 70%, yellow 70-90%, red > 90%)
 * - Displays budget name, category, and spending vs. limit
 * - Shows percentage used and remaining amount
 * - Visual overflow indicator when budget is exceeded
 * - Responsive to dark mode
 *
 * @param {BudgetProgressChartProps} props - Component props
 * @param {BudgetProgress[]} props.data - Budget progress data array
 * @returns {JSX.Element} A list of budget progress bars or empty state message
 *
 * @example
 * const budgetData = [
 *   { id: '1', name: 'Groceries', category: 'Food', spent: 250, limit: 400, percentage: 62.5 }
 * ];
 * <BudgetProgressChart data={budgetData} />
 */
export default function BudgetProgressChart({ data }: BudgetProgressChartProps) {
  // Handle empty data state
  if (data.length === 0) {
    return (
      <div className="text-center text-content-tertiary py-8">
        No budgets created yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.map((budget) => {
        // Calculate remaining budget (can be negative if over budget)
        const remaining = budget.limit - budget.spent
        const isOverBudget = remaining < 0

        return (
          <div key={budget.id} className="space-y-2">
            {/* Budget header with name, category, and amounts */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-content-primary">{budget.name}</span>
                <span className="ml-2 text-xs text-content-tertiary bg-theme-elevated px-2 py-0.5 rounded-full">
                  {budget.category}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${isOverBudget ? 'text-[#b91c1c]' : 'text-content-secondary'}`}>
                  ${budget.spent.toLocaleString()} / ${budget.limit.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Progress bar with overflow indicator */}
            <div className="relative">
              <div className={`w-full h-3 rounded-full ${getProgressBgColor(budget.percentage)}`}>
                <div
                  className={`h-3 rounded-full transition-all ${getProgressColor(budget.percentage)}`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                />
              </div>
              {/* Overflow indicator: shows extra red bar when over budget */}
              {isOverBudget && (
                <div
                  className="absolute top-0 h-3 bg-red-600 rounded-r-full opacity-50"
                  style={{
                    left: '100%',
                    // Cap overflow display at 20% extra to prevent extreme visual overflow
                    width: `${Math.min(((budget.spent - budget.limit) / budget.limit) * 100, 20)}%`,
                  }}
                />
              )}
            </div>

            {/* Footer with percentage and remaining/over amount */}
            <div className="flex justify-between text-xs text-content-tertiary">
              <span>{budget.percentage}% used</span>
              <span className={isOverBudget ? 'text-[#b91c1c] font-medium' : ''}>
                {isOverBudget
                  ? `$${Math.abs(remaining).toLocaleString()} over`
                  : `$${remaining.toLocaleString()} remaining`}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
