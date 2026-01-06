/**
 * @fileoverview Document management service for the Budget App.
 *
 * This service handles all operations related to bank statement documents including:
 * - Document upload and storage to the local filesystem
 * - Document retrieval with associated pending transactions
 * - Document deletion with cascade cleanup of related transactions
 * - Integration with the AI service for document processing and transaction extraction
 * - Provider management for LLM-based document parsing
 *
 * The service acts as an intermediary between the Express API controllers and both
 * the Prisma database layer and the external Python AI service. It manages the
 * complete document lifecycle from upload through processing to transaction import.
 *
 * @module services/documents
 *
 * @example
 * // Upload a new document
 * const result = await documentService.uploadDocument(
 *   fileBuffer,
 *   'statement.pdf',
 *   userId,
 *   bankAccountId
 * );
 *
 * // Process the uploaded document
 * const processed = await documentService.processDocument(result.document_id, userId);
 *
 * // Retrieve document with transactions
 * const docWithTxns = await documentService.getById(documentId, userId);
 */

import { prisma } from '../lib/prisma.js'
import { DocumentStatus, PendingTransactionStatus } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'
import axios from 'axios'
import FormData from 'form-data'
import { createLogger } from '../lib/logger.js'
import { AppError } from '../utils/errors.js'

/** Logger instance for the document service */
const logger = createLogger('document-service')

/** Base URL for the AI service that handles document processing */
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

/** Directory path for storing uploaded documents */
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/budget-app-uploads'

// Ensure upload directory exists on module load
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  logger.info('Created upload directory', { path: UPLOAD_DIR })
}

/**
 * Represents a bank account summary with essential identifiers.
 *
 * @interface BankAccountSummary
 * @property {string} id - Unique identifier for the bank account
 * @property {string} name - User-defined name for the account
 * @property {string} bankName - Name of the banking institution
 */
interface BankAccountSummary {
  id: string
  name: string
  bankName: string
}

/**
 * Represents a document with its associated metadata and linked bank account.
 *
 * @interface DocumentDetails
 * @property {string} id - Unique identifier for the document
 * @property {string} filename - Stored filename on the server
 * @property {string} originalName - Original filename as uploaded by the user
 * @property {number} fileSize - File size in bytes
 * @property {DocumentStatus} status - Current processing status of the document
 * @property {Date | null} statementStartDate - Start date of the bank statement period
 * @property {Date | null} statementEndDate - End date of the bank statement period
 * @property {number | null} transactionCount - Number of transactions extracted from the document
 * @property {string | null} llmProvider - LLM provider used for processing (e.g., 'openai', 'anthropic')
 * @property {string | null} llmModel - Specific model used for processing (e.g., 'gpt-4', 'claude-3')
 * @property {number | null} processingTimeMs - Time taken to process the document in milliseconds
 * @property {string | null} processingError - Error message if processing failed
 * @property {Date} uploadedAt - Timestamp when the document was uploaded
 * @property {Date | null} processedAt - Timestamp when processing completed
 * @property {BankAccountSummary | null} bankAccount - Associated bank account details
 */
interface DocumentDetails {
  id: string
  filename: string
  originalName: string
  fileSize: number
  status: DocumentStatus
  statementStartDate: Date | null
  statementEndDate: Date | null
  transactionCount: number | null
  llmProvider: string | null
  llmModel: string | null
  processingTimeMs: number | null
  processingError: string | null
  uploadedAt: Date
  processedAt: Date | null
  bankAccount: BankAccountSummary | null
}

/**
 * Represents a pending transaction extracted from a document awaiting user review.
 *
 * @interface PendingTransactionDetails
 * @property {string} id - Unique identifier for the pending transaction
 * @property {Date} date - Transaction date
 * @property {string} description - Cleaned/normalized transaction description
 * @property {string | null} originalDescription - Original description as extracted from document
 * @property {number} amount - Transaction amount (positive for income, negative for expenses)
 * @property {string} type - Transaction type ('INCOME' or 'EXPENSE')
 * @property {string | null} category - AI-suggested category for the transaction
 * @property {number | null} confidence - Confidence score for the category suggestion (0-1)
 * @property {PendingTransactionStatus} status - Review status of the transaction
 * @property {string | null} userCategory - Category assigned by the user
 * @property {string | null} userNotes - Notes added by the user
 */
