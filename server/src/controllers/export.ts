/**
 * @fileoverview Export Controller
 *
 * Handles HTTP requests for data export functionality.
 *
 * @module controllers/export
 */

import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { exportService, ExportFormat, ExportDataType } from '../services/export.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('export-controller')

/**
 * Export data
 * GET /api/export/:dataType
 * Query params: format (csv|json), startDate, endDate
 */
export async function exportData(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!
    const dataType = req.params.dataType as ExportDataType
    const format = (req.query.format as ExportFormat) || 'csv'

    // Validate data type
    const validTypes: ExportDataType[] = ['transactions', 'budgets', 'goals', 'categories', 'all']
    if (!validTypes.includes(dataType)) {
      res.status(400).json({
        message: `Invalid data type. Must be one of: ${validTypes.join(', ')}`,
      })
      return
    }

    // Validate format
    if (format !== 'csv' && format !== 'json') {
      res.status(400).json({
        message: 'Invalid format. Must be csv or json',
      })
      return
    }

    // Parse date range
    const dateRange = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    }

    // Validate dates
    if (dateRange.startDate && isNaN(dateRange.startDate.getTime())) {
      res.status(400).json({ message: 'Invalid startDate format' })
      return
    }
    if (dateRange.endDate && isNaN(dateRange.endDate.getTime())) {
      res.status(400).json({ message: 'Invalid endDate format' })
      return
    }

    const { data, filename, mimeType } = await exportService.exportData(
      userId,
      dataType,
      format,
      dateRange.startDate || dateRange.endDate ? dateRange : undefined
    )

    // Set headers for file download
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(data)
  } catch (error) {
    logger.error('Failed to export data', { error })
    next(error)
  }
}

/**
 * Get export options (metadata about what can be exported)
 * GET /api/export
 */
export async function getExportOptions(
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json({
      formats: ['csv', 'json'],
      dataTypes: [
        {
          type: 'transactions',
          description: 'All transactions with date, amount, category, and budget info',
          supportsDateRange: true,
        },
        {
          type: 'budgets',
          description: 'All budgets with spent amounts and remaining balances',
          supportsDateRange: false,
        },
        {
          type: 'goals',
          description: 'All savings goals with progress and contribution history',
          supportsDateRange: false,
        },
        {
          type: 'categories',
          description: 'All custom categories',
          supportsDateRange: false,
        },
        {
          type: 'all',
          description: 'Complete data export including all transactions, budgets, goals, and categories',
          supportsDateRange: true,
        },
      ],
      usage: {
        example: 'GET /api/export/transactions?format=csv&startDate=2024-01-01&endDate=2024-12-31',
        note: 'Date format should be YYYY-MM-DD',
      },
    })
  } catch (error) {
    logger.error('Failed to get export options', { error })
    next(error)
  }
}

export const exportController = {
  exportData,
  getExportOptions,
}
