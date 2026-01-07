/**
 * @fileoverview Transactions management page component for the Budget App.
 *
 * This page provides a tabular view of all user transactions (income and expenses)
 * with full CRUD capabilities. Transactions are the core financial records that
 * track money flow and are linked to categories for spending analysis.
 *
 * Features:
 * - Tabular display with date, description, category, and amount columns
 * - Color-coded amounts (green for income, red for expenses)
 * - Create new transactions via modal form
 * - Inline edit and delete actions
 * - Category badges for visual categorization
 *
 * @module pages/Transactions
 */

import { useEffect, useState } from 'react'
import api from '../services/api'
import { Transaction } from '../types'
import TransactionForm from '../components/TransactionForm'

/**
 * Transactions page component for managing financial records.
 *
 * This component displays all user transactions in a sortable table format
 * and provides create, edit, and delete functionality. Transactions are
 * fetched on mount and the list is refreshed after any modification.
 *
 * State Management:
 * - transactions: Array of all user transactions from API
 * - showForm: Controls the transaction form modal visibility
 * - editingTransaction: Transaction being edited (null for create mode)
 *
 * @component
 * @returns {JSX.Element} The rendered Transactions page with table and form modal
 *
 * @example
 * // Used in router configuration
 * <Route path="/transactions" element={<Transactions />} />
 */
export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  /**
   * Fetches all transactions for the current user from the API.
   * Called on component mount and after successful create/edit operations.
   */
  const fetchTransactions = async () => {
    try {
      const response = await api.get('/finance/transactions')
      setTransactions(response.data)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch on component mount
  useEffect(() => {
    fetchTransactions()
  }, [])

  /** Opens the form in create mode (no transaction selected) */
  const handleCreate = () => {
    setEditingTransaction(null)
    setShowForm(true)
  }

  /** Opens the form in edit mode with the selected transaction */
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  /**
   * Deletes a transaction after user confirmation.
   * Uses optimistic UI update by filtering local state immediately.
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return
    try {
      await api.delete(`/finance/transactions/${id}`)
      // Optimistic update: remove from local state
      setTransactions(transactions.filter((t) => t.id !== id))
    } catch (error) {
      console.error('Failed to delete transaction:', error)
    }
  }

  /** Closes the form modal and resets editing state */
  const handleFormClose = () => {
    setShowForm(false)
    setEditingTransaction(null)
  }

  /** Handles successful form submission by closing form and refreshing data */
  const handleFormSuccess = () => {
    handleFormClose()
    fetchTransactions()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          + Add Transaction
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No transactions yet. Add your first transaction!</p>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Add Transaction
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-600 dark:text-gray-200 rounded-full">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {transaction.type === 'income' ? '+' : '-'}$
                      {Number(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}
