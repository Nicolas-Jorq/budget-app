/**
 * @fileoverview Pending Transaction Service for the Budget App.
 *
 * This service manages pending transactions that are extracted from bank documents
 * (such as PDF statements) before they are imported into the user's main transaction
 * ledger. It provides a review workflow where users can:
 *
 * - View extracted transactions from uploaded documents
 * - Edit transaction details (category, description, amount, type, notes)
 * - Approve or reject individual transactions
 * - Perform bulk operations on multiple transactions
 * - Check for duplicate transactions against existing records
 * - Import approved transactions into the main transaction table
 *
 * The service enforces ownership verification to ensure users can only access
 * and modify their own transactions. All operations validate that the transaction
 * belongs to a document owned by the requesting user.
 *
 * @module services/pending-transactions
 *
 * @example
 * // Get pending transactions for a document
 * const transactions = await pendingTransactionService.getByDocument(documentId, userId);
 *
 * @example
 * // Approve and import transactions
 * await pendingTransactionService.approve(transactionId, userId);
 * const result = await pendingTransactionService.importApproved(documentId, userId, budgetId);
 */

import { prisma } from '../lib/prisma.js'
import { PendingTransactionStatus, Prisma } from '@prisma/client'
import { createLogger } from '../lib/logger.js'
import { AppError } from '../utils/errors.js'

/** Logger instance for the pending transactions service */
const logger = createLogger('pending-transactions-service')

/**
 * Data transfer object for updating a pending transaction.
 *
 * All fields are optional - only provided fields will be updated.
 * This allows partial updates to transaction details during the review process.
 *
 * @interface UpdateTransactionData
 *
 * @property {string} [category] - The transaction category (e.g., 'Groceries', 'Utilities').
 *   When set, this overrides the AI-suggested category.
 * @property {string} [description] - Human-readable description of the transaction.
 *   Can be edited to clarify or correct the extracted description.
 * @property {number} [amount] - The transaction amount in the base currency.
 *   Always stored as a positive number; the type field indicates debit/credit.
 * @property {string} [type] - Transaction type, either 'EXPENSE' or 'INCOME'.
 *   Will be converted to uppercase during processing.
 * @property {string} [notes] - User-provided notes or comments about the transaction.
 *   Useful for adding context that isn't captured in the description.
 *
 * @example
 * const updateData: UpdateTransactionData = {
 *   category: 'Dining',
 *   notes: 'Business lunch with client'
 * };
 */
export interface UpdateTransactionData {
  category?: string
  description?: string
  amount?: number
  type?: string
  notes?: string
}

/**
 * Result object returned after checking for duplicate transactions.
 *
 * @interface DuplicateCheckResult
 * @property {number} totalChecked - Total number of pending transactions examined
 * @property {number} duplicatesFound - Number of duplicates detected
 * @property {Array<DuplicateMatch>} duplicates - Detailed information about each duplicate
 */

/**
 * Information about a single duplicate match.
 *
 * @interface DuplicateMatch
 * @property {string} pendingId - ID of the pending transaction that is a duplicate
 * @property {string} pendingDescription - Description of the pending transaction
 * @property {string} matchedTransactionId - ID of the existing transaction it matches
 */

/**
 * Result object returned after importing approved transactions.
 *
 * @interface ImportResult
 * @property {number} importedCount - Number of transactions successfully imported
 * @property {string[]} transactionIds - Array of IDs of the newly created transactions
 */

/**
 * Pending Transaction Service object containing all methods for managing
 * pending transactions throughout the review and import workflow.
 *
 * @namespace pendingTransactionService
 */