interface PendingTransactionDetails {
  id: string
  date: Date
  description: string
  originalDescription: string | null
  amount: number
  type: string
  category: string | null
  confidence: number | null
  status: PendingTransactionStatus
  userCategory: string | null
  userNotes: string | null
}

/**
 * Combined response containing a document and its associated pending transactions.
 *
 * @interface DocumentWithTransactions
 * @property {DocumentDetails} document - The document details including metadata and bank account
 * @property {PendingTransactionDetails[]} transactions - Array of pending transactions extracted from the document
 *
 * @example
 * const result: DocumentWithTransactions = await documentService.getById(id, userId);
 * console.log(`Document has ${result.transactions.length} transactions`);
 */
export interface DocumentWithTransactions {
  document: DocumentDetails
  transactions: PendingTransactionDetails[]
}

/**
 * Response returned after a successful document upload.
 *
 * @interface UploadResponse
 * @property {boolean} success - Whether the upload was successful
 * @property {string} document_id - Unique identifier assigned to the uploaded document
 * @property {string} filename - Original filename of the uploaded document
 * @property {number} size - File size in bytes
 * @property {string} status - Current status of the document ('PENDING')
 * @property {string} message - Informational message about next steps
 */
interface UploadResponse {
  success: boolean
  document_id: string
  filename: string
  size: number
  status: string
  message: string
}

/**
 * Response returned after successful document processing.
 *
 * @interface ProcessResponse
 * @property {boolean} success - Whether processing was successful
 * @property {string} document_id - Unique identifier of the processed document
 * @property {string} provider - LLM provider used for processing
 * @property {string} model - Specific model used for processing
 * @property {number} processing_time_ms - Time taken to process in milliseconds
 * @property {number} transaction_count - Number of transactions extracted
 * @property {object} statement_info - Extracted statement metadata
 */
interface ProcessResponse {
  success: boolean
  document_id: string
  provider: string
  model: string
  processing_time_ms: number
  transaction_count: number
  statement_info: {
    statement_start?: string
    statement_end?: string
  }
}

/**
 * Document service providing CRUD operations and AI processing integration.
 *
 * This service manages the complete lifecycle of bank statement documents,
 * from initial upload through AI-powered transaction extraction to user review.
 *
 * @example
 * // Get all documents for a user
 * const documents = await documentService.getAll(userId);
 *
 * // Upload and process a new document
 * const upload = await documentService.uploadDocument(buffer, 'statement.pdf', userId);
 * const result = await documentService.processDocument(upload.document_id, userId, 'openai');
 */
