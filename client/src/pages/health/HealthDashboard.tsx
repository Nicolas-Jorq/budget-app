/**
 * @fileoverview Health Dashboard Page
 *
 * Main dashboard for the Health module showing overview of:
 * - Current weight
 * - Weekly workout stats
 * - Today's nutrition
 * - Sleep averages
 * - Water intake
 *
 * @module pages/health/HealthDashboard
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

interface DashboardSummary {
  weight: number | null
  weightUnit: string
  workoutsThisWeek: number
  avgSleepHours: number
  todayCalories: number
  todayWaterMl: number
  activeGoals: number
}

export default function HealthDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const response = await api.get<DashboardSummary>('/health/dashboard')
      setSummary(response.data)
    } catch (err) {
      setError('Failed to load dashboard')
      console.error(err)
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

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-content-primary">Health Dashboard</h1>
        <p className="text-content-secondary mt-1">
          Track your fitness, nutrition, and wellness
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Weight Card */}
        <Link
          to="/health/weight"
          className="bg-theme-surface border border-border-subtle rounded-lg p-5 hover:border-primary-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-content-tertiary">Current Weight</p>
              <p className="text-2xl font-bold text-content-primary mt-1">
                {summary?.weight ? `${summary.weight} ${summary.weightUnit}` : '—'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Workouts Card */}
        <Link
          to="/health/workouts"
          className="bg-theme-surface border border-border-subtle rounded-lg p-5 hover:border-primary-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-content-tertiary">Workouts This Week</p>
              <p className="text-2xl font-bold text-content-primary mt-1">
                {summary?.workoutsThisWeek ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Sleep Card */}
        <Link
          to="/health/sleep"
          className="bg-theme-surface border border-border-subtle rounded-lg p-5 hover:border-primary-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-content-tertiary">Avg Sleep (7 days)</p>
              <p className="text-2xl font-bold text-content-primary mt-1">
                {summary?.avgSleepHours ? `${summary.avgSleepHours}h` : '—'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Calories Card */}
        <Link
          to="/health/nutrition"
          className="bg-theme-surface border border-border-subtle rounded-lg p-5 hover:border-primary-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-content-tertiary">Today's Calories</p>
              <p className="text-2xl font-bold text-content-primary mt-1">
                {summary?.todayCalories ?? 0} kcal
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Water Card */}
        <div className="bg-theme-surface border border-border-subtle rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-content-tertiary">Today's Water</p>
              <p className="text-2xl font-bold text-content-primary mt-1">
                {summary?.todayWaterMl ? `${(summary.todayWaterMl / 1000).toFixed(1)}L` : '0L'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Goals Card */}
        <div className="bg-theme-surface border border-border-subtle rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-content-tertiary">Active Goals</p>
              <p className="text-2xl font-bold text-content-primary mt-1">
                {summary?.activeGoals ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-theme-surface border border-border-subtle rounded-lg p-6">
        <h2 className="text-lg font-semibold text-content-primary mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/health/workouts"
            className="px-4 py-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors text-sm font-medium"
          >
            + Log Workout
          </Link>
          <Link
            to="/health/weight"
            className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
          >
            + Log Weight
          </Link>
          <Link
            to="/health/nutrition"
            className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-colors text-sm font-medium"
          >
            + Log Meal
          </Link>
          <Link
            to="/health/sleep"
            className="px-4 py-2 bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500/20 transition-colors text-sm font-medium"
          >
            + Log Sleep
          </Link>
        </div>
      </div>
    </div>
  )
}
