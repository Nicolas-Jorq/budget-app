/**
 * @fileoverview Bank Statements management page for document upload and processing.
 *
 * This page enables users to upload bank statement PDFs and have them processed
 * by AI (LLM) to extract transactions automatically. It provides a complete
 * workflow for managing bank accounts, uploading documents, and tracking
 * processing status.
 *
 * Features:
 * - Bank account management (create accounts for different banks/cards)
 * - PDF statement upload with optional account association
 * - AI provider selection for document processing
 * - Document list with status indicators
 * - Processing triggers for pending/failed documents
 * - Navigation to document review page
 *
 * Document Processing Flow:
 * 1. User uploads PDF statement
 * 2. Document is stored with PENDING status
 * 3. AI provider extracts transactions from PDF
 * 4. Status updates to PROCESSED with transaction count
 * 5. User reviews and imports transactions
 *
 * @module pages/BankStatements
 */

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  BankAccount,
  BankDocument,
  LLMProvider,
  ACCOUNT_TYPE_INFO,
  DOCUMENT_STATUS_INFO,
  AccountType,
} from '../types'

/**
 * Bank Statements page component for managing bank statement uploads.
 *
 * This component provides the primary interface for uploading bank statements
 * and managing the document processing workflow. It integrates with multiple
 * AI providers for intelligent transaction extraction.
 *
 * State Management:
 * - documents: Array of uploaded bank documents
 * - bankAccounts: User's configured bank accounts
 * - providers: Available AI/LLM providers for processing
 * - showUpload/showAddAccount: Modal visibility states
 * - uploadState: Current state of upload process ('idle', 'uploading', 'processing')
 * - Form states for file selection and account creation
 *
 * @component
 * @returns {JSX.Element} The rendered Bank Statements management page
 *
 * @example
 * // Used in router configuration
 * <Route path="/bank-statements" element={<BankStatements />} />
 */
