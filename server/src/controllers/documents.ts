import { Response } from 'express'
import { documentService } from '../services/documents.js'
import { pendingTransactionService } from '../services/pending-transactions.js'
import { AuthRequest } from '../middleware/auth.js'

export const documentController = {
  // LLM Providers
  async getProviders(req: AuthRequest, res: Response) {
    try {
      const providers = await documentService.getProviders()
      res.json(providers)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch providers. Is AI service running?' })
    }
  },

  // Document management
  async getAll(req: AuthRequest, res: Response) {
    try {
      const documents = await documentService.getAll(req.userId!)
      res.json(documents)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch documents' })
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const result = await documentService.getById(req.params.id, req.userId!)
      if (!result) {
        res.status(404).json({ message: 'Document not found' })
        return
      }
      res.json(result)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch document' })
    }
  },

  async upload(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' })
        return
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
      const message = error instanceof Error ? error.message : 'Failed to upload document'
      res.status(400).json({ message })
    }
  },

  async process(req: AuthRequest, res: Response) {
    try {
      const { llmProvider } = req.body
      const result = await documentService.processDocument(req.params.id, req.userId!, llmProvider)
      res.json(result)
    } catch (error) {
      console.error('Process document error:', error)
      const message = error instanceof Error ? error.message : 'Failed to process document'
      res.status(400).json({ message })
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      await documentService.delete(req.params.id, req.userId!)
      res.status(204).send()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete document'
      res.status(400).json({ message })
    }
  },

  async getSummary(req: AuthRequest, res: Response) {
    try {
      const summary = await documentService.getDocumentSummary(req.params.id)
      res.json(summary)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch summary' })
    }
  },

  // Transaction review
  async updateTransaction(req: AuthRequest, res: Response) {
    try {
      const transaction = await pendingTransactionService.update(
        req.params.transactionId,
        req.userId!,
        req.body
      )
      res.json(transaction)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update transaction'
      res.status(400).json({ message })
    }
  },

  async approveTransaction(req: AuthRequest, res: Response) {
    try {
      const transaction = await pendingTransactionService.approve(
        req.params.transactionId,
        req.userId!
      )
      res.json(transaction)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve transaction'
      res.status(400).json({ message })
    }
  },

  async rejectTransaction(req: AuthRequest, res: Response) {
    try {
      const transaction = await pendingTransactionService.reject(
        req.params.transactionId,
        req.userId!
      )
      res.json(transaction)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject transaction'
      res.status(400).json({ message })
    }
  },

  async bulkAction(req: AuthRequest, res: Response) {
    try {
      const { transactionIds, action } = req.body

      if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
        res.status(400).json({ message: 'transactionIds array is required' })
        return
      }

      if (!['approve', 'reject', 'delete'].includes(action)) {
        res.status(400).json({ message: 'Invalid action. Use approve, reject, or delete' })
        return
      }

      const result = await pendingTransactionService.bulkAction(
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
      const message = error instanceof Error ? error.message : 'Failed to process bulk action'
      res.status(400).json({ message })
    }
  },

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
      const message = error instanceof Error ? error.message : 'Failed to import transactions'
      res.status(400).json({ message })
    }
  },

  async checkDuplicates(req: AuthRequest, res: Response) {
    try {
      const result = await pendingTransactionService.checkDuplicates(
        req.params.id,
        req.userId!
      )
      res.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check duplicates'
      res.status(400).json({ message })
    }
  }
}
