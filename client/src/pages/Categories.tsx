/**
 * @fileoverview Categories management page component.
 *
 * This page allows users to view, create, edit, and delete their categories.
 * Categories are used to organize transactions and budgets into meaningful groups.
 *
 * Features:
 * - Display categories grouped by type (Expense, Income)
 * - Create new categories with name, type, and color
 * - Edit existing categories
 * - Delete custom categories (default categories can be deleted too)
 * - Reset all categories to defaults
 *
 * @module pages/Categories
 */

import { useState } from 'react'
import { useCategories } from '../hooks/useCategories'
import { Category } from '../types'
import CategoryForm from '../components/CategoryForm'
import api from '../services/api'

/**
 * Categories page component for managing user category configurations.
 */
export default function Categories() {
  const { categories, expenseCategories, incomeCategories, isLoading, refetch } = useCategories()
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  const handleCreate = () => {
    setEditingCategory(null)
    setShowForm(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      await api.delete(`/finance/categories/${id}`)
      refetch()
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category')
    }
  }

  const handleReset = async () => {
    if (!confirm('This will delete all your categories and restore the defaults. Continue?')) return
    setIsResetting(true)
    try {
      await api.post('/finance/categories/reset')
      refetch()
    } catch (error) {
      console.error('Failed to reset categories:', error)
      alert('Failed to reset categories')
    } finally {
      setIsResetting(false)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingCategory(null)
  }

  const handleFormSuccess = () => {
    handleFormClose()
    refetch()
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {isResetting ? 'Resetting...' : 'Reset to Defaults'}
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            + Add Category
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No categories yet. Create your first category or reset to defaults!
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Load Defaults
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Create Category
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Expense Categories */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              Expense Categories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {expenseCategories.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  onEdit={() => handleEdit(category)}
                  onDelete={() => handleDelete(category.id)}
                />
              ))}
            </div>
          </div>

          {/* Income Categories */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              Income Categories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {incomeCategories.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  onEdit={() => handleEdit(category)}
                  onDelete={() => handleDelete(category.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <CategoryForm
          category={editingCategory}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}

/**
 * Individual category item component.
 */
interface CategoryItemProps {
  category: Category
  onEdit: () => void
  onDelete: () => void
}

function CategoryItem({ category, onEdit, onDelete }: CategoryItemProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: category.color || '#6b7280' }}
        />
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {category.type === 'BOTH' ? 'Both' : category.type.charAt(0) + category.type.slice(1).toLowerCase()}
            {category.isDefault && ' (Default)'}
          </p>
        </div>
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
