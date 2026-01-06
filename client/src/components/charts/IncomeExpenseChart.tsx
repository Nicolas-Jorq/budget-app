/**
 * @fileoverview Income vs Expense Bar Chart Component
 *
 * This component renders a grouped bar chart comparing income and expenses
 * over multiple months. It provides a visual representation of cash flow
 * trends, helping users understand their financial patterns over time.
 *
 * @module components/charts/IncomeExpenseChart
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MonthlyComparison } from '../../types'

/**
 * Props for the IncomeExpenseChart component.
 *
 * @interface IncomeExpenseChartProps
 * @property {MonthlyComparison[]} data - Array of monthly data containing
 *   month label, income amount, and expense amount
 */
interface IncomeExpenseChartProps {
  data: MonthlyComparison[]
}

/**
 * Renders a grouped bar chart comparing monthly income and expenses.
 *
 * Features:
 * - Side-by-side bars for income (green) and expenses (red)
 * - Formatted Y-axis with abbreviated values (e.g., "5k" for 5000)
 * - Interactive tooltip showing exact dollar amounts on hover
 * - Legend for identifying income vs expense bars
 * - Responsive sizing that adapts to container width
 *
 * @param {IncomeExpenseChartProps} props - Component props
 * @param {MonthlyComparison[]} props.data - Monthly comparison data array
 * @returns {JSX.Element} A responsive bar chart or empty state message
 *
 * @example
 * const monthlyData = [
 *   { month: 'Jan', income: 5000, expenses: 3500 },
 *   { month: 'Feb', income: 5200, expenses: 4000 },
 *   { month: 'Mar', income: 4800, expenses: 3200 }
 * ];
 * <IncomeExpenseChart data={monthlyData} />
 */
export default function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  // Handle empty data state with informative message
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No data for the last 6 months
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {/* Grid lines for better readability */}
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

        {/* X-axis showing month labels */}
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />

        {/* Y-axis with abbreviated dollar formatting (e.g., $5k) */}
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
        />

        {/* Tooltip with full dollar amount formatting */}
        <Tooltip
          formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />

        <Legend wrapperStyle={{ paddingTop: '10px' }} />

        {/* Income bar (green) */}
        <Bar
          dataKey="income"
          name="Income"
          fill="#22c55e"
          radius={[4, 4, 0, 0]}
        />

        {/* Expenses bar (red) */}
        <Bar
          dataKey="expenses"
          name="Expenses"
          fill="#ef4444"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
