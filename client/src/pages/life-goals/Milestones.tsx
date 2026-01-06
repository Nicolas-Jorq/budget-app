/**
 * @fileoverview Life Goals Milestones Page
 *
 * @module pages/life-goals/Milestones
 */

import { useState, useEffect } from 'react'
import api from '../../services/api'

type LifeGoalCategory = 'CAREER' | 'PERSONAL' | 'TRAVEL' | 'LEARNING' | 'RELATIONSHIPS' | 'HEALTH' | 'CREATIVE' | 'ADVENTURE' | 'OTHER'

interface Milestone {
  id: string
  title: string
  description: string | null
  isCompleted: boolean
  completedAt: string | null
  targetDate: string | null
  goal: {
    id: string
    title: string
    category: LifeGoalCategory
  }
}

interface LifeGoal {
  id: string
  title: string
  category: LifeGoalCategory
  milestones: Milestone[]
}

const CATEGORY_COLORS: Record<LifeGoalCategory, string> = {
  CAREER: '#3B82F6',
  PERSONAL: '#8B5CF6',
  TRAVEL: '#10B981',
  LEARNING: '#F59E0B',
  RELATIONSHIPS: '#EC4899',
  HEALTH: '#EF4444',
  CREATIVE: '#A855F7',
  ADVENTURE: '#F97316',
  OTHER: '#6B7280',
}

export default function Milestones() {
  const [goals, setGoals] = useState<LifeGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending')

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const response = await api.get<LifeGoal[]>('/life-goals?includeCompleted=true')
      setGoals(response.data)
    } catch (err) {
      console.error('Failed to fetch goals:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleMilestone = async (milestoneId: string) => {
    try {
      await api.patch(`/life-goals/milestones/${milestoneId}/toggle`)
      fetchGoals()
    } catch (err) {
      console.error('Failed to toggle milestone:', err)
    }
  }

  const deleteMilestone = async (milestoneId: string) => {
    if (!confirm('Delete this milestone?')) return
    try {
      await api.delete(`/life-goals/milestones/${milestoneId}`)
      fetchGoals()
    } catch (err) {
      console.error('Failed to delete milestone:', err)
    }
  }

  // Flatten all milestones with their goal info
  const allMilestones = goals.flatMap((goal) =>
    goal.milestones.map((m) => ({
      ...m,
      goal: { id: goal.id, title: goal.title, category: goal.category },
    }))
  )

  // Filter milestones
  const filteredMilestones = allMilestones.filter((m) => {
    if (filter === 'pending') return !m.isCompleted
    if (filter === 'completed') return m.isCompleted
    return true
  })

  // Sort: pending first (by target date), then completed (by completion date)
  const sortedMilestones = [...filteredMilestones].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1
    }
    if (a.isCompleted && b.isCompleted) {
      return new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    }
    if (a.targetDate && b.targetDate) {
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
    }
    return 0
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-content-primary">Milestones</h1>
        <p className="text-content-secondary mt-1">Track progress across all your goals</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['pending', 'completed', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-500 text-white'
                : 'bg-theme-surface text-content-secondary hover:text-content-primary'
            }`}
          >
            {f === 'pending' ? 'Pending' : f === 'completed' ? 'Completed' : 'All'}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-theme-surface border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-content-tertiary">Total</p>
          <p className="text-2xl font-bold text-content-primary">{allMilestones.length}</p>
        </div>
        <div className="bg-theme-surface border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-content-tertiary">Pending</p>
          <p className="text-2xl font-bold text-yellow-500">
            {allMilestones.filter((m) => !m.isCompleted).length}
          </p>
        </div>
        <div className="bg-theme-surface border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-content-tertiary">Completed</p>
          <p className="text-2xl font-bold text-green-500">
            {allMilestones.filter((m) => m.isCompleted).length}
          </p>
        </div>
      </div>

      {/* Milestones List */}
      {sortedMilestones.length === 0 ? (
        <div className="text-center py-12 bg-theme-surface border border-border-subtle rounded-lg">
          <p className="text-content-tertiary">
            {filter === 'pending'
              ? 'No pending milestones. Great job!'
              : filter === 'completed'
              ? 'No completed milestones yet.'
              : 'No milestones found. Add milestones to your goals to track progress.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMilestones.map((milestone) => (
            <div
              key={milestone.id}
              className={`bg-theme-surface border border-border-subtle rounded-lg p-4 ${
                milestone.isCompleted ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleMilestone(milestone.id)}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    milestone.isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-border-subtle hover:border-primary-500'
                  }`}
                >
                  {milestone.isCompleted && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[milestone.goal.category]}20`,
                        color: CATEGORY_COLORS[milestone.goal.category],
                      }}
                    >
                      {milestone.goal.title}
                    </span>
                  </div>
                  <p
                    className={`font-medium ${
                      milestone.isCompleted
                        ? 'line-through text-content-tertiary'
                        : 'text-content-primary'
                    }`}
                  >
                    {milestone.title}
                  </p>
                  {milestone.description && (
                    <p className="text-sm text-content-secondary mt-1">{milestone.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-content-tertiary">
                    {milestone.targetDate && (
                      <span>Target: {new Date(milestone.targetDate).toLocaleDateString()}</span>
                    )}
                    {milestone.isCompleted && milestone.completedAt && (
                      <span className="text-green-500">
                        Completed: {new Date(milestone.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteMilestone(milestone.id)}
                  className="text-content-tertiary hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
