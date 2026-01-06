import { BudgetProgress } from '../../types'

interface BudgetProgressChartProps {
  data: BudgetProgress[]
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 70) return 'bg-yellow-500'
  return 'bg-green-500'
}

function getProgressBgColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-100'
  if (percentage >= 70) return 'bg-yellow-100'
  return 'bg-green-100'
}

export default function BudgetProgressChart({ data }: BudgetProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No budgets created yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.map((budget) => {
        const remaining = budget.limit - budget.spent
        const isOverBudget = remaining < 0

        return (
          <div key={budget.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">{budget.name}</span>
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {budget.category}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-600'}`}>
                  ${budget.spent.toLocaleString()} / ${budget.limit.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="relative">
              <div className={`w-full h-3 rounded-full ${getProgressBgColor(budget.percentage)}`}>
                <div
                  className={`h-3 rounded-full transition-all ${getProgressColor(budget.percentage)}`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                />
              </div>
              {isOverBudget && (
                <div
                  className="absolute top-0 h-3 bg-red-600 rounded-r-full opacity-50"
                  style={{
                    left: '100%',
                    width: `${Math.min(((budget.spent - budget.limit) / budget.limit) * 100, 20)}%`,
                  }}
                />
              )}
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>{budget.percentage}% used</span>
              <span className={isOverBudget ? 'text-red-600 font-medium' : ''}>
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
