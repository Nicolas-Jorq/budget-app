import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MonthlyComparison } from '../../types'

interface IncomeExpenseChartProps {
  data: MonthlyComparison[]
}

export default function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No data for the last 6 months
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
        />
        <Tooltip
          formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend wrapperStyle={{ paddingTop: '10px' }} />
        <Bar
          dataKey="income"
          name="Income"
          fill="#22c55e"
          radius={[4, 4, 0, 0]}
        />
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