export const documentService = {
  /**
   * Retrieves all documents belonging to a user.
   *
   * Documents are returned in descending order by upload date (newest first).
   * Each document includes its associated bank account information.
   *
   * @param {string} userId - The unique identifier of the user
   * @returns {Promise<Array>} Array of documents with bank account details
   *
   * @example
   * const documents = await documentService.getAll('user-123');
   * documents.forEach(doc => {
   *   console.log(`${doc.originalName}: ${doc.status}`);
   * });
   */
  async getAll(userId: string) {
    logger.debug('Fetching all documents for user', { userId })

    const documents = await prisma.bankDocument.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
      include: {
        bankAccount: {
          select: { id: true, name: true, bankName: true }
        }
      }
    })

    logger.info('Retrieved documents for user', { userId, count: documents.length })
    return documents
  },

  /**
   * Retrieves a specific document by ID with all its pending transactions.
   *
   * Verifies that the document belongs to the requesting user before returning.
   * Transactions are ordered by date (ascending) and line number.
   *
   * @param {string} id - The unique identifier of the document
   * @param {string} userId - The unique identifier of the user (for authorization)
   * @returns {Promise<DocumentWithTransactions | null>} The document with transactions, or null if not found
   *
   * @example
   * const result = await documentService.getById('doc-456', 'user-123');
   * if (result) {
   *   console.log(`Document: ${result.document.originalName}`);
   *   console.log(`Transactions: ${result.transactions.length}`);
   * }
   */
  async getById(id: string, userId: string): Promise<DocumentWithTransactions | null> {
    logger.debug('Fetching document by ID', { documentId: id, userId })

    const document = await prisma.bankDocument.findFirst({
      where: { id, userId },
      include: {
        bankAccount: {
          select: { id: true, name: true, bankName: true }
        },
        pendingTransactions: {
          orderBy: [{ date: 'asc' }, { lineNumber: 'asc' }]
        }
      }
    })

    if (!document) {
      logger.debug('Document not found', { documentId: id, userId })
      return null
    }

    logger.info('Retrieved document with transactions', {
      documentId: id,
      transactionCount: document.pendingTransactions.length
    })

    return {
      document: {
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        fileSize: document.fileSize,
        status: document.status,
        statementStartDate: document.statementStartDate,
        statementEndDate: document.statementEndDate,
        transactionCount: document.transactionCount,
        llmProvider: document.llmProvider,
        llmModel: document.llmModel,
        processingTimeMs: document.processingTimeMs,
        processingError: document.processingError,
        uploadedAt: document.uploadedAt,
        processedAt: document.processedAt,
        bankAccount: document.bankAccount
      },
      transactions: document.pendingTransactions.map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        originalDescription: t.originalDescription,
        amount: Number(t.amount),
        type: t.type,
        category: t.category,
        confidence: t.confidence,
        status: t.status,
        userCategory: t.userCategory,
        userNotes: t.userNotes
      }))
    }
  },

  /**
   * Deletes a document and all its associated pending transactions.
   *
   * Performs ownership verification before deletion. The deletion is performed
   * in order: pending transactions first, then the document record.
   * Note: The physical file on disk is NOT deleted by this method.
   *
   * @param {string} id - The unique identifier of the document to delete
   * @param {string} userId - The unique identifier of the user (for authorization)
   * @returns {Promise<object>} The deleted document record
   * @throws {AppError} Throws NOT_FOUND error if document doesn't exist or doesn't belong to user
   *
   * @example
   * try {
   *   const deleted = await documentService.delete('doc-456', 'user-123');
   *   console.log(`Deleted document: ${deleted.originalName}`);
   * } catch (error) {
   *   if (error instanceof AppError) {
   *     console.error('Document not found');
   *   }
   * }
   */
  async delete(id: string, userId: string) {
    logger.debug('Attempting to delete document', { documentId: id, userId })

    // Verify ownership
    const existing = await prisma.bankDocument.findFirst({
      where: { id, userId }
    })

    if (!existing) {
      logger.warn('Delete failed: document not found or unauthorized', { documentId: id, userId })
      throw AppError.notFound('Document', id)
    }

    // Delete pending transactions first
    const deletedTransactions = await prisma.pendingTransaction.deleteMany({
      where: { documentId: id }
    })

    logger.debug('Deleted pending transactions', {
      documentId: id,
      count: deletedTransactions.count
    })

    // Delete document
    const deleted = await prisma.bankDocument.delete({
      where: { id }
    })

    logger.info('Document deleted successfully', {
      documentId: id,
      originalName: existing.originalName,
      deletedTransactions: deletedTransactions.count
    })

    return deleted
  },

  /**
   * Retrieves available LLM providers from the AI service.
   *
   * Proxies the request to the Python AI service which manages
   * the available providers and their configurations.
   *
   * @returns {Promise<any>} Provider configuration from the AI service
   * @throws {AppError} Throws EXTERNAL_SERVICE_ERROR if the AI service is unavailable
   *
   * @example
   * const providers = await documentService.getProviders();
   * console.log('Available providers:', providers);
   */
  async getProviders(): Promise<any> {
    logger.debug('Fetching available LLM providers')

    try {
      const response = await axios.get(`${AI_SERVICE_URL}/api/documents/providers`)
      logger.info('Retrieved LLM providers', { providers: response.data })
      return response.data
    } catch (error) {
      logger.error('Failed to fetch LLM providers', { error })
      throw AppError.externalService('AI Service', { endpoint: '/api/documents/providers' })
    }
  },

  /**
   * Uploads a document to the server and creates a database record.
   *
   * The document is saved to the configured upload directory with a unique
   * filename (UUID-based). A database record is created with PENDING status.
   * The document must be processed separately using processDocument().
   *
   * @param {Buffer} file - The file content as a Buffer
   * @param {string} filename - The original filename
   * @param {string} userId - The unique identifier of the uploading user
   * @param {string} [bankAccountId] - Optional ID of the associated bank account
   * @returns {Promise<UploadResponse>} Upload result with document ID and status
   * @throws {AppError} Throws INTERNAL_ERROR if file cannot be saved
   *
   * @example
   * const fileBuffer = fs.readFileSync('/path/to/statement.pdf');
   * const result = await documentService.uploadDocument(
   *   fileBuffer,
   *   'bank-statement-jan-2024.pdf',
   *   'user-123',
   *   'account-456'
   * );
   * console.log(`Uploaded with ID: ${result.document_id}`);
   */
  async uploadDocument(
    file: Buffer,
    filename: string,
    userId: string,
    bankAccountId?: string
  ): Promise<UploadResponse> {
    logger.info('Starting document upload', {
      filename,
      userId,
      bankAccountId,
      fileSize: file.length
    })

    // Generate unique file ID and save locally
    const fileId = randomUUID()
    const storedFilename = `${fileId}.pdf`
    const filePath = path.join(UPLOAD_DIR, storedFilename)

    try {
      // Save file to disk
      fs.writeFileSync(filePath, file)
      logger.debug('File saved to disk', { filePath, size: file.length })
    } catch (error) {
      logger.error('Failed to save file to disk', { filePath, error })
      throw AppError.internal('Failed to save uploaded file', { filename, filePath })
    }

    // Create database record
    const document = await prisma.bankDocument.create({
      data: {
        id: fileId,
        filename: storedFilename,
        originalName: filename,
        fileSize: file.length,
        mimeType: 'application/pdf',
        filePath: filePath,
        status: 'PENDING',
        bankAccountId: bankAccountId || null,
        userId: userId,
      }
    })

    logger.info('Document uploaded successfully', {
      documentId: document.id,
      originalName: filename,
      fileSize: file.length
    })

    return {
      success: true,
      document_id: document.id,
      filename: filename,
      size: file.length,
      status: 'PENDING',
      message: 'Document uploaded. Call /process to extract transactions.'
    }
  },

  /**
   * Processes an uploaded document to extract transactions using the AI service.
   *
   * This method:
   * 1. Validates the document exists and belongs to the user
   * 2. Verifies the document is in a processable state (PENDING or FAILED)
   * 3. Updates status to PROCESSING
   * 4. Sends the document to the AI service for extraction
   * 5. Stores extracted transactions as pending transactions
   * 6. Updates document with processing results and metadata
   *
   * If processing fails, the document status is set to FAILED with the error message.
   *
   * @param {string} documentId - The unique identifier of the document to process
   * @param {string} userId - The unique identifier of the user (for authorization)
   * @param {string} [llmProvider] - Optional LLM provider to use (e.g., 'openai', 'anthropic')
   * @returns {Promise<ProcessResponse>} Processing result with extracted transaction count
   * @throws {AppError} Throws NOT_FOUND if document doesn't exist or doesn't belong to user
   * @throws {AppError} Throws VALIDATION_ERROR if document is already processed
   * @throws {AppError} Throws EXTERNAL_SERVICE_ERROR if AI service fails
   *
   * @example
   * try {
   *   const result = await documentService.processDocument(
   *     'doc-456',
   *     'user-123',
   *     'anthropic'
   *   );
   *   console.log(`Extracted ${result.transaction_count} transactions`);
   *   console.log(`Processing took ${result.processing_time_ms}ms`);
   * } catch (error) {
   *   if (error instanceof AppError) {
   *     console.error(`Processing failed: ${error.message}`);
   *   }
   * }
   */
  async processDocument(
    documentId: string,
    userId: string,
    llmProvider?: string
  ): Promise<ProcessResponse> {
    logger.info('Starting document processing', { documentId, userId, llmProvider })

    // Get document from database
    const document = await prisma.bankDocument.findFirst({
      where: { id: documentId, userId }
    })

    if (!document) {
      logger.warn('Process failed: document not found', { documentId, userId })
      throw AppError.notFound('Document', documentId)
    }

    if (!['PENDING', 'FAILED'].includes(document.status)) {
      logger.warn('Process failed: invalid document status', {
        documentId,
        currentStatus: document.status
      })
      throw AppError.validation(
        `Document cannot be processed (current status: ${document.status})`,
        { documentId, status: document.status }
      )
    }

    // Update status to processing
    await prisma.bankDocument.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' }
    })

    logger.debug('Document status updated to PROCESSING', { documentId })

    try {
      // Read file from disk
      const fileBuffer = fs.readFileSync(document.filePath)
      logger.debug('File read from disk', { filePath: document.filePath, size: fileBuffer.length })

      // Create form data for Python service
      const formData = new FormData()
      formData.append('file', fileBuffer, {
        filename: document.originalName,
        contentType: 'application/pdf'
      })
      formData.append('user_id', userId)
      formData.append('document_id', documentId)
      if (llmProvider) {
        formData.append('llm_provider', llmProvider)
      }

      logger.debug('Sending document to AI service', {
        documentId,
        aiServiceUrl: `${AI_SERVICE_URL}/api/documents/extract`
      })

      // Call Python AI service to process using axios
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/documents/extract`,
        formData,
        {
          headers: formData.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      )

      const result = response.data

      logger.info('AI service extraction complete', {
        documentId,
        provider: result.provider,
        model: result.model,
        transactionCount: result.transaction_count,
        processingTimeMs: result.processing_time_ms
      })

      // Update document with results
      await prisma.bankDocument.update({
        where: { id: documentId },
        data: {
          status: 'EXTRACTED',
          extractedData: result,
          transactionCount: result.transaction_count || 0,
          llmProvider: result.provider || null,
          llmModel: result.model || null,
          processingTimeMs: result.processing_time_ms || null,
          statementStartDate: result.statement_info?.statement_start ? new Date(result.statement_info.statement_start) : null,
          statementEndDate: result.statement_info?.statement_end ? new Date(result.statement_info.statement_end) : null,
          processedAt: new Date()
        }
      })

      // Create pending transactions
      if (result.transactions && Array.isArray(result.transactions)) {
        logger.debug('Creating pending transactions', {
          documentId,
          count: result.transactions.length
        })

        for (const txn of result.transactions) {
          await prisma.pendingTransaction.create({
            data: {
              documentId: documentId,
              date: new Date(txn.date),
              description: txn.description,
              originalDescription: txn.original_description || txn.description,
              amount: txn.amount,
              type: txn.type?.toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE',
              category: txn.category,
              suggestedCategories: [{ category: txn.category, confidence: txn.confidence }],
              confidence: txn.confidence,
              lineNumber: txn.line_number,
              status: 'PENDING'
            }
          })
        }

        logger.info('Pending transactions created', {
          documentId,
          count: result.transactions.length
        })
      }

      return {
        success: true,
        document_id: documentId,
        provider: result.provider,
        model: result.model,
        processing_time_ms: result.processing_time_ms,
        transaction_count: result.transaction_count || 0,
        statement_info: result.statement_info
      }

    } catch (error: any) {
      // Extract error message from axios error or regular error
      let errorMessage = 'Unknown error'
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.detail || error.message
        logger.error('AI service request failed', {
          documentId,
          status: error.response?.status,
          message: errorMessage
        })
      } else if (error instanceof Error) {
        errorMessage = error.message
        logger.error('Document processing failed', { documentId, error: errorMessage })
      }

      // Mark document as failed
      await prisma.bankDocument.update({
        where: { id: documentId },
        data: {
          status: 'FAILED',
          processingError: errorMessage
        }
      })

      logger.warn('Document marked as FAILED', { documentId, error: errorMessage })

      throw AppError.externalService('AI Service', {
        documentId,
        originalError: errorMessage
      })
    }
  },

  /**
   * Retrieves a summary of transactions for a specific document from the AI service.
   *
   * Proxies the request to the Python AI service which provides aggregated
   * statistics and insights about the extracted transactions.
   *
   * @param {string} documentId - The unique identifier of the document
   * @returns {Promise<any>} Transaction summary data from the AI service
   * @throws {AppError} Throws EXTERNAL_SERVICE_ERROR if the AI service is unavailable
   *
   * @example
   * const summary = await documentService.getDocumentSummary('doc-456');
   * console.log('Total income:', summary.totalIncome);
   * console.log('Total expenses:', summary.totalExpenses);
   */
  async getDocumentSummary(documentId: string): Promise<any> {
    logger.debug('Fetching document summary', { documentId })

    try {
      const response = await axios.get(`${AI_SERVICE_URL}/api/transactions/summary/${documentId}`)
      logger.info('Retrieved document summary', { documentId })
      return response.data
    } catch (error) {
      logger.error('Failed to fetch document summary', { documentId, error })
      throw AppError.externalService('AI Service', {
        endpoint: `/api/transactions/summary/${documentId}`,
        documentId
      })
    }
  }
}
