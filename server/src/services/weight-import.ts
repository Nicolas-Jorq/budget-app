/**
 * @fileoverview Weight CSV Import Service
 *
 * Handles importing weight data from CSV files.
 * Supports format: Date, Weight Recorded, Moving Average
 *
 * @module services/weight-import
 */

import { prisma } from '../lib/prisma.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('weight-import-service')

/**
 * Parsed row from weight CSV
 */
interface ParsedWeightRow {
  date: Date
  weight: number
  movingAverage: number | null
  rowNumber: number
}

/**
 * Import result for a single row
 */
interface ImportRowResult {
  rowNumber: number
  date: string
  weight: number
  status: 'imported' | 'duplicate' | 'error'
  error?: string
}

/**
 * Full import result
 */
export interface WeightImportResult {
  success: boolean
  totalRows: number
  imported: number
  duplicates: number
  errors: number
  results: ImportRowResult[]
}

/**
 * Parse a date string in various formats
 * Supports: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, M/D/YYYY
 */
function parseDate(dateStr: string): Date | null {
  const trimmed = dateStr.trim()

  // Try ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed + 'T00:00:00')
    return isNaN(date.getTime()) ? null : date
  }

  // Try MM/DD/YYYY or M/D/YYYY
  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (usMatch) {
    const [, month, day, year] = usMatch
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return isNaN(date.getTime()) ? null : date
  }

  // Try DD/MM/YYYY (European format) - only if day > 12
  const euMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (euMatch && parseInt(euMatch[1]) > 12) {
    const [, day, month, year] = euMatch
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return isNaN(date.getTime()) ? null : date
  }

  // Try parsing as generic date string
  const genericDate = new Date(trimmed)
  return isNaN(genericDate.getTime()) ? null : genericDate
}

/**
 * Parse weight value, handling various formats
 */
function parseWeight(weightStr: string): number | null {
  const trimmed = weightStr.trim().replace(/[^\d.-]/g, '')
  const value = parseFloat(trimmed)
  return isNaN(value) || value <= 0 || value > 1000 ? null : value
}

/**
 * Parse CSV content into rows
 */
function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter(line => line.trim())
  return lines.map(line => {
    // Handle quoted fields
    const fields: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    fields.push(current.trim())
    return fields
  })
}

/**
 * Detect which columns contain date, weight, and moving average
 */
function detectColumns(headers: string[]): { dateCol: number; weightCol: number; movingAvgCol: number } {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim())

  let dateCol = -1
  let weightCol = -1
  let movingAvgCol = -1

  lowerHeaders.forEach((header, index) => {
    if (dateCol === -1 && (header.includes('date') || header === 'day')) {
      dateCol = index
    }
    if (weightCol === -1 && (header.includes('weight') && header.includes('record'))) {
      weightCol = index
    }
    if (weightCol === -1 && header === 'weight') {
      weightCol = index
    }
    if (movingAvgCol === -1 && (header.includes('moving') || header.includes('average') || header.includes('avg'))) {
      movingAvgCol = index
    }
  })

  // Fallback to positional if headers not recognized
  if (dateCol === -1) dateCol = 0
  if (weightCol === -1) weightCol = 1
  if (movingAvgCol === -1) movingAvgCol = 2

  return { dateCol, weightCol, movingAvgCol }
}

/**
 * Parse CSV content into weight data rows
 */
export function parseWeightCSV(content: string): {
  rows: ParsedWeightRow[]
  errors: Array<{ row: number; error: string }>
  headers: string[]
} {
  const lines = parseCSV(content)

  if (lines.length === 0) {
    return { rows: [], errors: [{ row: 0, error: 'Empty CSV file' }], headers: [] }
  }

  // First row is headers
  const headers = lines[0]
  const { dateCol, weightCol, movingAvgCol } = detectColumns(headers)

  const rows: ParsedWeightRow[] = []
  const errors: Array<{ row: number; error: string }> = []

  // Process data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const rowNumber = i + 1 // 1-indexed for user display

    // Skip empty rows
    if (line.every(cell => !cell.trim())) {
      continue
    }

    // Parse date
    const dateStr = line[dateCol]
    if (!dateStr) {
      errors.push({ row: rowNumber, error: 'Missing date' })
      continue
    }

    const date = parseDate(dateStr)
    if (!date) {
      errors.push({ row: rowNumber, error: `Invalid date format: "${dateStr}"` })
      continue
    }

    // Parse weight
    const weightStr = line[weightCol]
    if (!weightStr) {
      errors.push({ row: rowNumber, error: 'Missing weight value' })
      continue
    }

    const weight = parseWeight(weightStr)
    if (weight === null) {
      errors.push({ row: rowNumber, error: `Invalid weight value: "${weightStr}"` })
      continue
    }

    // Parse moving average (optional)
    const movingAvgStr = line[movingAvgCol]
    const movingAverage = movingAvgStr ? parseWeight(movingAvgStr) : null

    rows.push({
      date,
      weight,
      movingAverage,
      rowNumber,
    })
  }

  return { rows, errors, headers }
}

/**
 * Import weight data from parsed CSV rows
 */
