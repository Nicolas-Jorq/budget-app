/**
 * @fileoverview Life Goals Dashboard Page
 *
 * @module pages/life-goals/LifeGoalsDashboard
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

interface DashboardStats {
  totalGoals: number
  inProgressGoals: number
  completedGoals: number
  goalsByCategory: Record<string, number>
  upcomingMilestones: number
  recentlyCompleted: number
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  CAREER: { label: 'Career', color: '#3B82F6', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  PERSONAL: { label: 'Personal', color: '#8B5CF6', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  TRAVEL: { label: 'Travel', color: '#10B981', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  LEARNING: { label: 'Learning', color: '#F59E0B', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  RELATIONSHIPS: { label: 'Relationships', color: '#EC4899', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  HEALTH: { label: 'Health', color: '#EF4444', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  CREATIVE: { label: 'Creative', color: '#A855F7', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
  ADVENTURE: { label: 'Adventure', color: '#F97316', icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' },
  OTHER: { label: 'Other', color: '#6B7280', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
}

export default function LifeGoalsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await api.get<DashboardStats>('/life-goals/dashboard')
      setStats(response.data)
    } catch (err) {
      console.error('Failed to fetch dashboard:', err)
    } finally {
      setLoading(false)
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
          <h1 className="text-2xl font-bold text-content-primary">Life Goals</h1>
          <p className="text-content-secondary mt-1">Track your dreams and aspirations</p>
        </div>
        <Link
          to="/life-goals/list"
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          + New Goal
        </Link>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-theme-surface border border-border-subtle rounded-lg p-4">
            <p className="text-sm text-content-tertiary">Active Goals</p>
            <p className="text-3xl font-bold text-purple-500 mt-1">{stats.totalGoals}</p>
          </div>
          <div className="bg-theme-surface border border-border-subtle rounded-lg p-4">
            <p className="text-sm text-content-tertiary">In Progress</p>
            <p className="text-3xl font-bold text-blue-500 mt-1">{stats.inProgressGoals}</p>
          </div>
          <div className="bg-theme-surface border border-border-subtle rounded-lg p-4">
            <p className="text-sm text-content-tertiary">Completed</p>
            <p className="text-3xl font-bold text-green-500 mt-1">{stats.completedGoals}</p>
          </div>
          <div className="bg-theme-surface border border-border-subtle rounded-lg p-4">
            <p className="text-sm text-content-tertiary">Upcoming Milestones</p>
            <p className="text-3xl font-bold text-yellow-500 mt-1">{stats.upcomingMilestones}</p>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/life-goals/list"
          className="bg-theme-surface border border-border-subtle rounded-lg p-4 hover:border-primary-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-content-primary">All Goals</p>
              <p className="text-sm text-content-tertiary">View and manage your life goals</p>
            </div>
          </div>
        </Link>
        <Link
          to="/life-goals/list?status=COMPLETED"
          className="bg-theme-surface border border-border-subtle rounded-lg p-4 hover:border-primary-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-content-primary">Achievements</p>
              <p className="text-sm text-content-tertiary">Goals you've accomplished</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Goals by Category */}
      {stats && Object.keys(stats.goalsByCategory).length > 0 && (
        <div className="bg-theme-surface border border-border-subtle rounded-lg">
          <div className="px-4 py-3 border-b border-border-subtle">
            <h2 className="font-semibold text-content-primary">Goals by Category</h2>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(stats.goalsByCategory).map(([category, count]) => {
              const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.OTHER
              return (
                <Link
                  key={category}
                  to={`/life-goals/list?category=${category}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-theme-elevated transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}20` }}
                  >
                    <svg
                      className="w-4 h-4"
                      style={{ color: config.color }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-content-primary">{config.label}</p>
                    <p className="text-sm text-content-tertiary">{count} goals</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats && stats.totalGoals === 0 && (
        <div className="text-center py-12 bg-theme-surface border border-border-subtle rounded-lg">
          <svg className="w-16 h-16 mx-auto text-content-tertiary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <h3 className="text-lg font-medium text-content-primary mb-2">Start Your Journey</h3>
          <p className="text-content-tertiary mb-4">Create your first life goal and begin tracking your dreams.</p>
          <Link
            to="/life-goals/list"
            className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Create Your First Goal
          </Link>
        </div>
      )}
    </div>
  )
}
