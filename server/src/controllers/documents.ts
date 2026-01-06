/**
 * @fileoverview Document management controller for the Budget App.
 *
 * This controller handles all HTTP endpoints related to bank statement document processing,
 * including:
 * - Document upload and management (upload, retrieve, delete)
 * - AI-powered document processing for transaction extraction
 * - LLM provider management and status
 * - Pending transaction review workflow (update, approve, reject)
 * - Bulk transaction operations
 * - Transaction import to budgets
 * - Duplicate detection across documents
 *
 * The document processing workflow:
 * 1. User uploads a bank statement PDF
 * 2. Document is processed by AI service to extract transactions
 * 3. Extracted transactions are stored as "pending" for user review
 * 4. User reviews, edits, approves/rejects transactions
 * 5. Approved transactions are imported into a budget
 *
 * @module controllers/documents
 *
 * @example
 * // Route setup
 * router.get('/documents', documentController.getAll);
 * router.post('/documents/upload', upload.single('file'), documentController.upload);
 * router.post('/documents/:id/process', documentController.process);
 * router.post('/documents/:id/transactions/:transactionId/approve', documentController.approveTransaction);
 */

import { Response } from 'express'
import { documentService } from '../services/documents.js'
import { pendingTransactionService } from '../services/pending-transactions.js'
import { AuthRequest } from '../middleware/auth.js'
import { AppError, isAppError } from '../utils/errors.js'

/**
 * Document controller providing HTTP request handlers for document management
 * and transaction processing.
 *
 * All endpoints require authentication. Document ownership is verified
 * before any operations are performed.
 *
 * @example
 * // Using in Express router
 * router.get('/documents', documentController.getAll);
 * router.post('/documents/upload', upload.single('file'), documentController.upload);
 */