export const pendingTransactionService = {
  /**
   * Retrieves all pending transactions associated with a specific bank document.
   *
   * Transactions are ordered by date (ascending) and then by line number
   * (ascending) to maintain the order they appeared in the original document.
   *
   * @param {string} documentId - The unique identifier of the bank document
   * @param {string} userId - The ID of the user making the request (for ownership verification)
   * @returns {Promise<PendingTransaction[]>} Array of pending transactions for the document
   *
   * @throws {AppError} NOT_FOUND - When the document does not exist or is not owned by the user
   *
   * @example
   * // Fetch transactions for a document
   * try {
   *   const transactions = await pendingTransactionService.getByDocument(
   *     'doc-abc123',
   *     'user-xyz789'
   *   );
   *   console.log(`Found ${transactions.length} pending transactions`);
   * } catch (error) {
   *   if (error.code === 'NOT_FOUND') {
   *     console.error('Document not found or access denied');
   *   }
   * }
   */
  async getByDocument(documentId: string, userId: string) {
    logger.debug('Fetching pending transactions for document', { documentId, userId })

    // Verify document ownership
    const document = await prisma.bankDocument.findFirst({
      where: { id: documentId, userId }
    })

    if (!document) {
      logger.warn('Document not found or access denied', { documentId, userId })
      throw AppError.notFound('Document', documentId)
    }

    const transactions = await prisma.pendingTransaction.findMany({
      where: { documentId },
      orderBy: [{ date: 'asc' }, { lineNumber: 'asc' }]
    })

    logger.info('Retrieved pending transactions', {
      documentId,
      count: transactions.length
    })

    return transactions
  },

  /**
   * Updates a pending transaction with new data.
   *
   * Only transactions that have not been imported can be modified. The method
   * validates ownership by checking that the transaction's parent document
   * belongs to the requesting user.
   *
   * @param {string} id - The unique identifier of the pending transaction
   * @param {string} userId - The ID of the user making the request
   * @param {UpdateTransactionData} data - The fields to update
   * @returns {Promise<PendingTransaction>} The updated pending transaction
   *
   * @throws {AppError} NOT_FOUND - When the transaction does not exist or is not owned by the user
   * @throws {AppError} CONFLICT - When attempting to modify an already imported transaction
   *
   * @example
   * // Update category and add notes
   * const updated = await pendingTransactionService.update(
   *   'txn-123',
   *   'user-456',
   *   {
   *     category: 'Entertainment',
   *     notes: 'Netflix subscription'
   *   }
   * );
   *
   * @example
   * // Correct the transaction amount
   * const updated = await pendingTransactionService.update(
   *   'txn-123',
   *   'user-456',
   *   { amount: 49.99 }
   * );
   */
  async update(id: string, userId: string, data: UpdateTransactionData) {
    logger.debug('Updating pending transaction', { id, userId, data })

    // Verify ownership through document
    const transaction = await prisma.pendingTransaction.findFirst({
      where: { id },
      include: {
        document: { select: { userId: true } }
      }
    })

    if (!transaction || transaction.document.userId !== userId) {
      logger.warn('Transaction not found or access denied', { id, userId })
      throw AppError.notFound('Transaction', id)
    }

    if (transaction.status === PendingTransactionStatus.IMPORTED) {
      logger.warn('Attempted to modify imported transaction', { id })
      throw AppError.conflict('Cannot modify imported transaction', { transactionId: id })
    }

    const updateData: Prisma.PendingTransactionUpdateInput = {}

    if (data.category !== undefined) {
      updateData.userCategory = data.category
    }
    if (data.description !== undefined) {
      updateData.description = data.description
    }
    if (data.amount !== undefined) {
      updateData.amount = data.amount
    }
    if (data.type !== undefined) {
      updateData.type = data.type.toUpperCase()
    }
    if (data.notes !== undefined) {
      updateData.userNotes = data.notes
    }

    const updated = await prisma.pendingTransaction.update({
      where: { id },
      data: updateData
    })

    logger.info('Pending transaction updated', { id, fields: Object.keys(data) })

    return updated
  },

  /**
   * Approves a pending transaction for import.
   *
   * Changes the transaction status from PENDING to APPROVED, marking it
   * ready for import into the main transaction ledger. Only the owner
   * of the parent document can approve transactions.
   *
   * @param {string} id - The unique identifier of the pending transaction
   * @param {string} userId - The ID of the user making the request
   * @returns {Promise<PendingTransaction>} The approved pending transaction
   *
   * @throws {AppError} NOT_FOUND - When the transaction does not exist or is not owned by the user
   *
   * @example
   * // Approve a single transaction
   * const approved = await pendingTransactionService.approve('txn-123', 'user-456');
   * console.log(approved.status); // 'APPROVED'
   */
  async approve(id: string, userId: string) {
    logger.debug('Approving pending transaction', { id, userId })

    // Verify ownership
    const transaction = await prisma.pendingTransaction.findFirst({
      where: { id },
      include: {
        document: { select: { userId: true } }
      }
    })

    if (!transaction || transaction.document.userId !== userId) {
      logger.warn('Transaction not found or access denied for approval', { id, userId })
      throw AppError.notFound('Transaction', id)
    }

    const approved = await prisma.pendingTransaction.update({
      where: { id },
      data: { status: PendingTransactionStatus.APPROVED }
    })

    logger.info('Pending transaction approved', { id })

    return approved
  },

  /**
   * Rejects a pending transaction, excluding it from import.
   *
   * Changes the transaction status from PENDING to REJECTED. Rejected
   * transactions will not be imported and can be used to filter out
   * unwanted or erroneous entries from bank statements.
   *
   * @param {string} id - The unique identifier of the pending transaction
   * @param {string} userId - The ID of the user making the request
   * @returns {Promise<PendingTransaction>} The rejected pending transaction
   *
   * @throws {AppError} NOT_FOUND - When the transaction does not exist or is not owned by the user
   *
   * @example
   * // Reject a transaction (e.g., a fee you don't want to track)
   * const rejected = await pendingTransactionService.reject('txn-123', 'user-456');
   * console.log(rejected.status); // 'REJECTED'
   */
  async reject(id: string, userId: string) {
    logger.debug('Rejecting pending transaction', { id, userId })

    // Verify ownership
    const transaction = await prisma.pendingTransaction.findFirst({
      where: { id },
      include: {
        document: { select: { userId: true } }
      }
    })

    if (!transaction || transaction.document.userId !== userId) {
      logger.warn('Transaction not found or access denied for rejection', { id, userId })
      throw AppError.notFound('Transaction', id)
    }

    const rejected = await prisma.pendingTransaction.update({
      where: { id },
      data: { status: PendingTransactionStatus.REJECTED }
    })

    logger.info('Pending transaction rejected', { id })

    return rejected
  },

  /**
   * Performs a bulk action on multiple pending transactions.
   *
   * Supports three actions:
   * - 'approve': Sets all transactions to APPROVED status
   * - 'reject': Sets all transactions to REJECTED status
   * - 'delete': Permanently removes transactions (except those already imported)
   *
   * Only transactions owned by the user (via their parent documents) will be
   * affected. Transactions belonging to other users are silently ignored.
   *
   * @param {string[]} ids - Array of pending transaction IDs to act upon
   * @param {'approve' | 'reject' | 'delete'} action - The bulk action to perform
   * @param {string} userId - The ID of the user making the request
   * @returns {Promise<Prisma.BatchPayload>} Object containing the count of affected records
   *
   * @throws {AppError} NOT_FOUND - When no valid (user-owned) transactions are found
   *
   * @example
   * // Approve multiple transactions at once
   * const result = await pendingTransactionService.bulkAction(
   *   ['txn-1', 'txn-2', 'txn-3'],
   *   'approve',
   *   'user-456'
   * );
   * console.log(`Approved ${result.count} transactions`);
   *
   * @example
   * // Delete rejected transactions
   * const result = await pendingTransactionService.bulkAction(
   *   rejectedIds,
   *   'delete',
   *   'user-456'
   * );
   */
  async bulkAction(ids: string[], action: 'approve' | 'reject' | 'delete', userId: string) {
    logger.debug('Performing bulk action on pending transactions', {
      action,
      count: ids.length,
      userId
    })

    // Verify ownership for all transactions
    const transactions = await prisma.pendingTransaction.findMany({
      where: { id: { in: ids } },
      include: {
        document: { select: { userId: true } }
      }
    })

    const ownedIds = transactions
      .filter(t => t.document.userId === userId)
      .map(t => t.id)

    if (ownedIds.length === 0) {
      logger.warn('No valid transactions found for bulk action', { userId, requestedIds: ids })
      throw AppError.notFound('Transactions')
    }

    logger.debug('Filtered to owned transactions', {
      requested: ids.length,
      owned: ownedIds.length
    })

    if (action === 'delete') {
      const result = await prisma.pendingTransaction.deleteMany({
        where: {
          id: { in: ownedIds },
          status: { not: PendingTransactionStatus.IMPORTED }
        }
      })

      logger.info('Bulk delete completed', { deleted: result.count })
      return result
    }

    const newStatus = action === 'approve'
      ? PendingTransactionStatus.APPROVED
      : PendingTransactionStatus.REJECTED

    const result = await prisma.pendingTransaction.updateMany({
      where: {
        id: { in: ownedIds },
        status: { in: [PendingTransactionStatus.PENDING, PendingTransactionStatus.APPROVED] }
      },
      data: { status: newStatus }
    })

    logger.info('Bulk status update completed', { action, updated: result.count })

    return result
  },

  /**
   * Imports all approved pending transactions from a document into the main transaction ledger.
   *
   * For each approved transaction:
   * 1. Creates a new Transaction record with the final category, type, and other details
   * 2. Updates the pending transaction status to IMPORTED
   * 3. Links the pending transaction to the newly created transaction
   *
   * After all transactions are imported, the parent document status is updated to 'IMPORTED'.
   *
   * @param {string} documentId - The unique identifier of the bank document
   * @param {string} userId - The ID of the user making the request
   * @param {string} [budgetId] - Optional budget ID to associate with imported transactions
   * @returns {Promise<{importedCount: number, transactionIds: string[]}>} Import result summary
   *
   * @throws {AppError} NOT_FOUND - When the document does not exist or is not owned by the user
   * @throws {AppError} VALIDATION_ERROR - When there are no approved transactions to import
   *
   * @example
   * // Import approved transactions without a budget
   * const result = await pendingTransactionService.importApproved(
   *   'doc-123',
   *   'user-456'
   * );
   * console.log(`Imported ${result.importedCount} transactions`);
   *
   * @example
   * // Import approved transactions into a specific budget
   * const result = await pendingTransactionService.importApproved(
   *   'doc-123',
   *   'user-456',
   *   'budget-789'
   * );
   * console.log(`Transaction IDs: ${result.transactionIds.join(', ')}`);
   */
  async importApproved(documentId: string, userId: string, budgetId?: string) {
    logger.debug('Starting import of approved transactions', { documentId, userId, budgetId })

    // Verify document ownership
    const document = await prisma.bankDocument.findFirst({
      where: { id: documentId, userId }
    })

    if (!document) {
      logger.warn('Document not found for import', { documentId, userId })
      throw AppError.notFound('Document', documentId)
    }

    // Get approved transactions
    const approved = await prisma.pendingTransaction.findMany({
      where: {
        documentId,
        status: PendingTransactionStatus.APPROVED
      }
    })

    if (approved.length === 0) {
      logger.warn('No approved transactions to import', { documentId })
      throw AppError.validation('No approved transactions to import', { documentId })
    }

    logger.info('Found approved transactions for import', {
      documentId,
      count: approved.length
    })

    const imported: string[] = []

    for (const pending of approved) {
      // Create transaction
      const finalCategory = pending.userCategory || pending.category || 'Other'
      const finalType = pending.type === 'EXPENSE' ? 'expense' : 'income'

      const transaction = await prisma.transaction.create({
        data: {
          description: pending.description,
          amount: pending.amount,
          type: finalType,
          category: finalCategory,
          date: pending.date,
          budgetId,
          userId
        }
      })

      // Update pending transaction
      await prisma.pendingTransaction.update({
        where: { id: pending.id },
        data: {
          status: PendingTransactionStatus.IMPORTED,
          importedTransactionId: transaction.id
        }
      })

      imported.push(transaction.id)

      logger.debug('Imported pending transaction', {
        pendingId: pending.id,
        transactionId: transaction.id
      })
    }

    // Update document status
    await prisma.bankDocument.update({
      where: { id: documentId },
      data: { status: 'IMPORTED' }
    })

    logger.info('Import completed', {
      documentId,
      importedCount: imported.length,
      transactionIds: imported
    })

    return {
      importedCount: imported.length,
      transactionIds: imported
    }
  },

  /**
   * Checks pending transactions in a document for duplicates against existing transactions.
   *
   * A transaction is considered a duplicate if an existing transaction exists with:
   * - The same date
   * - The same amount (within $0.01 tolerance for floating-point precision)
   *
   * When duplicates are found:
   * 1. The pending transaction status is changed to DUPLICATE
   * 2. The duplicateOfId field is set to the matching transaction's ID
   *
   * This helps users avoid importing the same transactions multiple times
   * when uploading overlapping statement periods.
   *
   * @param {string} documentId - The unique identifier of the bank document
   * @param {string} userId - The ID of the user making the request
   * @returns {Promise<{totalChecked: number, duplicatesFound: number, duplicates: Array}>} Duplicate check results
   *
   * @throws {AppError} NOT_FOUND - When the document does not exist or is not owned by the user
   *
   * @example
   * // Check for duplicates before importing
   * const result = await pendingTransactionService.checkDuplicates(
   *   'doc-123',
   *   'user-456'
   * );
   *
   * if (result.duplicatesFound > 0) {
   *   console.log(`Found ${result.duplicatesFound} potential duplicates:`);
   *   result.duplicates.forEach(dup => {
   *     console.log(`  - "${dup.pendingDescription}" matches transaction ${dup.matchedTransactionId}`);
   *   });
   * }
   */
  async checkDuplicates(documentId: string, userId: string) {
    logger.debug('Checking for duplicate transactions', { documentId, userId })

    // Verify document ownership
    const document = await prisma.bankDocument.findFirst({
      where: { id: documentId, userId }
    })

    if (!document) {
      logger.warn('Document not found for duplicate check', { documentId, userId })
      throw AppError.notFound('Document', documentId)
    }

    // Get pending transactions
    const pending = await prisma.pendingTransaction.findMany({
      where: {
        documentId,
        status: PendingTransactionStatus.PENDING
      }
    })

    logger.debug('Checking pending transactions for duplicates', { count: pending.length })

    const duplicates: Array<{
      pendingId: string
      pendingDescription: string
      matchedTransactionId: string
    }> = []

    for (const p of pending) {
      // Check for exact matches
      const match = await prisma.transaction.findFirst({
        where: {
          userId,
          date: p.date,
          amount: {
            gte: Number(p.amount) - 0.01,
            lte: Number(p.amount) + 0.01
          }
        }
      })

      if (match) {
        duplicates.push({
          pendingId: p.id,
          pendingDescription: p.description,
          matchedTransactionId: match.id
        })

        // Mark as duplicate
        await prisma.pendingTransaction.update({
          where: { id: p.id },
          data: {
            status: PendingTransactionStatus.DUPLICATE,
            duplicateOfId: match.id
          }
        })

        logger.debug('Found duplicate transaction', {
          pendingId: p.id,
          matchedId: match.id
        })
      }
    }

    logger.info('Duplicate check completed', {
      documentId,
      totalChecked: pending.length,
      duplicatesFound: duplicates.length
    })

    return {
      totalChecked: pending.length,
      duplicatesFound: duplicates.length,
      duplicates
    }
  }
}
