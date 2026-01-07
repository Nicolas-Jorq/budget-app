/**
 * @fileoverview Weight Trend Chart Component
 *
 * Professional weight tracking visualization with:
 * - Dynamic Y-axis bounds based on actual data range
 * - Evenly spaced X-axis month labels
 * - Color-coded trend indicators
 * - Moving average overlay
 *
 * @module components/charts/WeightTrendChart
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import {
  CHART_COLORS,
  CHART_AXIS_COLORS,
  CHART_TOOLTIP_STYLE,
  getWeightTrendColor,
} from '../../utils/chartColors'

// ============================================================================
// Types
// ============================================================================

interface WeightDataPoint {
  date: string
  weight: number
  movingAverage: number | null
}

interface WeightStats {
  startWeight: number | null
  currentWeight: number | null
  change: number | null
  changePercent: number | null
  minWeight: number | null
  maxWeight: number | null
  avgWeight: number | null
}

interface WeightTrendChartProps {
  data: WeightDataPoint[]
  stats: WeightStats
  unit?: string
  height?: number
}

interface AxisConfig {
  domain: [number, number]
  ticks: number[]
}

// ============================================================================
// Axis Configuration Utilities
// ============================================================================

/**
 * Calculate Y-axis configuration with tight bounds around actual data.
 * Uses increments of 2 for weight values with minimal padding.
 */
function calculateYAxisConfig(values: number[]): AxisConfig {
  if (values.length === 0) {
    return { domain: [150, 200], ticks: [150, 160, 170, 180, 190, 200] }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min

  // Use step of 2 for tight spacing
  const step = 2

  // Tight bounds: round to nearest step with just 1 step padding
  const domainMin = Math.floor(min / step) * step - step
  const domainMax = Math.ceil(max / step) * step + step

  // Generate ticks
  const ticks: number[] = []
  for (let tick = domainMin; tick <= domainMax; tick += step) {
    ticks.push(tick)
  }

  // If range is large (>16 lbs) and too many ticks, use step of 4
  if (ticks.length > 10 || range > 16) {
    const largerStep = 4
    const adjustedMin = Math.floor(min / largerStep) * largerStep - largerStep
    const adjustedMax = Math.ceil(max / largerStep) * largerStep + largerStep

    ticks.length = 0
    for (let tick = adjustedMin; tick <= adjustedMax; tick += largerStep) {
      ticks.push(tick)
    }

    return { domain: [adjustedMin, adjustedMax], ticks }
  }

  return { domain: [domainMin, domainMax], ticks }
}

/**
 * Calculate evenly spaced X-axis tick indices.
 * Distributes ticks uniformly across the data regardless of date density.
 */
function calculateEvenlySpacedTicks(dataLength: number, targetTicks = 6): number[] {
  if (dataLength === 0) return []
  if (dataLength <= targetTicks) {
    return Array.from({ length: dataLength }, (_, i) => i)
  }

  const ticks: number[] = []
  const step = (dataLength - 1) / (targetTicks - 1)

  for (let i = 0; i < targetTicks; i++) {
    ticks.push(Math.round(i * step))
  }

  return ticks
}

/**
 * Determine optimal number of X-axis ticks based on data length.
 */
function getOptimalTickCount(dataLength: number): number {
  if (dataLength <= 7) return dataLength
  if (dataLength <= 30) return 5
  if (dataLength <= 90) return 6
  if (dataLength <= 180) return 6
  return 7
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format date for tooltip display.
 */
function formatTooltipDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Custom tooltip showing only weight value.
 */
function WeightTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
  unit: string
}) {
  if (!active || !payload?.length) return null

  const weightEntry = payload.find(entry => entry.dataKey === 'weight')
  if (!weightEntry) return null

  return (
    <div
      className="px-3 py-2 shadow-lg"
      style={{
        backgroundColor: CHART_TOOLTIP_STYLE.backgroundColor,
        border: `1px solid ${CHART_TOOLTIP_STYLE.borderColor}`,
        borderRadius: CHART_TOOLTIP_STYLE.borderRadius,
      }}
    >
      <p className="text-xs mb-1" style={{ color: CHART_TOOLTIP_STYLE.labelColor }}>
        {label ? formatTooltipDate(label) : ''}
      </p>
      <p className="text-sm font-semibold" style={{ color: weightEntry.color }}>
        {weightEntry.value?.toFixed(1)} {unit}
      </p>
    </div>
  )
}

/**
 * Custom X-axis tick component showing month and year.
 */
function XAxisTick({
  x,
  y,
  payload,
}: {
  x: number
  y: number
  payload: { value: string }
}) {
  const date = new Date(payload.value)
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const year = date.getFullYear().toString()

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={14}
        textAnchor="middle"
        fill={CHART_AXIS_COLORS.tick}
        fontSize={11}
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {month}
      </text>
      <text
        x={0}
        y={0}
        dy={28}
        textAnchor="middle"
        fill={CHART_AXIS_COLORS.label}
        fontSize={10}
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {year}
      </text>
    </g>
  )
}

/**
 * Trend indicator showing weight change summary.
 */
function TrendIndicator({
  change,
  changePercent,
  unit,
}: {
  change: number
  changePercent: number | null
  unit: string
}) {
  const isLosing = change < -0.1
  const isGaining = change > 0.1

  const bgClass = isLosing
    ? 'bg-[#4ade80]/10'
    : isGaining
      ? 'bg-[#f87171]/10'
      : 'bg-[#a1a1aa]/10'

  const textColor = isLosing
    ? CHART_COLORS.success
    : isGaining
      ? CHART_COLORS.danger
      : CHART_COLORS.neutral

  const message = isLosing
    ? `Down ${Math.abs(change).toFixed(1)} ${unit} (${Math.abs(changePercent || 0).toFixed(1)}%)`
    : isGaining
      ? `Up ${change.toFixed(1)} ${unit} (+${(changePercent || 0).toFixed(1)}%)`
      : 'Weight stable'

  return (
    <div className={`text-center p-3 rounded-lg ${bgClass}`}>
      <p className="text-sm font-medium" style={{ color: textColor }}>
        {message} from starting weight
      </p>
    </div>
  )
}

