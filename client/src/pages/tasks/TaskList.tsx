/**
 * @fileoverview Task List Page
 *
 * @module pages/tasks/TaskList
 */

import { useState, useEffect } from 'react'
import api from '../../services/api'

interface Label {
  id: string
  name: string
  color: string
}

interface Task {
  id: string
  title: string
  description: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
  dueDate: string | null
  project: { id: string; name: string; color: string } | null
  labels: { label: Label }[]
  _count: { subtasks: number }
}

interface Project {
  id: string
  name: string
  color: string
}

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'text-content-tertiary' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-500' },
  { value: 'HIGH', label: 'High', color: 'text-orange-500' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-500' },
]

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Task['priority'],
    dueDate: '',
    projectId: '',
  })

  useEffect(() => {
    fetchData()
  }, [filter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter === 'todo') params.append('status', 'TODO')
      if (filter === 'done') {
        params.append('status', 'DONE')
        params.append('includeCompleted', 'true')
      }
      if (filter === 'all') params.append('includeCompleted', 'true')

      const [tasksRes, projectsRes] = await Promise.all([
        api.get<Task[]>(`/tasks?${params.toString()}`),
        api.get<Project[]>('/tasks/projects'),
      ])
      setTasks(tasksRes.data)
      setProjects(projectsRes.data)
    } catch (err) {
      console.error('Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/tasks', {
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        projectId: formData.projectId || undefined,
      })
      setFormData({ title: '', description: '', priority: 'MEDIUM', dueDate: '', projectId: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      console.error('Failed to create task:', err)
    }
  }

  const toggleTask = async (taskId: string) => {
    try {
      await api.patch(`/tasks/${taskId}/toggle`)
      fetchData()
    } catch (err) {
      console.error('Failed to toggle task:', err)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${taskId}`)
      fetchData()
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  const getPriorityConfig = (priority: string) => {
    return PRIORITY_OPTIONS.find((p) => p.value === priority) || PRIORITY_OPTIONS[1]
  }

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date < today) return { text: 'Overdue', class: 'text-red-500' }
    if (date.toDateString() === today.toDateString()) return { text: 'Today', class: 'text-yellow-500' }
    if (date.toDateString() === tomorrow.toDateString()) return { text: 'Tomorrow', class: 'text-blue-500' }
    return { text: date.toLocaleDateString(), class: 'text-content-tertiary' }
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">All Tasks</h1>
          <p className="text-content-secondary mt-1">Manage your tasks</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          {showForm ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'todo', 'done'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-500 text-white'
                : 'bg-theme-surface text-content-secondary hover:text-content-primary'
            }`}
          >
            {f === 'all' ? 'All' : f === 'todo' ? 'To Do' : 'Completed'}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-theme-surface border border-border-subtle rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-content-secondary mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What needs to be done?"
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-content-secondary mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add details..."
                rows={2}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Project</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              >
                <option value="">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
            Create Task
          </button>
        </form>
      )}

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-theme-surface border border-border-subtle rounded-lg">
          <p className="text-content-tertiary">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const priorityConfig = getPriorityConfig(task.priority)
            const dueInfo = formatDueDate(task.dueDate)
            const isDone = task.status === 'DONE'

            return (
              <div
                key={task.id}
                className="bg-theme-surface border border-border-subtle rounded-lg p-4 flex items-start gap-3"
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                    isDone
                      ? 'bg-primary-500 border-primary-500'
                      : 'border-border-subtle hover:border-primary-500'
                  }`}
                >
                  {isDone && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${isDone ? 'line-through text-content-tertiary' : 'text-content-primary'}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-sm text-content-tertiary mt-1 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {task.project && (
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: `${task.project.color}20`, color: task.project.color }}
                      >
                        {task.project.name}
                      </span>
                    )}
                    <span className={`text-xs font-medium ${priorityConfig.color}`}>
                      {priorityConfig.label}
                    </span>
                    {dueInfo && (
                      <span className={`text-xs ${dueInfo.class}`}>{dueInfo.text}</span>
                    )}
                    {task._count.subtasks > 0 && (
                      <span className="text-xs text-content-tertiary">
                        {task._count.subtasks} subtasks
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-content-tertiary hover:text-red-500 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
