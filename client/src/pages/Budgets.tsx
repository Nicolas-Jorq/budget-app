import { useEffect, useState } from 'react'
import api from '../services/api'
import { Budget } from '../types'
import BudgetCard from '../components/BudgetCard'
import BudgetForm from '../components/BudgetForm'

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

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

  useEffect(() => {
    fetchBudgets()
  }, [])

  const handleCreate = () => {
    setEditingBudget(null)
    setShowForm(true)
  }

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return
    try {
      await api.delete(`/budgets/${id}`)
      setBudgets(budgets.filter((b) => b.id !== id))
    } catch (error) {
      console.error('Failed to delete budget:', error)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingBudget(null)
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          + Add Budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No budgets yet. Create your first budget to get started!</p>
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
