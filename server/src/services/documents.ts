import { prisma } from '../lib/prisma.js'
import { DocumentStatus, PendingTransactionStatus } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'
import axios from 'axios'
import FormData from 'form-data'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/budget-app-uploads'

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

export interface DocumentWithTransactions {
  document: {
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
    bankAccount: {
      id: string
      name: string
      bankName: string
    } | null
  }
  transactions: Array<{
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
  }>
}

export const documentService = {
  async getAll(userId: string) {
    return prisma.bankDocument.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
      include: {
        bankAccount: {
          select: { id: true, name: true, bankName: true }
        }
      }
    })
  },

  async getById(id: string, userId: string) {
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
      return null
    }

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

  async delete(id: string, userId: string) {
    // Verify ownership
    const existing = await prisma.bankDocument.findFirst({
      where: { id, userId }
    })

    if (!existing) {
      throw new Error('Document not found')
    }

    // Delete pending transactions first
    await prisma.pendingTransaction.deleteMany({
      where: { documentId: id }
    })

    // Delete document
    return prisma.bankDocument.delete({
      where: { id }
    })
  },

  // Proxy methods to AI service
  async getProviders(): Promise<any> {
    const response = await axios.get(`${AI_SERVICE_URL}/api/documents/providers`)
    return response.data
  },

  async uploadDocument(
    file: Buffer,
    filename: string,
    userId: string,
    bankAccountId?: string
  ): Promise<any> {
    // Generate unique file ID and save locally
    const fileId = randomUUID()
    const storedFilename = `${fileId}.pdf`
    const filePath = path.join(UPLOAD_DIR, storedFilename)

    // Save file to disk
    fs.writeFileSync(filePath, file)

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

    return {
      success: true,
      document_id: document.id,
      filename: filename,
      size: file.length,
      status: 'PENDING',
      message: 'Document uploaded. Call /process to extract transactions.'
    }
  },

  async processDocument(documentId: string, userId: string, llmProvider?: string): Promise<any> {
    // Get document from database
    const document = await prisma.bankDocument.findFirst({
      where: { id: documentId, userId }
    })

    if (!document) {
      throw new Error('Document not found')
    }

    if (!['PENDING', 'FAILED'].includes(document.status)) {
      throw new Error(`Document already processed (status: ${document.status})`)
    }

    // Update status to processing
    await prisma.bankDocument.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' }
    })

    try {
      // Read file from disk
      const fileBuffer = fs.readFileSync(document.filePath)

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
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      // Mark document as failed
      await prisma.bankDocument.update({
        where: { id: documentId },
        data: {
          status: 'FAILED',
          processingError: errorMessage
        }
      })
      throw new Error(errorMessage)
    }
  },

  async getDocumentSummary(documentId: string): Promise<any> {
    const response = await axios.get(`${AI_SERVICE_URL}/api/transactions/summary/${documentId}`)
    return response.data
  }
}
