/**
 * @fileoverview Spending Pie Chart Component
 *
 * This component renders an interactive donut chart visualizing spending distribution
 * across different categories. It uses Recharts library and displays each category's
 * amount and percentage of total spending.
 *
 * @module components/charts/SpendingPieChart
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { SpendingByCategory } from '../../types'

/**
 * Props for the SpendingPieChart component.
 *
 * @interface SpendingPieChartProps
 * @property {SpendingByCategory[]} data - Array of spending data by category, each containing
 *   category name, amount spent, and percentage of total
 */
interface SpendingPieChartProps {
  data: SpendingByCategory[]
}

/**
 * Color palette for pie chart segments.
 * Muted but visible colors for dark theme - mid-saturation for 3:1 contrast.
 */
const COLORS = [
  '#3b82f6', // blue-500 - visible on dark
  '#22c55e', // green-500 - visible on dark
  '#f59e0b', // amber-500 - visible on dark
  '#ef4444', // red-500 - visible on dark
  '#8b5cf6', // violet-500 - visible on dark
  '#ec4899', // pink-500 - visible on dark
  '#14b8a6', // teal-500 - visible on dark
  '#f97316', // orange-500 - visible on dark
]

/**
 * Renders a donut-style pie chart showing spending distribution by category.
 *
 * The chart displays:
 * - Each category as a colored segment proportional to its spending amount
 * - Labels showing category name and percentage for each segment
 * - Tooltip with formatted dollar amounts on hover
 * - Legend at the bottom for category identification
 *
 * @param {SpendingPieChartProps} props - Component props
 * @param {SpendingByCategory[]} props.data - Spending data array
 * @returns {JSX.Element} A responsive pie chart or empty state message
 *
 * @example
 * const spendingData = [
 *   { category: 'Food', amount: 500, percentage: 50 },
 *   { category: 'Transport', amount: 300, percentage: 30 },
 *   { category: 'Entertainment', amount: 200, percentage: 20 }
 * ];
 * <SpendingPieChart data={spendingData} />
 */
export default function SpendingPieChart({ data }: SpendingPieChartProps) {
  // Handle empty data state with a user-friendly message
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-content-tertiary">
        No spending data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data as any}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="amount"
          nameKey="category"
          label={({ payload }: any) => `${payload.category} (${payload.percentage}%)`}
          labelLine={false}
        >
          {/* Map each data entry to a colored cell, cycling through COLORS array */}
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']}
          contentStyle={{
            backgroundColor: '#1c1c22',
            border: '1px solid #3f3f46',
            borderRadius: '8px',
            color: '#f5f5f5',
          }}
        />
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{ paddingTop: '20px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