export const documentController = {
  // ==========================================
  // LLM Providers
  // ==========================================

  /**
   * Retrieves available LLM providers for document processing.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with available providers
   *
   * @throws {AppError} 503 - AI service is unavailable
   * @throws {AppError} 500 - Failed to fetch providers
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns list of available LLM providers with their capabilities
   * - 500: Internal server error or AI service unavailable
   *
   * Returns information about which AI providers are configured and available
   * for document processing (e.g., OpenAI, Anthropic).
   *
   * @example
   * // GET /api/documents/providers
   * // Response: {
   * //   providers: [
   * //     { name: 'openai', available: true, models: ['gpt-4', 'gpt-3.5-turbo'] },
   * //     { name: 'anthropic', available: true, models: ['claude-3-opus', 'claude-3-sonnet'] }
   * //   ]
   * // }
   */
  async getProviders(_req: AuthRequest, res: Response) {
    try {
      const providers = await documentService.getProviders()
      res.json(providers)
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      const appError = AppError.externalService('AI Service')
      res.status(appError.statusCode).json({ message: 'Failed to fetch providers. Is AI service running?' })
    }
  },

  // ==========================================
  // Document Management
  // ==========================================

  /**
   * Retrieves all documents for the authenticated user.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with array of documents
   *
   * @throws {AppError} 500 - Failed to fetch documents
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns array of documents with bank account info
   * - 500: Internal server error
   *
   * Documents are returned in descending order by upload date (newest first).
   * Each document includes its associated bank account information and
   * processing status.
   *
   * @example
   * // GET /api/documents
   * // Response: [
   * //   {
   * //     id: '...',
   * //     originalName: 'statement-jan-2024.pdf',
   * //     status: 'EXTRACTED',
   * //     transactionCount: 45,
   * //     bankAccount: { id: '...', name: 'Chase Freedom', bankName: 'Chase' }
   * //   },
   * //   ...
   * // ]
   */
  async getAll(req: AuthRequest, res: Response) {
    try {
      const documents = await documentService.getAll(req.userId!)
      res.json(documents)
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ message: 'Failed to fetch documents' })
    }
  },

  /**
   * Retrieves a single document by ID with all its pending transactions.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.id - The document ID to retrieve
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with document and transactions
   *
   * @throws {AppError} 404 - Document not found
   * @throws {AppError} 500 - Failed to fetch document
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns document with all pending transactions
   * - 404: Document not found or doesn't belong to user
   * - 500: Internal server error
   *
   * Response includes full document metadata and all pending transactions
   * extracted from the document, ordered by date and line number.
   *
   * @example
   * // GET /api/documents/:id
   * // Response: {
   * //   document: {
   * //     id: '...',
   * //     originalName: 'statement.pdf',
   * //     status: 'EXTRACTED',
   * //     bankAccount: {...}
   * //   },
   * //   transactions: [
   * //     { id: '...', date: '2024-01-15', description: 'GROCERY STORE', amount: -45.67, status: 'PENDING' },
   * //     ...
   * //   ]
   * // }
   */
  async getById(req: AuthRequest, res: Response) {
    try {
      const result = await documentService.getById(req.params.id, req.userId!)
      if (!result) {
        throw AppError.notFound('Document', req.params.id)
      }
      res.json(result)
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ message: 'Failed to fetch document' })
    }
  },

  /**
   * Uploads a new bank statement document.
   *
   * @param {AuthRequest} req - Express request with authenticated user and file
   * @param {Express.Multer.File} req.file - The uploaded PDF file
   * @param {string} [req.body.bankAccountId] - Optional bank account to associate with document
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with upload result
   *
   * @throws {AppError} 400 - No file uploaded or invalid file
   * @throws {AppError} 500 - Failed to upload document
   *
   * @description
   * HTTP Response Codes:
   * - 201: Created - Document uploaded successfully
   * - 400: No file uploaded or validation error
   * - 500: Internal server error
   *
   * After upload, the document has status 'PENDING' and must be processed
   * separately using the /process endpoint to extract transactions.
   *
   * @example
   * // POST /api/documents/upload
   * // Content-Type: multipart/form-data
   * // Body: file (PDF), bankAccountId (optional)
   * // Response: {
   * //   success: true,
   * //   document_id: '...',
   * //   filename: 'statement.pdf',
   * //   size: 245678,
   * //   status: 'PENDING',
   * //   message: 'Document uploaded. Call /process to extract transactions.'
   * // }
   */
  async upload(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        throw AppError.validation('No file uploaded', { field: 'file' })
      }

      const bankAccountId = req.body.bankAccountId as string | undefined

      const result = await documentService.uploadDocument(
        req.file.buffer,
        req.file.originalname,
        req.userId!,
        bankAccountId
      )

      res.status(201).json(result)
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      const message = error instanceof Error ? error.message : 'Failed to upload document'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json(appError.toJSON())
    }
  },

  /**
   * Processes an uploaded document to extract transactions using AI.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.id - The document ID to process
   * @param {string} [req.body.llmProvider] - Optional LLM provider to use (e.g., 'openai', 'anthropic')
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with processing result
   *
   * @throws {AppError} 404 - Document not found
   * @throws {AppError} 400 - Document cannot be processed (wrong status)
   * @throws {AppError} 503 - AI service unavailable
   * @throws {AppError} 500 - Failed to process document
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Document processed, transactions extracted
   * - 400: Document already processed or invalid state
   * - 404: Document not found
   * - 503: AI service unavailable
   * - 500: Internal server error
   *
   * Processing steps:
   * 1. Validates document is in PENDING or FAILED state
   * 2. Sends document to AI service for extraction
   * 3. Creates pending transactions from extracted data
   * 4. Updates document status to EXTRACTED or FAILED
   *
   * @example
   * // POST /api/documents/:id/process
   * // Body: { llmProvider: 'openai' }
   * // Response: {
   * //   success: true,
   * //   document_id: '...',
   * //   provider: 'openai',
   * //   model: 'gpt-4',
   * //   processing_time_ms: 5420,
   * //   transaction_count: 45,
   * //   statement_info: { statement_start: '2024-01-01', statement_end: '2024-01-31' }
   * // }
   */
  async process(req: AuthRequest, res: Response) {
    try {
      const { llmProvider } = req.body
      const result = await documentService.processDocument(req.params.id, req.userId!, llmProvider)
      res.json(result)
    } catch (error) {
      console.error('Process document error:', error)
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      const message = error instanceof Error ? error.message : 'Failed to process document'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json(appError.toJSON())
    }
  },

  /**
   * Deletes a document and all its pending transactions.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.id - The document ID to delete
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends 204 No Content on success
   *
   * @throws {AppError} 404 - Document not found
   * @throws {AppError} 500 - Failed to delete document
   *
   * @description
   * HTTP Response Codes:
   * - 204: No Content - Document successfully deleted
   * - 404: Document not found
   * - 500: Internal server error
   *
   * Deleting a document also deletes all associated pending transactions.
   * The physical file on disk may not be deleted immediately.
   *
   * @example
   * // DELETE /api/documents/:id
   * // Response: 204 No Content
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      await documentService.delete(req.params.id, req.userId!)
      res.status(204).send()
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      const message = error instanceof Error ? error.message : 'Failed to delete document'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json(appError.toJSON())
    }
  },

  /**
   * Retrieves a summary of transactions for a document from the AI service.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.id - The document ID to summarize
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with transaction summary
   *
   * @throws {AppError} 503 - AI service unavailable
   * @throws {AppError} 500 - Failed to fetch summary
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns aggregated transaction statistics
   * - 500: Internal server error or AI service unavailable
   *
   * Returns insights about the extracted transactions including
   * totals, categories, and spending patterns.
   *
   * @example
   * // GET /api/documents/:id/summary
   * // Response: {
   * //   totalIncome: 5000,
   * //   totalExpenses: 3200,
   * //   categoryBreakdown: { groceries: 450, utilities: 200, ... },
   * //   transactionCount: 45
   * // }
   */
  async getSummary(req: AuthRequest, res: Response) {
    try {
      const summary = await documentService.getDocumentSummary(req.params.id)
      res.json(summary)
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      res.status(500).json({ message: 'Failed to fetch summary' })
    }
  },

  // ==========================================
  // Transaction Review
  // ==========================================

  /**
   * Updates a pending transaction (edit before approval).
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.transactionId - The pending transaction ID to update
   * @param {Object} req.body - Fields to update
   * @param {string} [req.body.description] - Updated transaction description
   * @param {number} [req.body.amount] - Updated amount
   * @param {string} [req.body.date] - Updated date
   * @param {string} [req.body.category] - Updated category
   * @param {string} [req.body.userCategory] - User-assigned category
   * @param {string} [req.body.userNotes] - User notes
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with updated transaction
   *
   * @throws {AppError} 404 - Transaction not found
   * @throws {AppError} 400 - Validation error
   * @throws {AppError} 500 - Failed to update transaction
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns updated pending transaction
   * - 400: Validation error
   * - 404: Transaction not found
   * - 500: Internal server error
   *
   * Allows users to correct AI-extracted transaction data before
   * approving it for import into a budget.
   *
   * @example
   * // PUT /api/documents/:id/transactions/:transactionId
   * // Body: { category: 'groceries', userNotes: 'Weekly shopping' }
   * // Response: { id: '...', category: 'groceries', userNotes: 'Weekly shopping', ... }
   */
  async updateTransaction(req: AuthRequest, res: Response) {
    try {
      const transaction = await pendingTransactionService.update(
        req.params.transactionId,
        req.userId!,
        req.body
      )
      res.json(transaction)
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      const message = error instanceof Error ? error.message : 'Failed to update transaction'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json(appError.toJSON())
    }
  },

  /**
   * Approves a pending transaction for import.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.transactionId - The pending transaction ID to approve
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with approved transaction
   *
   * @throws {AppError} 404 - Transaction not found
   * @throws {AppError} 400 - Transaction cannot be approved (wrong status)
   * @throws {AppError} 500 - Failed to approve transaction
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Transaction approved, status changed to APPROVED
   * - 400: Transaction already processed
   * - 404: Transaction not found
   * - 500: Internal server error
   *
   * Approved transactions can be imported into a budget using the
   * import endpoint. Only PENDING transactions can be approved.
   *
   * @example
   * // POST /api/documents/:id/transactions/:transactionId/approve
   * // Response: { id: '...', status: 'APPROVED', ... }
   */
  async approveTransaction(req: AuthRequest, res: Response) {
    try {
      const transaction = await pendingTransactionService.approve(
        req.params.transactionId,
        req.userId!
      )
      res.json(transaction)
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      const message = error instanceof Error ? error.message : 'Failed to approve transaction'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json(appError.toJSON())
    }
  },

  /**
   * Rejects a pending transaction (will not be imported).
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.transactionId - The pending transaction ID to reject
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with rejected transaction
   *
   * @throws {AppError} 404 - Transaction not found
   * @throws {AppError} 400 - Transaction cannot be rejected (wrong status)
   * @throws {AppError} 500 - Failed to reject transaction
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Transaction rejected, status changed to REJECTED
   * - 400: Transaction already processed
   * - 404: Transaction not found
   * - 500: Internal server error
   *
   * Rejected transactions are marked as REJECTED and will not be
   * included when importing transactions to a budget.
   *
   * @example
   * // POST /api/documents/:id/transactions/:transactionId/reject
   * // Response: { id: '...', status: 'REJECTED', ... }
   */
  async rejectTransaction(req: AuthRequest, res: Response) {
    try {
      const transaction = await pendingTransactionService.reject(
        req.params.transactionId,
        req.userId!
      )
      res.json(transaction)
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      const message = error instanceof Error ? error.message : 'Failed to reject transaction'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json(appError.toJSON())
    }
  },

  /**
   * Performs bulk actions on multiple pending transactions.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {Object} req.body - Bulk action parameters
   * @param {string[]} req.body.transactionIds - Array of transaction IDs to process
   * @param {string} req.body.action - Action to perform: 'approve', 'reject', or 'delete'
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with operation result
   *
   * @throws {AppError} 400 - Invalid action or empty transaction list
   * @throws {AppError} 500 - Failed to process bulk action
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - All transactions processed
   * - 400: Invalid action or missing transaction IDs
   * - 500: Internal server error
   *
   * Allows efficient batch processing of multiple transactions at once.
   * Useful for quickly approving or rejecting all transactions in a document.
   *
   * @example
   * // POST /api/documents/:id/transactions/bulk
   * // Body: { transactionIds: ['id1', 'id2', 'id3'], action: 'approve' }
   * // Response: { success: true, message: 'Processed 3 transactions', action: 'approve' }
   */
  async bulkAction(req: AuthRequest, res: Response) {
    try {
      const { transactionIds, action } = req.body

      if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
        throw AppError.validation('transactionIds array is required', { field: 'transactionIds' })
      }

      if (!['approve', 'reject', 'delete'].includes(action)) {
        throw AppError.validation(
          'Invalid action. Use approve, reject, or delete',
          { field: 'action', value: action, allowed: ['approve', 'reject', 'delete'] }
        )
      }

      await pendingTransactionService.bulkAction(
        transactionIds,
        action,
        req.userId!
      )
      res.json({
        success: true,
        message: `Processed ${transactionIds.length} transactions`,
        action
      })
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      const message = error instanceof Error ? error.message : 'Failed to process bulk action'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json(appError.toJSON())
    }
  },

  /**
   * Imports approved transactions from a document into a budget.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.id - The document ID to import from
   * @param {string} [req.body.budgetId] - Optional budget ID to import into
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with import result
   *
   * @throws {AppError} 404 - Document or budget not found
   * @throws {AppError} 400 - No approved transactions to import
   * @throws {AppError} 500 - Failed to import transactions
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Transactions imported
   * - 400: No approved transactions or validation error
   * - 404: Document or budget not found
   * - 500: Internal server error
   *
   * Only transactions with status APPROVED will be imported.
   * Imported transactions are converted to regular budget transactions.
   *
   * @example
   * // POST /api/documents/:id/import
   * // Body: { budgetId: 'budget-123' }
   * // Response: {
   * //   success: true,
   * //   importedCount: 42,
   * //   message: 'Successfully imported 42 transactions'
   * // }
   */
  async importTransactions(req: AuthRequest, res: Response) {
    try {
      const { budgetId } = req.body
      const result = await pendingTransactionService.importApproved(
        req.params.id,
        req.userId!,
        budgetId
      )
      res.json({
        success: true,
        ...result,
        message: `Successfully imported ${result.importedCount} transactions`
      })
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      const message = error instanceof Error ? error.message : 'Failed to import transactions'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json(appError.toJSON())
    }
  },

  /**
   * Checks for duplicate transactions across documents.
   *
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {string} req.params.id - The document ID to check for duplicates
   * @param {Response} res - Express response object
   *
   * @returns {Promise<void>} Sends JSON response with duplicate detection results
   *
   * @throws {AppError} 404 - Document not found
   * @throws {AppError} 500 - Failed to check duplicates
   *
   * @description
   * HTTP Response Codes:
   * - 200: Success - Returns duplicate detection results
   * - 404: Document not found
   * - 500: Internal server error
   *
   * Analyzes transactions in the document and compares against
   * existing transactions to identify potential duplicates based on
   * date, amount, and description similarity.
   *
   * @example
   * // GET /api/documents/:id/duplicates
   * // Response: {
   * //   duplicatesFound: 3,
   * //   transactions: [
   * //     { id: '...', matchingTransactionId: '...', confidence: 0.95 },
   * //     ...
   * //   ]
   * // }
   */
  async checkDuplicates(req: AuthRequest, res: Response) {
    try {
      const result = await pendingTransactionService.checkDuplicates(
        req.params.id,
        req.userId!
      )
      res.json(result)
    } catch (error) {
      if (isAppError(error)) {
        return res.status(error.statusCode).json(error.toJSON())
      }
      const message = error instanceof Error ? error.message : 'Failed to check duplicates'
      const appError = AppError.validation(message)
      res.status(appError.statusCode).json(appError.toJSON())
    }
  }
}
