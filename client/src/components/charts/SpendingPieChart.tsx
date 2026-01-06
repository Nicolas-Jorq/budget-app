import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { SpendingByCategory } from '../../types'

interface SpendingPieChartProps {
  data: SpendingByCategory[]
}

const COLORS = [
  '#0ea5e9', // primary-500
  '#22c55e', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
]

export default function SpendingPieChart({ data }: SpendingPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No spending data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="amount"
          nameKey="category"
          label={({ category, percentage }) => `${category} (${percentage}%)`}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
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
