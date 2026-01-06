import { prisma } from '../lib/prisma.js'
import { PendingTransactionStatus, Prisma } from '@prisma/client'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

export interface UpdateTransactionData {
  category?: string
  description?: string
  amount?: number
  type?: string
  notes?: string
}

export const pendingTransactionService = {
  async getByDocument(documentId: string, userId: string) {
    // Verify document ownership
    const document = await prisma.bankDocument.findFirst({
      where: { id: documentId, userId }
    })

    if (!document) {
      throw new Error('Document not found')
    }

    return prisma.pendingTransaction.findMany({
      where: { documentId },
      orderBy: [{ date: 'asc' }, { lineNumber: 'asc' }]
    })
  },

  async update(id: string, userId: string, data: UpdateTransactionData) {
    // Verify ownership through document
    const transaction = await prisma.pendingTransaction.findFirst({
      where: { id },
      include: {
        document: { select: { userId: true } }
      }
    })

    if (!transaction || transaction.document.userId !== userId) {
      throw new Error('Transaction not found')
    }

    if (transaction.status === PendingTransactionStatus.IMPORTED) {
      throw new Error('Cannot modify imported transaction')
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

    return prisma.pendingTransaction.update({
      where: { id },
      data: updateData
    })
  },

  async approve(id: string, userId: string) {
    // Verify ownership
    const transaction = await prisma.pendingTransaction.findFirst({
      where: { id },
      include: {
        document: { select: { userId: true } }
      }
    })

    if (!transaction || transaction.document.userId !== userId) {
      throw new Error('Transaction not found')
    }

    return prisma.pendingTransaction.update({
      where: { id },
      data: { status: PendingTransactionStatus.APPROVED }
    })
  },

  async reject(id: string, userId: string) {
    // Verify ownership
    const transaction = await prisma.pendingTransaction.findFirst({
      where: { id },
      include: {
        document: { select: { userId: true } }
      }
    })

    if (!transaction || transaction.document.userId !== userId) {
      throw new Error('Transaction not found')
    }

    return prisma.pendingTransaction.update({
      where: { id },
      data: { status: PendingTransactionStatus.REJECTED }
    })
  },

  async bulkAction(ids: string[], action: 'approve' | 'reject' | 'delete', userId: string) {
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
      throw new Error('No valid transactions found')
    }

    if (action === 'delete') {
      return prisma.pendingTransaction.deleteMany({
        where: {
          id: { in: ownedIds },
          status: { not: PendingTransactionStatus.IMPORTED }
        }
      })
    }

    const newStatus = action === 'approve'
      ? PendingTransactionStatus.APPROVED
      : PendingTransactionStatus.REJECTED

    return prisma.pendingTransaction.updateMany({
      where: {
        id: { in: ownedIds },
        status: { in: [PendingTransactionStatus.PENDING, PendingTransactionStatus.APPROVED] }
      },
      data: { status: newStatus }
    })
  },

  async importApproved(documentId: string, userId: string, budgetId?: string) {
    // Verify document ownership
    const document = await prisma.bankDocument.findFirst({
      where: { id: documentId, userId }
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Get approved transactions
    const approved = await prisma.pendingTransaction.findMany({
      where: {
        documentId,
        status: PendingTransactionStatus.APPROVED
      }
    })

    if (approved.length === 0) {
      throw new Error('No approved transactions to import')
    }

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
    }

    // Update document status
    await prisma.bankDocument.update({
      where: { id: documentId },
      data: { status: 'IMPORTED' }
    })

    return {
      importedCount: imported.length,
      transactionIds: imported
    }
  },

  async checkDuplicates(documentId: string, userId: string) {
    // Verify document ownership
    const document = await prisma.bankDocument.findFirst({
      where: { id: documentId, userId }
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Get pending transactions
    const pending = await prisma.pendingTransaction.findMany({
      where: {
        documentId,
        status: PendingTransactionStatus.PENDING
      }
    })

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
      }
    }

    return {
      totalChecked: pending.length,
      duplicatesFound: duplicates.length,
      duplicates
    }
  }
}
