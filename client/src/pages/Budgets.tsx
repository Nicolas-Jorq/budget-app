/**
 * @fileoverview Budgets management page component for the Budget App.
 *
 * This page allows users to view, create, edit, and delete their budgets.
 * Budgets represent spending limits for different categories (e.g., groceries,
 * entertainment, utilities) and help users track their spending against
 * planned allocations.
 *
 * Features:
 * - Display all user budgets in a responsive grid layout
 * - Create new budgets via modal form
 * - Edit existing budgets
 * - Delete budgets with confirmation
 * - Empty state for users with no budgets
 *
 * @module pages/Budgets
 */

import { useEffect, useState } from 'react'
import api from '../services/api'
import { Budget } from '../types'
import BudgetCard from '../components/BudgetCard'
import BudgetForm from '../components/BudgetForm'

/**
 * Budgets page component for managing user budget allocations.
 *
 * This component implements a complete CRUD interface for budgets.
 * It maintains local state that syncs with the backend API and
 * provides optimistic updates for delete operations.
 *
 * State Management:
 * - budgets: Array of all user budgets fetched from API
 * - showForm: Controls visibility of the create/edit modal
 * - editingBudget: The budget being edited (null for create mode)
 *
 * @component
 * @returns {JSX.Element} The rendered Budgets management page
 *
 * @example
 * // Used in router configuration
 * <Route path="/budgets" element={<Budgets />} />
 */
export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  /**
   * Fetches all budgets for the current user from the API.
   * Called on component mount and after successful form submissions.
   */
  const fetchBudgets = async () => {
    try {
      const response = await api.get('/budgets')
      setBudgets(response.data)
    } catch (error) {
      console.error('Failed to fetch budgets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch on component mount
  useEffect(() => {
    fetchBudgets()
  }, [])

  /** Opens the form in create mode (no budget selected for editing) */
  const handleCreate = () => {
    setEditingBudget(null)
    setShowForm(true)
  }

  /** Opens the form in edit mode with the selected budget */
  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setShowForm(true)
  }

  /**
   * Deletes a budget after user confirmation.
   * Uses optimistic UI update by filtering the local state immediately.
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return
    try {
      await api.delete(`/budgets/${id}`)
      // Optimistic update: remove from local state without refetching
      setBudgets(budgets.filter((b) => b.id !== id))
    } catch (error) {
      console.error('Failed to delete budget:', error)
    }
  }

  /** Closes the form modal and resets editing state */
  const handleFormClose = () => {
    setShowForm(false)
    setEditingBudget(null)
  }

  /** Handles successful form submission by closing form and refreshing data */
  const handleFormSuccess = () => {
    handleFormClose()
    fetchBudgets()
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          + Add Budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No budgets yet. Create your first budget to get started!</p>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Create Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={() => handleEdit(budget)}
              onDelete={() => handleDelete(budget.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <BudgetForm
          budget={editingBudget}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}
