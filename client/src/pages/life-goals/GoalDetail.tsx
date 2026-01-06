/**
 * @fileoverview Life Goal Detail Page
 *
 * View and manage a single life goal with inline milestone management.
 *
 * @module pages/life-goals/GoalDetail
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import api from '../../services/api'

type LifeGoalCategory = 'CAREER' | 'PERSONAL' | 'TRAVEL' | 'LEARNING' | 'RELATIONSHIPS' | 'HEALTH' | 'CREATIVE' | 'ADVENTURE' | 'OTHER'
type LifeGoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'ABANDONED'

interface Milestone {
  id: string
  title: string
  description: string | null
  isCompleted: boolean
  completedAt: string | null
  targetDate: string | null
  sortOrder: number
}

interface LifeGoal {
  id: string
  title: string
  description: string | null
  category: LifeGoalCategory
  status: LifeGoalStatus
  targetDate: string | null
  priority: number
  notes: string | null
  milestones: Milestone[]
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

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [goal, setGoal] = useState<LifeGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: 'PERSONAL' as LifeGoalCategory,
    status: 'NOT_STARTED' as LifeGoalStatus,
    targetDate: '',
    priority: 2,
    notes: '',
  })

  // Milestone form state
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    targetDate: '',
  })

  useEffect(() => {
    if (id) fetchGoal()
  }, [id])

  const fetchGoal = async () => {
    try {
      setLoading(true)
      const response = await api.get<LifeGoal>(`/life-goals/${id}`)
      setGoal(response.data)
      setEditForm({
        title: response.data.title,
        description: response.data.description || '',
        category: response.data.category,
        status: response.data.status,
        targetDate: response.data.targetDate?.split('T')[0] || '',
        priority: response.data.priority,
        notes: response.data.notes || '',
      })
    } catch (err) {
      console.error('Failed to fetch goal:', err)
      showToast('error', 'Failed to load goal')
      navigate('/life-goals/list')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGoal = async () => {
    if (!editForm.title.trim()) {
      showToast('error', 'Goal title is required')
      return
    }

    try {
      setSaving(true)
      await api.put(`/life-goals/${id}`, {
        title: editForm.title,
        description: editForm.description || undefined,
        category: editForm.category,
        status: editForm.status,
        targetDate: editForm.targetDate || undefined,
        priority: editForm.priority,
        notes: editForm.notes || undefined,
      })
      showToast('success', 'Goal updated successfully')
      setIsEditing(false)
      fetchGoal()
    } catch (err) {
      console.error('Failed to update goal:', err)
      showToast('error', 'Failed to update goal')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGoal = async () => {
    if (!confirm('Delete this goal and all its milestones? This cannot be undone.')) return

    try {
      await api.delete(`/life-goals/${id}`)
      showToast('success', 'Goal deleted')
      navigate('/life-goals/list')
    } catch (err) {
      console.error('Failed to delete goal:', err)
      showToast('error', 'Failed to delete goal')
    }
  }

  // Milestone handlers
  const handleAddMilestone = async () => {
    if (!milestoneForm.title.trim()) {
      showToast('error', 'Milestone title is required')
      return
    }

    try {
      await api.post(`/life-goals/${id}/milestones`, {
        title: milestoneForm.title,
        description: milestoneForm.description || undefined,
        targetDate: milestoneForm.targetDate || undefined,
      })
      showToast('success', 'Milestone added')
      setMilestoneForm({ title: '', description: '', targetDate: '' })
      setShowMilestoneForm(false)
      fetchGoal()
    } catch (err) {
      console.error('Failed to add milestone:', err)
      showToast('error', 'Failed to add milestone')
    }
  }

  const handleUpdateMilestone = async () => {
    if (!editingMilestone || !milestoneForm.title.trim()) {
      showToast('error', 'Milestone title is required')
      return
    }

    try {
      await api.put(`/life-goals/milestones/${editingMilestone.id}`, {
        title: milestoneForm.title,
        description: milestoneForm.description || undefined,
        targetDate: milestoneForm.targetDate || undefined,
      })
      showToast('success', 'Milestone updated')
      setMilestoneForm({ title: '', description: '', targetDate: '' })
      setEditingMilestone(null)
      fetchGoal()
    } catch (err) {
      console.error('Failed to update milestone:', err)
      showToast('error', 'Failed to update milestone')
    }
  }

  const handleToggleMilestone = async (milestoneId: string) => {
    try {
      await api.patch(`/life-goals/milestones/${milestoneId}/toggle`)
      fetchGoal()
    } catch (err) {
      console.error('Failed to toggle milestone:', err)
      showToast('error', 'Failed to update milestone')
    }
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Delete this milestone?')) return

    try {
      await api.delete(`/life-goals/milestones/${milestoneId}`)
      showToast('success', 'Milestone deleted')
      fetchGoal()
    } catch (err) {
      console.error('Failed to delete milestone:', err)
      showToast('error', 'Failed to delete milestone')
    }
  }

  const startEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setMilestoneForm({
      title: milestone.title,
      description: milestone.description || '',
      targetDate: milestone.targetDate?.split('T')[0] || '',
    })
    setShowMilestoneForm(false)
  }

  const cancelMilestoneEdit = () => {
    setEditingMilestone(null)
    setMilestoneForm({ title: '', description: '', targetDate: '' })
  }

  const getCategoryConfig = (category: LifeGoalCategory) => {
    return CATEGORY_OPTIONS.find((c) => c.value === category) || CATEGORY_OPTIONS[8]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton loader */}
        <div className="animate-pulse-subtle">
          <div className="h-8 w-48 bg-theme-elevated rounded mb-2" />
          <div className="h-4 w-32 bg-theme-elevated rounded" />
        </div>
        <div className="bg-theme-surface border border-border-subtle rounded-lg p-6 animate-pulse-subtle">
          <div className="h-6 w-3/4 bg-theme-elevated rounded mb-4" />
          <div className="h-4 w-1/2 bg-theme-elevated rounded mb-2" />
          <div className="h-4 w-2/3 bg-theme-elevated rounded" />
        </div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="text-center py-12">
        <p className="text-content-tertiary">Goal not found</p>
        <Link to="/life-goals/list" className="text-primary-500 hover:underline mt-2 inline-block">
          Back to goals
        </Link>
      </div>
    )
  }

  const categoryConfig = getCategoryConfig(goal.category)
  const completedMilestones = goal.milestones.filter((m) => m.isCompleted).length
  const progress = goal.milestones.length > 0
    ? Math.round((completedMilestones / goal.milestones.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/life-goals" className="text-content-tertiary hover:text-content-primary">
          Life Goals
        </Link>
        <span className="text-content-tertiary">/</span>
        <Link to="/life-goals/list" className="text-content-tertiary hover:text-content-primary">
          My Goals
        </Link>
        <span className="text-content-tertiary">/</span>
        <span className="text-content-primary">{goal.title}</span>
      </div>

      {/* Goal Header */}
      <div className="bg-theme-surface border border-border-subtle rounded-lg p-6">
        {isEditing ? (
          // Edit mode
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
                placeholder="Goal title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
                placeholder="Why is this goal important?"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value as LifeGoalCategory })}
                  className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as LifeGoalStatus })}
                  className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: parseInt(e.target.value) })}
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
                  value={editForm.targetDate}
                  onChange={(e) => setEditForm({ ...editForm, targetDate: e.target.value })}
                  className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
                placeholder="Additional notes..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveGoal}
                disabled={saving}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-theme-elevated text-content-secondary rounded-lg hover:text-content-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // View mode
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: `${categoryConfig.color}20`, color: categoryConfig.color }}
                  >
                    {categoryConfig.label}
                  </span>
                  <span className="text-xs text-content-tertiary">
                    Priority: {PRIORITY_OPTIONS.find((p) => p.value === goal.priority)?.label}
                  </span>
                  <span className="text-xs text-content-tertiary">
                    {STATUS_OPTIONS.find((s) => s.value === goal.status)?.label}
                  </span>
                </div>
                <h1 className={`text-2xl font-bold ${goal.status === 'COMPLETED' ? 'line-through text-content-tertiary' : 'text-content-primary'}`}>
                  {goal.title}
                </h1>
                {goal.description && (
                  <p className="text-content-secondary mt-2">{goal.description}</p>
                )}
                {goal.targetDate && (
                  <p className="text-sm text-content-tertiary mt-2">
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-sm bg-theme-elevated text-content-secondary rounded-lg hover:text-content-primary"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteGoal}
                  className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {goal.milestones.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-content-secondary">Progress</span>
                  <span className="text-content-primary font-medium">{progress}%</span>
                </div>
                <div className="h-2 bg-theme-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: categoryConfig.color }}
                  />
                </div>
                <p className="text-xs text-content-tertiary mt-1">
                  {completedMilestones} of {goal.milestones.length} milestones completed
                </p>
              </div>
            )}

            {goal.notes && (
              <div className="mt-4 p-3 bg-theme-elevated rounded-lg">
                <p className="text-sm text-content-secondary">{goal.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Milestones Section */}
      <div className="bg-theme-surface border border-border-subtle rounded-lg">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
          <h2 className="font-semibold text-content-primary">Milestones</h2>
          {!showMilestoneForm && !editingMilestone && (
            <button
              onClick={() => setShowMilestoneForm(true)}
              className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              + Add Milestone
            </button>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* Add/Edit Milestone Form */}
          {(showMilestoneForm || editingMilestone) && (
            <div className="bg-theme-elevated border border-border-subtle rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1">Title</label>
                <input
                  type="text"
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-theme-surface border border-border-subtle rounded-lg text-content-primary"
                  placeholder="Milestone title"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-content-secondary mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={milestoneForm.description}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-theme-surface border border-border-subtle rounded-lg text-content-primary"
                    placeholder="Brief description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-content-secondary mb-1">Target Date (optional)</label>
                  <input
                    type="date"
                    value={milestoneForm.targetDate}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, targetDate: e.target.value })}
                    className="w-full px-3 py-2 bg-theme-surface border border-border-subtle rounded-lg text-content-primary"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={editingMilestone ? handleUpdateMilestone : handleAddMilestone}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                >
                  {editingMilestone ? 'Update' : 'Add'} Milestone
                </button>
                <button
                  onClick={() => {
                    setShowMilestoneForm(false)
                    cancelMilestoneEdit()
                  }}
                  className="px-4 py-2 bg-theme-surface text-content-secondary rounded-lg hover:text-content-primary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Milestone List */}
          {goal.milestones.length === 0 ? (
            <p className="text-center py-8 text-content-tertiary">
              No milestones yet. Add milestones to track your progress.
            </p>
          ) : (
            goal.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  milestone.isCompleted
                    ? 'bg-theme-elevated/50 border-border-subtle'
                    : 'bg-theme-elevated border-border-subtle'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleMilestone(milestone.id)}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    milestone.isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-border-strong hover:border-primary-500'
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
                  <p className={`font-medium ${milestone.isCompleted ? 'line-through text-content-tertiary' : 'text-content-primary'}`}>
                    {milestone.title}
                  </p>
                  {milestone.description && (
                    <p className="text-sm text-content-secondary mt-0.5">{milestone.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-content-tertiary">
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

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => startEditMilestone(milestone)}
                    className="p-1.5 text-content-tertiary hover:text-content-primary rounded"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteMilestone(milestone.id)}
                    className="p-1.5 text-content-tertiary hover:text-red-500 rounded"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
