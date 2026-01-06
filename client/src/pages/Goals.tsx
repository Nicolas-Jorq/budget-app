import { useEffect, useState } from 'react'
import api from '../services/api'
import { SavingsGoal } from '../types'
import GoalCard from '../components/GoalCard'
import GoalForm from '../components/GoalForm'
import ContributionForm from '../components/ContributionForm'

export default function Goals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showContributionForm, setShowContributionForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null)

  const fetchGoals = async () => {
    try {
      const response = await api.get('/goals')
      setGoals(response.data)
    } catch (error) {
      console.error('Failed to fetch goals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  const handleCreate = () => {
    setEditingGoal(null)
    setShowForm(true)
  }

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal)
    setShowForm(true)
  }

  const handleContribute = (goal: SavingsGoal) => {
    setContributingGoal(goal)
    setShowContributionForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal? All contributions will be lost.')) return
    try {
      await api.delete(`/goals/${id}`)
      setGoals(goals.filter((g) => g.id !== id))
    } catch (error) {
      console.error('Failed to delete goal:', error)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingGoal(null)
  }

  const handleFormSuccess = () => {
    handleFormClose()
    fetchGoals()
  }

  const handleContributionClose = () => {
    setShowContributionForm(false)
    setContributingGoal(null)
  }

  const handleContributionSuccess = () => {
    handleContributionClose()
    fetchGoals()
  }

  // Calculate summary stats
  const activeGoals = goals.filter((g) => !g.isCompleted)
  const completedGoals = goals.filter((g) => g.isCompleted)
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.targetAmount), 0)
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentAmount), 0)
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Goals</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          + New Goal
        </button>
      </div>

      {/* Summary Cards */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Saved</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Target</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalTarget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Overall Progress</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {overallProgress.toFixed(1)}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Goals</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeGoals.length} <span className="text-sm font-normal text-gray-500">/ {goals.length}</span>
            </p>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No savings goals yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Start saving for your dreams! Create your first goal to track your progress.
          </p>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <>
          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Active Goals ({activeGoals.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => handleEdit(goal)}
                    onDelete={() => handleDelete(goal.id)}
                    onContribute={() => handleContribute(goal)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Completed Goals ({completedGoals.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => handleEdit(goal)}
                    onDelete={() => handleDelete(goal.id)}
                    onContribute={() => handleContribute(goal)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <GoalForm
          goal={editingGoal}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {showContributionForm && contributingGoal && (
        <ContributionForm
          goal={contributingGoal}
          onClose={handleContributionClose}
          onSuccess={handleContributionSuccess}
        />
      )}
    </div>
  )
}
