/**
 * @fileoverview Centralized Chart Color Constants
 *
 * Defines consistent colors for all chart components that align with
 * the application's dark theme. These colors are optimized for visibility
 * on dark backgrounds while maintaining a cohesive visual style.
 *
 * Theme Reference (Batman-inspired dark theme):
 * - Background layers: near black (#08080a) to charcoal (#1c1c22)
 * - Primary: dark steel grey
 * - Semantic: muted green/amber/red/blue
 *
 * @module utils/chartColors
 */

/**
 * Primary chart colors for data visualization
 * These are the main colors used for chart lines, areas, and bars
 */
export const CHART_COLORS = {
  // Primary data color - muted blue, good visibility on dark
  primary: '#60a5fa', // blue-400 - slightly brighter for dark theme

  // Secondary data color - muted purple for secondary series
  secondary: '#a78bfa', // violet-400

  // Tertiary data color - muted cyan
  tertiary: '#22d3ee', // cyan-400

  // Semantic colors aligned with theme
  success: '#4ade80', // green-400 - weight loss, income, positive
  warning: '#fbbf24', // amber-400 - alerts, caution
  danger: '#f87171', // red-400 - weight gain, expenses, errors
  info: '#60a5fa', // blue-400 - informational

  // Neutral for stable/unchanged values
  neutral: '#a1a1aa', // zinc-400
} as const

/**
 * Chart axis and grid colors for dark theme
 */
export const CHART_AXIS_COLORS = {
  // Grid lines - subtle visibility
  grid: '#2d2d37',

  // Axis lines
  axis: '#3f3f46',

  // Tick text color
  tick: '#a3a3a3',

  // Axis label color
  label: '#71717a',
} as const

/**
 * Tooltip styling for dark theme
 */
export const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#1c1c22',
  borderColor: '#3f3f46',
  borderRadius: '8px',
  textColor: '#f5f5f5',
  labelColor: '#a3a3a3',
} as const

/**
 * Get trend color based on value change
 * Used for weight tracking, budget variance, etc.
 *
 * @param change - The numeric change value
 * @param invertColors - If true, positive is bad (e.g., weight gain)
 * @returns The appropriate color for the trend
 */
export function getTrendColor(
  change: number | null,
  invertColors = false
): string {
  if (change === null || change === 0) {
    return CHART_COLORS.neutral
  }

  const isPositive = change > 0
  const isGood = invertColors ? !isPositive : isPositive

  return isGood ? CHART_COLORS.success : CHART_COLORS.danger
}

/**
 * Get weight-specific trend color
 * For weight tracking: loss is good (green), gain is bad (red)
 *
 * @param change - Weight change in the selected unit
 * @returns Color string for the trend
 */
export function getWeightTrendColor(change: number | null): string {
  if (change === null || Math.abs(change) < 0.1) {
    return CHART_COLORS.neutral
  }
  // Weight loss (negative change) is good
  return change < 0 ? CHART_COLORS.success : CHART_COLORS.danger
}

/**
 * Gradient definitions for area charts
 * Returns SVG gradient stop configurations
 */
export const CHART_GRADIENTS = {
  primary: {
    id: 'gradientPrimary',
    stops: [
      { offset: '5%', color: CHART_COLORS.primary, opacity: 0.4 },
      { offset: '95%', color: CHART_COLORS.primary, opacity: 0 },
    ],
  },
  success: {
    id: 'gradientSuccess',
    stops: [
      { offset: '5%', color: CHART_COLORS.success, opacity: 0.3 },
      { offset: '95%', color: CHART_COLORS.success, opacity: 0 },
    ],
  },
  danger: {
    id: 'gradientDanger',
    stops: [
      { offset: '5%', color: CHART_COLORS.danger, opacity: 0.3 },
      { offset: '95%', color: CHART_COLORS.danger, opacity: 0 },
    ],
  },
} as const
