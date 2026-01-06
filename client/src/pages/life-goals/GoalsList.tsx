/**
 * @fileoverview Life Goals List Page
 *
 * @module pages/life-goals/GoalsList
 */

import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import api from '../../services/api'

type LifeGoalCategory = 'CAREER' | 'PERSONAL' | 'TRAVEL' | 'LEARNING' | 'RELATIONSHIPS' | 'HEALTH' | 'CREATIVE' | 'ADVENTURE' | 'OTHER'
type LifeGoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'ABANDONED'

interface Milestone {
  id: string
  title: string
  isCompleted: boolean
  targetDate: string | null
}

interface LifeGoal {
  id: string
  title: string
  description: string | null
  category: LifeGoalCategory
  status: LifeGoalStatus
  targetDate: string | null
  priority: number
  milestones: Milestone[]
  _count: { milestones: number }
}

const CATEGORY_OPTIONS: { value: LifeGoalCategory; label: string; color: string }[] = [
  { value: 'CAREER', label: 'Career', color: '#3B82F6' },
  { value: 'PERSONAL', label: 'Personal', color: '#8B5CF6' },
  { value: 'TRAVEL', label: 'Travel', color: '#10B981' },
  { value: 'LEARNING', label: 'Learning', color: '#F59E0B' },
  { value: 'RELATIONSHIPS', label: 'Relationships', color: '#EC4899' },
  { value: 'HEALTH', label: 'Health', color: '#EF4444' },
  { value: 'CREATIVE', label: 'Creative', color: '#A855F7' },
  { value: 'ADVENTURE', label: 'Adventure', color: '#F97316' },
  { value: 'OTHER', label: 'Other', color: '#6B7280' },
]

const STATUS_OPTIONS: { value: LifeGoalStatus; label: string }[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'ABANDONED', label: 'Abandoned' },
]

