/**
 * @fileoverview Spending Trend Area Chart Component
 *
 * This component visualizes daily spending patterns throughout the current month
 * using a gradient-filled area chart. It helps users identify spending trends
 * and patterns over time.
 *
 * @module components/charts/SpendingTrendChart
 */

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DailySpending } from '../../types'

/**
 * Props for the SpendingTrendChart component.
 *
 * @interface SpendingTrendChartProps
 * @property {DailySpending[]} data - Array of daily spending data containing
 *   date and amount spent on each day
 */
interface SpendingTrendChartProps {
  data: DailySpending[]
}

/**
 * Renders an area chart showing daily spending trends for the current month.
 *
 * Features:
 * - Smooth area chart with gradient fill for visual appeal
 * - X-axis showing day of month for easy date identification
 * - Y-axis with dollar-formatted values
 * - Interactive tooltip showing exact amounts for each day
 * - Horizontal grid lines for better value estimation
 * - Responsive sizing that adapts to container width
 *
 * @param {SpendingTrendChartProps} props - Component props
 * @param {DailySpending[]} props.data - Daily spending data array
 * @returns {JSX.Element} A responsive area chart or empty state message
 *
 * @example
 * const dailyData = [
 *   { date: '2024-01-01', amount: 45.50 },
 *   { date: '2024-01-02', amount: 120.00 },
 *   { date: '2024-01-03', amount: 30.25 }
 * ];
 * <SpendingTrendChart data={dailyData} />
 */
export default function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  // Handle empty data state
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-content-tertiary">
        No spending data this month
      </div>
    )
  }

  // Transform data to include day number for x-axis display
  // This makes the chart more readable by showing just the day (1, 2, 3, etc.)
  const formattedData = data.map((d) => ({
    ...d,
    day: new Date(d.date).getDate(),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {/* Gradient definition for the area fill - visible blue on dark theme */}
        <defs>
          <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines only (vertical=false) for cleaner look */}
        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d37" vertical={false} />

        {/* X-axis showing day of month */}
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: '#a3a3a3' }}
          tickLine={false}
          axisLine={{ stroke: '#2d2d37' }}
          interval="preserveStartEnd"
        />

        {/* Y-axis with dollar formatting */}
        <YAxis
          tick={{ fontSize: 11, fill: '#a3a3a3' }}
          tickLine={false}
          axisLine={{ stroke: '#2d2d37' }}
          tickFormatter={(value) => `$${value}`}
          width={50}
        />

        {/* Tooltip with formatted amount and day label - dark theme */}
        <Tooltip
          formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spent']}
          labelFormatter={(label) => `Day ${label}`}
          contentStyle={{
            backgroundColor: '#1c1c22',
            border: '1px solid #3f3f46',
            borderRadius: '8px',
            color: '#f5f5f5',
          }}
          labelStyle={{ color: '#a3a3a3' }}
        />

        {/* Area chart with smooth curve and gradient fill - visible blue */}
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorSpending)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