/**
 * Statistics card component.
 */
function StatCard({
  label,
  value,
  unit,
  showSign = false,
  colorCode = false,
  highlight = false,
  positive = false,
}: {
  label: string
  value: number | null
  unit: string
  showSign?: boolean
  colorCode?: boolean
  highlight?: boolean
  positive?: boolean
}) {
  if (value === null) return null

  const isNegative = value < 0
  const displayValue = showSign
    ? `${isNegative ? '' : '+'}${value.toFixed(1)}`
    : value.toFixed(1)

  let valueStyle: React.CSSProperties = {}
  if (colorCode) {
    valueStyle = {
      color: isNegative
        ? CHART_COLORS.success
        : value > 0
          ? CHART_COLORS.danger
          : undefined,
    }
  } else if (positive) {
    valueStyle = { color: CHART_COLORS.success }
  }

  return (
    <div
      className={`p-3 rounded-lg ${
        highlight
          ? 'bg-primary-500/10 border border-primary-500/20'
          : 'bg-theme-elevated border border-border-subtle'
      }`}
    >
      <p className="text-xs text-content-tertiary uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-content-primary" style={valueStyle}>
        {displayValue}
        <span className="text-sm font-normal text-content-secondary ml-1">{unit}</span>
      </p>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Weight trend chart with moving average overlay.
 *
 * Features:
 * - Dynamic Y-axis bounds based on actual weight range for the time period
 * - Evenly spaced X-axis labels showing month and year
 * - 7-day moving average as dashed overlay line
 * - Color-coded based on overall trend direction
 * - Interactive tooltip showing weight on hover
 */
export default function WeightTrendChart({
  data,
  stats,
  unit = 'lbs',
  height = 400,
}: WeightTrendChartProps) {
  // Empty state
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-content-tertiary bg-theme-surface rounded-lg border border-border-subtle"
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-lg">No weight data available</p>
          <p className="text-sm mt-1">Start logging your weight to see trends</p>
        </div>
      </div>
    )
  }

  // Calculate chart configuration
  const trendColor = getWeightTrendColor(stats.change)
  const movingAvgColor = CHART_COLORS.secondary

  // Y-axis: tight bounds based on actual data range
  const allWeightValues = [
    ...data.map(d => d.weight),
    ...data.map(d => d.movingAverage).filter((v): v is number => v !== null),
  ]
  const yAxisConfig = calculateYAxisConfig(allWeightValues)

  // X-axis: evenly spaced ticks
  const tickCount = getOptimalTickCount(data.length)
  const tickIndices = calculateEvenlySpacedTicks(data.length, tickCount)
  const xAxisTicks = tickIndices.map(i => data[i]?.date).filter(Boolean)

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Current" value={stats.currentWeight} unit={unit} highlight />
        <StatCard label="Change" value={stats.change} unit={unit} showSign colorCode />
        <StatCard label="Lowest" value={stats.minWeight} unit={unit} positive />
        <StatCard label="Average" value={stats.avgWeight} unit={unit} />
      </div>

      {/* Chart */}
      <div className="bg-theme-surface rounded-lg border border-border-subtle p-4">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={CHART_AXIS_COLORS.grid}
              vertical={false}
            />

            <XAxis
              dataKey="date"
              ticks={xAxisTicks}
              tick={XAxisTick}
              tickLine={false}
              axisLine={{ stroke: CHART_AXIS_COLORS.axis, strokeWidth: 1 }}
              height={50}
            />

            <YAxis
              domain={yAxisConfig.domain}
              ticks={yAxisConfig.ticks}
              tick={{
                fontSize: 11,
                fill: CHART_AXIS_COLORS.tick,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
              tickLine={{ stroke: CHART_AXIS_COLORS.grid, strokeWidth: 1 }}
              axisLine={{ stroke: CHART_AXIS_COLORS.axis, strokeWidth: 1 }}
              tickFormatter={(value) => value.toFixed(0)}
              width={45}
              tickMargin={4}
            />

            <Tooltip content={<WeightTooltip unit={unit} />} />

            <Legend
              verticalAlign="top"
              height={28}
              iconType="line"
              iconSize={12}
              formatter={(value) => (
                <span style={{ color: CHART_AXIS_COLORS.tick, fontSize: 12 }}>
                  {value === 'weight' ? 'Weight' : '7-day Avg'}
                </span>
              )}
            />

            {/* Reference line for starting weight */}
            {stats.startWeight && (
              <ReferenceLine
                y={stats.startWeight}
                stroke={CHART_AXIS_COLORS.label}
                strokeDasharray="5 5"
                strokeWidth={1}
              />
            )}

            {/* Moving average line - solid */}
            <Line
              type="monotone"
              dataKey="movingAverage"
              stroke={movingAvgColor}
              strokeWidth={2.5}
              dot={false}
              connectNulls
              name="movingAverage"
            />

            {/* Weight line - dashed */}
            <Line
              type="monotone"
              dataKey="weight"
              stroke={trendColor}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: trendColor, strokeWidth: 0, r: 3 }}
              activeDot={{ fill: trendColor, strokeWidth: 2, stroke: '#fff', r: 5 }}
              name="weight"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trend indicator */}
      {stats.change !== null && (
        <TrendIndicator change={stats.change} changePercent={stats.changePercent} unit={unit} />
      )}
    </div>
  )
}