const PRIORITY_OPTIONS = [
  { value: 1, label: 'High' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Low' },
]

export default function GoalsList() {
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  const [goals, setGoals] = useState<LifeGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'PERSONAL' as LifeGoalCategory,
    targetDate: '',
    priority: 2,
  })

  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const statusParam = searchParams.get('status')
    if (statusParam === 'COMPLETED') {
      setFilter('completed')
    }
    fetchGoals(categoryParam as LifeGoalCategory | null)
  }, [searchParams, filter])

  const fetchGoals = async (category?: LifeGoalCategory | null) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (filter === 'completed') {
        params.append('status', 'COMPLETED')
        params.append('includeCompleted', 'true')
      } else if (filter === 'all') {
        params.append('includeCompleted', 'true')
      }

      const response = await api.get<LifeGoal[]>(`/life-goals?${params.toString()}`)
      setGoals(response.data)
    } catch (err) {
      console.error('Failed to fetch goals:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      showToast('error', 'Goal title is required')
      return
    }
    try {
      await api.post('/life-goals', {
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        targetDate: formData.targetDate || undefined,
        priority: formData.priority,
      })
      setFormData({ title: '', description: '', category: 'PERSONAL', targetDate: '', priority: 2 })
      setShowForm(false)
      showToast('success', 'Goal created successfully')
      fetchGoals()
    } catch (err) {
      console.error('Failed to create goal:', err)
      showToast('error', 'Failed to create goal')
    }
  }

  const updateStatus = async (goalId: string, status: LifeGoalStatus) => {
    try {
      await api.put(`/life-goals/${goalId}`, { status })
      showToast('success', 'Status updated')
      fetchGoals()
    } catch (err) {
      console.error('Failed to update status:', err)
      showToast('error', 'Failed to update status')
    }
  }

  const deleteGoal = async (goalId: string) => {
    if (!confirm('Delete this goal and all its milestones?')) return
    try {
      await api.delete(`/life-goals/${goalId}`)
      showToast('success', 'Goal deleted')
      fetchGoals()
    } catch (err) {
      console.error('Failed to delete goal:', err)
      showToast('error', 'Failed to delete goal')
    }
  }

  const getCategoryConfig = (category: LifeGoalCategory) => {
    return CATEGORY_OPTIONS.find((c) => c.value === category) || CATEGORY_OPTIONS[8]
  }

  const getPriorityLabel = (priority: number) => {
    return PRIORITY_OPTIONS.find((p) => p.value === priority)?.label || 'Medium'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 bg-theme-elevated rounded animate-pulse-subtle" />
            <div className="h-4 w-48 bg-theme-elevated rounded mt-2 animate-pulse-subtle" />
          </div>
          <div className="h-10 w-28 bg-theme-elevated rounded-lg animate-pulse-subtle" />
        </div>
        {/* Filter skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-24 bg-theme-elevated rounded-lg animate-pulse-subtle" />
          ))}
        </div>
        {/* Goals skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-theme-surface border border-border-subtle rounded-lg p-5 animate-pulse-subtle">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-5 w-16 bg-theme-elevated rounded" />
                <div className="h-4 w-24 bg-theme-elevated rounded" />
              </div>
              <div className="h-6 w-3/4 bg-theme-elevated rounded mb-2" />
              <div className="h-4 w-1/2 bg-theme-elevated rounded" />
              <div className="flex gap-4 mt-4">
                <div className="h-8 w-28 bg-theme-elevated rounded" />
                <div className="h-4 w-24 bg-theme-elevated rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">My Goals</h1>
          <p className="text-content-secondary mt-1">Your dreams and aspirations</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          {showForm ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['active', 'completed', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-500 text-white'
                : 'bg-theme-surface text-content-secondary hover:text-content-primary'
            }`}
          >
            {f === 'active' ? 'Active' : f === 'completed' ? 'Completed' : 'All'}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-theme-surface border border-border-subtle rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-content-secondary mb-1">Goal Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What do you want to achieve?"
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-content-secondary mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Why is this goal important to you?"
                rows={2}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as LifeGoalCategory })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Target Date</label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
            Create Goal
          </button>
        </form>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-theme-surface border border-border-subtle rounded-lg">
          <p className="text-content-tertiary">No goals found. Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const categoryConfig = getCategoryConfig(goal.category)
            const completedMilestones = goal.milestones.filter((m) => m.isCompleted).length
            const progress = goal._count.milestones > 0
              ? Math.round((completedMilestones / goal._count.milestones) * 100)
              : 0

            return (
              <div
                key={goal.id}
                className="bg-theme-surface border border-border-subtle rounded-lg p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: `${categoryConfig.color}20`, color: categoryConfig.color }}
                      >
                        {categoryConfig.label}
                      </span>
                      <span className="text-xs text-content-tertiary">
                        Priority: {getPriorityLabel(goal.priority)}
                      </span>
                    </div>
                    <Link
                      to={`/life-goals/${goal.id}`}
                      className={`text-lg font-medium hover:text-primary-500 transition-colors ${goal.status === 'COMPLETED' ? 'line-through text-content-tertiary' : 'text-content-primary'}`}
                    >
                      {goal.title}
                    </Link>
                    {goal.description && (
                      <p className="text-content-secondary mt-1">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <select
                        value={goal.status}
                        onChange={(e) => updateStatus(goal.id, e.target.value as LifeGoalStatus)}
                        className="text-sm px-2 py-1 bg-theme-elevated border border-border-subtle rounded text-content-primary"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      {goal.targetDate && (
                        <span className="text-sm text-content-tertiary">
                          Target: {new Date(goal.targetDate).toLocaleDateString()}
                        </span>
                      )}
                      {goal._count.milestones > 0 && (
                        <span className="text-sm text-content-tertiary">
                          {completedMilestones}/{goal._count.milestones} milestones
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    {goal._count.milestones > 0 && (
                      <div className="mt-3">
                        <div className="h-2 bg-theme-elevated rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: categoryConfig.color,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="ml-4 text-content-tertiary hover:text-red-500"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
