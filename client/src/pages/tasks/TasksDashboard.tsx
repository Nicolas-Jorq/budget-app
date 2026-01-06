/**
 * @fileoverview Tasks Dashboard Page
 *
 * @module pages/tasks/TasksDashboard
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

interface DashboardStats {
  totalTasks: number
  completedToday: number
  overdueTasks: number
  dueTodayTasks: number
  dueThisWeekTasks: number
  recentlyCompleted: number
  projectCount: number
}

interface Task {
  id: string
  title: string
  priority: string
  status: string
  dueDate: string | null
  project: { id: string; name: string; color: string } | null
}

export default function TasksDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsRes, todayRes] = await Promise.all([
        api.get<DashboardStats>('/tasks/dashboard'),
        api.get<Task[]>('/tasks/today'),
      ])
      setStats(statsRes.data)
      setTodayTasks(todayRes.data)
    } catch (err) {
      console.error('Failed to fetch dashboard:', err)
    } finally {
      setLoading(false)
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-500'
      case 'HIGH': return 'text-orange-500'
      case 'MEDIUM': return 'text-yellow-500'
      default: return 'text-content-tertiary'
    }
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
          <h1 className="text-2xl font-bold text-content-primary">Tasks</h1>
          <p className="text-content-secondary mt-1">Stay organized and productive</p>
        </div>
        <Link
          to="/tasks/list"
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          + New Task
        </Link>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-theme-surface border border-border-subtle rounded-lg p-4">
            <p className="text-sm text-content-tertiary">Active Tasks</p>
            <p className="text-3xl font-bold text-blue-500 mt-1">{stats.totalTasks}</p>
          </div>
          <div className="bg-theme-surface border border-border-subtle rounded-lg p-4">
            <p className="text-sm text-content-tertiary">Due Today</p>
            <p className="text-3xl font-bold text-yellow-500 mt-1">{stats.dueTodayTasks}</p>
          </div>
          <div className="bg-theme-surface border border-border-subtle rounded-lg p-4">
            <p className="text-sm text-content-tertiary">Overdue</p>
            <p className="text-3xl font-bold text-red-500 mt-1">{stats.overdueTasks}</p>
          </div>
          <div className="bg-theme-surface border border-border-subtle rounded-lg p-4">
            <p className="text-sm text-content-tertiary">Completed Today</p>
            <p className="text-3xl font-bold text-green-500 mt-1">{stats.completedToday}</p>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link
          to="/tasks/list"
          className="bg-theme-surface border border-border-subtle rounded-lg p-4 hover:border-primary-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-content-primary">All Tasks</p>
              <p className="text-sm text-content-tertiary">View and manage</p>
            </div>
          </div>
        </Link>
        <Link
          to="/tasks/projects"
          className="bg-theme-surface border border-border-subtle rounded-lg p-4 hover:border-primary-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-content-primary">Projects</p>
              <p className="text-sm text-content-tertiary">{stats?.projectCount || 0} active</p>
            </div>
          </div>
        </Link>
        <Link
          to="/tasks/list?status=DONE"
          className="bg-theme-surface border border-border-subtle rounded-lg p-4 hover:border-primary-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-content-primary">Completed</p>
              <p className="text-sm text-content-tertiary">{stats?.recentlyCompleted || 0} this week</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Today's Tasks */}
      <div className="bg-theme-surface border border-border-subtle rounded-lg">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
          <h2 className="font-semibold text-content-primary">Today's Tasks</h2>
          <span className="text-sm text-content-tertiary">{todayTasks.length} tasks</span>
        </div>
        {todayTasks.length === 0 ? (
          <div className="p-8 text-center text-content-tertiary">
            No tasks due today. Great job!
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {todayTasks.map((task) => (
              <div key={task.id} className="px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => toggleTask(task.id)}
                  className="w-5 h-5 rounded border border-border-subtle hover:border-primary-500 flex items-center justify-center"
                >
                  {task.status === 'DONE' && (
                    <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${task.status === 'DONE' ? 'line-through text-content-tertiary' : 'text-content-primary'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    {task.project && (
                      <span
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{ backgroundColor: `${task.project.color}20`, color: task.project.color }}
                      >
                        {task.project.name}
                      </span>
                    )}
                    <span className={getPriorityColor(task.priority)}>{task.priority}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
