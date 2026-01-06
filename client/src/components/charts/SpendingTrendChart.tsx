import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DailySpending } from '../../types'

interface SpendingTrendChartProps {
  data: DailySpending[]
}

export default function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500">
        No spending data this month
      </div>
    )
  }

  // Format data for display
  const formattedData = data.map((d) => ({
    ...d,
    day: new Date(d.date).getDate(),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={(value) => `$${value}`}
          width={50}
        />
        <Tooltip
          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spent']}
          labelFormatter={(label) => `Day ${label}`}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#0ea5e9"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorSpending)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