export async function importWeightData(
  userId: string,
  rows: ParsedWeightRow[],
  options: {
    unit?: 'kg' | 'lbs'
    skipDuplicates?: boolean
  } = {}
): Promise<WeightImportResult> {
  const { unit = 'lbs', skipDuplicates = true } = options

  logger.info('Starting weight import', {
    userId,
    rowCount: rows.length,
    unit,
    skipDuplicates,
  })

  const results: ImportRowResult[] = []
  let imported = 0
  let duplicates = 0
  let errors = 0

  // Get existing weight logs for duplicate detection
  const existingLogs = await prisma.weightLog.findMany({
    where: { userId },
    select: { date: true, weight: true },
  })

  // Create a set of existing dates for quick lookup
  const existingDates = new Set(
    existingLogs.map(log => log.date.toISOString().split('T')[0])
  )

  // Process each row
  for (const row of rows) {
    const dateStr = row.date.toISOString().split('T')[0]

    // Check for duplicates
    if (skipDuplicates && existingDates.has(dateStr)) {
      results.push({
        rowNumber: row.rowNumber,
        date: dateStr,
        weight: row.weight,
        status: 'duplicate',
      })
      duplicates++
      continue
    }

    try {
      // Create weight log
      await prisma.weightLog.create({
        data: {
          userId,
          weight: row.weight,
          unit,
          date: row.date,
          notes: row.movingAverage
            ? `Imported (MA: ${row.movingAverage.toFixed(1)})`
            : 'Imported from CSV',
        },
      })

      results.push({
        rowNumber: row.rowNumber,
        date: dateStr,
        weight: row.weight,
        status: 'imported',
      })
      imported++
      existingDates.add(dateStr) // Prevent duplicates within same import
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.push({
        rowNumber: row.rowNumber,
        date: dateStr,
        weight: row.weight,
        status: 'error',
        error: errorMessage,
      })
      errors++
      logger.error('Failed to import weight row', { row, error })
    }
  }

  logger.info('Weight import completed', {
    userId,
    totalRows: rows.length,
    imported,
    duplicates,
    errors,
  })

  return {
    success: errors === 0,
    totalRows: rows.length,
    imported,
    duplicates,
    errors,
    results,
  }
}

/**
 * Calculate moving average for weight data
 * Uses a 7-day rolling average
 */
export function calculateMovingAverage(
  weights: Array<{ date: Date; weight: number }>,
  windowSize = 7
): Array<{ date: Date; weight: number; movingAverage: number | null }> {
  // Sort by date ascending
  const sorted = [...weights].sort((a, b) => a.date.getTime() - b.date.getTime())

  return sorted.map((item, index) => {
    if (index < windowSize - 1) {
      return { ...item, movingAverage: null }
    }

    const windowStart = index - windowSize + 1
    const windowWeights = sorted.slice(windowStart, index + 1)
    const sum = windowWeights.reduce((acc, w) => acc + w.weight, 0)
    const movingAverage = sum / windowSize

    return { ...item, movingAverage }
  })
}

/**
 * Get weight progress data with moving average
 *
 * Fetches extra historical data (windowSize - 1 days) so that moving average
 * can be calculated starting from the first day of the visible period.
 */
export async function getWeightProgressWithMA(
  userId: string,
  days = 90,
  windowSize = 7
): Promise<{
  data: Array<{
    date: string
    weight: number
    movingAverage: number | null
  }>
  stats: {
    startWeight: number | null
    currentWeight: number | null
    change: number | null
    changePercent: number | null
    minWeight: number | null
    maxWeight: number | null
    avgWeight: number | null
  }
}> {
  // Calculate visible period start date
  const visibleStartDate = new Date()
  visibleStartDate.setDate(visibleStartDate.getDate() - days)

  // Fetch extra historical data for MA calculation (windowSize - 1 extra days)
  const fetchStartDate = new Date()
  fetchStartDate.setDate(fetchStartDate.getDate() - days - (windowSize - 1))

  const logs = await prisma.weightLog.findMany({
    where: {
      userId,
      date: { gte: fetchStartDate },
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      weight: true,
    },
  })

  if (logs.length === 0) {
    return {
      data: [],
      stats: {
        startWeight: null,
        currentWeight: null,
        change: null,
        changePercent: null,
        minWeight: null,
        maxWeight: null,
        avgWeight: null,
      },
    }
  }

  const allWeights = logs.map(log => ({
    date: log.date,
    weight: Number(log.weight),
  }))

  // Calculate MA on all data (including extra historical data)
  const withMA = calculateMovingAverage(allWeights, windowSize)

  // Filter to only include visible period
  const visibleData = withMA.filter(item => item.date >= visibleStartDate)

  if (visibleData.length === 0) {
    return {
      data: [],
      stats: {
        startWeight: null,
        currentWeight: null,
        change: null,
        changePercent: null,
        minWeight: null,
        maxWeight: null,
        avgWeight: null,
      },
    }
  }

  // Calculate stats only on visible data
  const visibleWeights = visibleData.map(w => w.weight)
  const startWeight = visibleWeights[0]
  const currentWeight = visibleWeights[visibleWeights.length - 1]
  const change = currentWeight - startWeight
  const changePercent = (change / startWeight) * 100
  const minWeight = Math.min(...visibleWeights)
  const maxWeight = Math.max(...visibleWeights)
  const avgWeight = visibleWeights.reduce((a, b) => a + b, 0) / visibleWeights.length

  return {
    data: visibleData.map(item => ({
      date: item.date.toISOString().split('T')[0],
      weight: item.weight,
      movingAverage: item.movingAverage ? Math.round(item.movingAverage * 10) / 10 : null,
    })),
    stats: {
      startWeight: Math.round(startWeight * 10) / 10,
      currentWeight: Math.round(currentWeight * 10) / 10,
      change: Math.round(change * 10) / 10,
      changePercent: Math.round(changePercent * 10) / 10,
      minWeight: Math.round(minWeight * 10) / 10,
      maxWeight: Math.round(maxWeight * 10) / 10,
      avgWeight: Math.round(avgWeight * 10) / 10,
    },
  }
}

export const weightImportService = {
  parseWeightCSV,
  importWeightData,
  calculateMovingAverage,
  getWeightProgressWithMA,
}