export default function BankStatements() {
  const [documents, setDocuments] = useState<BankDocument[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing'>('idle')
  const [uploadProgress, setUploadProgress] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [selectedProvider, setSelectedProvider] = useState<string>('')

  // New account form
  const [newAccount, setNewAccount] = useState({
    name: '',
    bankName: '',
    accountType: 'CREDIT_CARD' as AccountType,
    lastFour: '',
  })

  /**
   * Fetches all data required for the bank statements page.
   * Uses useCallback to prevent unnecessary re-renders.
   * Makes parallel API requests with graceful error handling.
   */
  const fetchData = useCallback(async () => {
    try {
      // Parallel fetch for documents, accounts, and AI providers
      const [docsRes, accountsRes, providersRes] = await Promise.all([
        api.get('/documents'),
        api.get('/bank-accounts'),
        // Providers endpoint may not exist in all deployments
        api.get('/documents/providers').catch(() => ({ data: { providers: [] } })),
      ])
      setDocuments(docsRes.data)
      setBankAccounts(accountsRes.data)
      setProviders(providersRes.data.providers || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial data fetch on component mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  /**
   * Handles file input change event.
   * Validates that selected file is a PDF before accepting.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      alert('Please select a PDF file')
    }
  }

  /**
   * Handles the complete upload and processing workflow.
   * Two-step process: upload file, then trigger AI processing.
   */
  const handleUpload = async () => {
    if (!selectedFile) return

    setUploadState('uploading')
    setUploadProgress('Uploading document...')

    try {
      // Step 1: Upload the PDF file
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (selectedAccount) {
        formData.append('bankAccountId', selectedAccount)
      }

      const uploadRes = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const documentId = uploadRes.data.document_id

      // Step 2: Trigger AI processing
      setUploadState('processing')
      setUploadProgress('Processing with AI... This may take a minute.')

      const processRes = await api.post(`/documents/${documentId}/process`, {
        llmProvider: selectedProvider || undefined,
      })

      setUploadProgress(
        `Extracted ${processRes.data.transaction_count} transactions using ${processRes.data.provider}`
      )

      // Refresh documents list to show new document
      await fetchData()

      // Reset form after brief delay to show success message
      setTimeout(() => {
        setShowUpload(false)
        setSelectedFile(null)
        setSelectedAccount('')
        setSelectedProvider('')
        setUploadState('idle')
        setUploadProgress('')
      }, 2000)
    } catch (error: any) {
      console.error('Upload failed:', error)
      setUploadProgress(`Error: ${error.response?.data?.message || 'Upload failed'}`)
      setUploadState('idle')
    }
  }

  /**
   * Handles form submission for adding a new bank account.
   * Resets form and refreshes account list on success.
   */
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/bank-accounts', newAccount)
      await fetchData()
      setShowAddAccount(false)
      // Reset form to default values
      setNewAccount({
        name: '',
        bankName: '',
        accountType: 'CREDIT_CARD',
        lastFour: '',
      })
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add account')
    }
  }

  /**
   * Formats file size in bytes to human-readable string.
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size (e.g., "1.5 MB")
   */
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  /**
   * Triggers AI processing for a pending or failed document.
   * Uses optimistic UI update to show processing state immediately.
   */
  const handleProcessDocument = async (docId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      // Optimistic update: show processing status immediately
      setDocuments(docs =>
        docs.map(d => d.id === docId ? { ...d, status: 'PROCESSING' as const } : d)
      )

      await api.post(`/documents/${docId}/process`, {
        llmProvider: selectedProvider || undefined,
      })

      // Refresh to get actual status and transaction count
      await fetchData()
    } catch (error: any) {
      console.error('Process failed:', error)
      alert(error.response?.data?.message || 'Processing failed')
      await fetchData() // Refresh to get actual status
    }
  }

  /**
   * Deletes a document after user confirmation.
   * Refreshes the document list on success.
   */
  const handleDeleteDocument = async (docId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Delete this document?')) return

    try {
      await api.delete(`/documents/${docId}`)
      await fetchData()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Delete failed')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bank Statements</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddAccount(true)}
            className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Add Account
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Upload Statement
          </button>
        </div>
      </div>

      {/* Bank Accounts Section */}
      {bankAccounts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Your Accounts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bankAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span className="text-2xl">{ACCOUNT_TYPE_INFO[account.accountType].icon}</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{account.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {account.bankName}
                    {account.lastFour && ` •••• ${account.lastFour}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LLM Provider Status */}
      {providers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            AI Providers
          </h2>
          <div className="flex flex-wrap gap-2">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`px-3 py-1 rounded-full text-sm ${
                  provider.available
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {provider.name} {provider.available ? '✓' : '○'}
              </div>
            ))}
          </div>
          {!providers.some((p) => p.available) && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              No AI provider available. Install Ollama for local processing or configure OpenAI.
            </p>
          )}
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Uploaded Documents
          </h2>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">📄</div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No bank statements uploaded yet
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Upload your first statement
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <Link
                  to={`/bank-statements/${doc.id}`}
                  className="flex items-center gap-4 flex-1"
                >
                  <div className="text-3xl">📄</div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {doc.originalName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(doc.fileSize)} •{' '}
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                      {doc.bankAccount && ` • ${doc.bankAccount.name}`}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  {doc.transactionCount !== null && doc.transactionCount > 0 && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {doc.transactionCount} transactions
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded text-xs text-white ${DOCUMENT_STATUS_INFO[doc.status].color}`}
                  >
                    {DOCUMENT_STATUS_INFO[doc.status].label}
                  </span>
                  {/* Action buttons */}
                  {(doc.status === 'PENDING' || doc.status === 'FAILED') && (
                    <button
                      onClick={(e) => handleProcessDocument(doc.id, e)}
                      className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
                    >
                      Process
                    </button>
                  )}
                  {doc.status === 'PROCESSING' && (
                    <span className="text-sm text-gray-500 animate-pulse">Processing...</span>
                  )}
                  <button
                    onClick={(e) => handleDeleteDocument(doc.id, e)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Upload Bank Statement
            </h2>

            {uploadState === 'idle' ? (
              <>
                {/* File Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    PDF Statement
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {selectedFile && (
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>

                {/* Bank Account Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bank Account (Optional)
                  </label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select an account...</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.bankName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* LLM Provider Selector */}
                {providers.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      AI Provider
                    </label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Auto-detect best available</option>
                      {providers
                        .filter((p) => p.available)
                        .map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowUpload(false)
                      setSelectedFile(null)
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Upload & Process
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">{uploadProgress}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Add Bank Account
            </h2>

            <form onSubmit={handleAddAccount}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    placeholder="e.g., Chase Freedom"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={newAccount.bankName}
                    onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                    placeholder="e.g., Chase"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Type
                  </label>
                  <select
                    value={newAccount.accountType}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, accountType: e.target.value as AccountType })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {Object.entries(ACCOUNT_TYPE_INFO).map(([type, info]) => (
                      <option key={type} value={type}>
                        {info.icon} {info.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last 4 Digits (Optional)
                  </label>
                  <input
                    type="text"
                    value={newAccount.lastFour}
                    onChange={(e) => setNewAccount({ ...newAccount, lastFour: e.target.value })}
                    placeholder="1234"
                    maxLength={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddAccount(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
