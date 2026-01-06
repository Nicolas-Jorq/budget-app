import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import {
  DocumentWithTransactions,
  PendingTransaction,
  DOCUMENT_STATUS_INFO,
  TRANSACTION_STATUS_INFO,
} from '../types'

const CATEGORIES = [
  'Groceries',
  'Dining',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Subscriptions',
  'Travel',
  'Housing',
  'Insurance',
  'Education',
  'Personal Care',
  'Gifts & Donations',
  'Income',
  'Transfer',
  'Fees & Charges',
  'Other',
]

export default function DocumentReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<DocumentWithTransactions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<PendingTransaction>>({})

  const fetchData = useCallback(async () => {
    if (!id) return
    try {
      const res = await api.get(`/documents/${id}`)
      setData(res.data)
    } catch (error) {
      console.error('Failed to fetch document:', error)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSelectAll = () => {
    if (!data) return
    const pendingTxns = data.transactions.filter((t) => t.status === 'PENDING')
    if (selectedIds.size === pendingTxns.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingTxns.map((t) => t.id)))
    }
  }

  const handleToggleSelect = (txnId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(txnId)) {
      newSelected.delete(txnId)
    } else {
      newSelected.add(txnId)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedIds.size === 0) return
    setIsProcessing(true)
    try {
      await api.post(`/documents/${id}/transactions/bulk`, {
        transactionIds: Array.from(selectedIds),
        action,
      })
      setSelectedIds(new Set())
      await fetchData()
    } catch (error) {
      console.error('Bulk action failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApprove = async (txnId: string) => {
    try {
      await api.post(`/documents/${id}/transactions/${txnId}/approve`)
      await fetchData()
    } catch (error) {
      console.error('Approve failed:', error)
    }
  }

  const handleReject = async (txnId: string) => {
    try {
      await api.post(`/documents/${id}/transactions/${txnId}/reject`)
      await fetchData()
    } catch (error) {
      console.error('Reject failed:', error)
    }
  }

  const handleCheckDuplicates = async () => {
    setIsProcessing(true)
    try {
      const res = await api.post(`/documents/${id}/check-duplicates`)
      if (res.data.duplicatesFound > 0) {
        alert(`Found ${res.data.duplicatesFound} potential duplicates. They have been marked.`)
      } else {
        alert('No duplicates found.')
      }
      await fetchData()
    } catch (error) {
      console.error('Duplicate check failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    setIsProcessing(true)
    try {
      const res = await api.post(`/documents/${id}/import`)
      alert(`Successfully imported ${res.data.importedCount} transactions!`)
      await fetchData()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Import failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const startEdit = (txn: PendingTransaction) => {
    setEditingId(txn.id)
    setEditForm({
      description: txn.description,
      amount: txn.amount,
      category: txn.userCategory || txn.category,
      type: txn.type,
    })
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      await api.put(`/documents/${id}/transactions/${editingId}`, editForm)
      setEditingId(null)
      setEditForm({})
      await fetchData()
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Document not found</p>
        <Link
          to="/bank-statements"
          className="text-primary-600 dark:text-primary-400 hover:underline"
        >
          Back to Bank Statements
        </Link>
      </div>
    )
  }

  const { document: doc, transactions } = data
  const pendingCount = transactions.filter((t) => t.status === 'PENDING').length
  const approvedCount = transactions.filter((t) => t.status === 'APPROVED').length
  const rejectedCount = transactions.filter((t) => t.status === 'REJECTED').length
  const duplicateCount = transactions.filter((t) => t.status === 'DUPLICATE').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/bank-statements"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-2 inline-block"
          >
            &larr; Back to Bank Statements
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{doc.originalName}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span
              className={`px-2 py-1 rounded text-xs text-white ${DOCUMENT_STATUS_INFO[doc.status].color}`}
            >
              {DOCUMENT_STATUS_INFO[doc.status].label}
            </span>
            {doc.llmProvider && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Processed by {doc.llmProvider}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {transactions.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Approved</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Rejected</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{duplicateCount}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Duplicates</div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCheckDuplicates}
            disabled={isProcessing}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Check Duplicates
          </button>

          {selectedIds.size > 0 && (
            <>
              <button
                onClick={() => handleBulkAction('approve')}
                disabled={isProcessing}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Approve Selected ({selectedIds.size})
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                disabled={isProcessing}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject Selected
              </button>
            </>
          )}

          {approvedCount > 0 && doc.status !== 'IMPORTED' && (
            <button
              onClick={handleImport}
              disabled={isProcessing}
              className="ml-auto px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              Import {approvedCount} Transactions
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === pendingCount && pendingCount > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                Amount
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((txn) => (
              <tr
                key={txn.id}
                className={`${
                  txn.status === 'DUPLICATE' || txn.status === 'REJECTED'
                    ? 'opacity-50'
                    : ''
                }`}
              >
                <td className="px-4 py-3">
                  {txn.status === 'PENDING' && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(txn.id)}
                      onChange={() => handleToggleSelect(txn.id)}
                      className="rounded"
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                  {new Date(txn.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {editingId === txn.id ? (
                    <input
                      type="text"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <div>
                      <div className="text-sm text-gray-900 dark:text-white">{txn.description}</div>
                      {txn.originalDescription && txn.originalDescription !== txn.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {txn.originalDescription}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === txn.id ? (
                    <select
                      value={editForm.category || ''}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {txn.userCategory || txn.category || 'Uncategorized'}
                      </span>
                      {txn.confidence !== null && (
                        <span className="text-xs text-gray-400">
                          ({Math.round(txn.confidence * 100)}%)
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === txn.id ? (
                    <input
                      type="number"
                      value={editForm.amount || 0}
                      onChange={(e) =>
                        setEditForm({ ...editForm, amount: parseFloat(e.target.value) })
                      }
                      step="0.01"
                      className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                    />
                  ) : (
                    <span
                      className={`text-sm font-medium ${
                        txn.type === 'INCOME'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {txn.type === 'INCOME' ? '+' : '-'}${txn.amount.toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs text-white ${
                      TRANSACTION_STATUS_INFO[txn.status].color
                    }`}
                  >
                    {TRANSACTION_STATUS_INFO[txn.status].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {editingId === txn.id ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {txn.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => startEdit(txn)}
                              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleApprove(txn.id)}
                              className="p-1 text-green-500 hover:text-green-700"
                              title="Approve"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleReject(txn.id)}
                              className="p-1 text-red-500 hover:text-red-700"
                              title="Reject"
                            >
                              ✗
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {transactions.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No transactions extracted from this document
          </div>
        )}
      </div>
    </div>
  )
}
