/**
 * @fileoverview Workouts Page
 *
 * Exercise and workout tracking page.
 *
 * @module pages/health/Workouts
 */

import { useState, useEffect } from 'react'
import api from '../../services/api'

type WorkoutType = 'CARDIO' | 'STRENGTH' | 'FLEXIBILITY' | 'SPORTS' | 'OTHER'

interface Workout {
  id: string
  name: string
  type: WorkoutType
  duration: number
  calories: number | null
  notes: string | null
  date: string
}

interface WorkoutFormData {
  name: string
  type: WorkoutType
  duration: number
  calories: string
  notes: string
}

const WORKOUT_TYPES: { value: WorkoutType; label: string; color: string }[] = [
  { value: 'CARDIO', label: 'Cardio', color: 'text-red-500 bg-red-500/10' },
  { value: 'STRENGTH', label: 'Strength', color: 'text-blue-500 bg-blue-500/10' },
  { value: 'FLEXIBILITY', label: 'Flexibility', color: 'text-purple-500 bg-purple-500/10' },
  { value: 'SPORTS', label: 'Sports', color: 'text-green-500 bg-green-500/10' },
  { value: 'OTHER', label: 'Other', color: 'text-gray-500 bg-gray-500/10' },
]

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<WorkoutFormData>({
    name: '',
    type: 'CARDIO',
    duration: 30,
    calories: '',
    notes: '',
  })

  useEffect(() => {
    fetchWorkouts()
  }, [])

  const fetchWorkouts = async () => {
    try {
      setLoading(true)
      const response = await api.get<Workout[]>('/health/workouts')
      setWorkouts(response.data)
    } catch (err) {
      console.error('Failed to fetch workouts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/health/workouts', {
        name: formData.name,
        type: formData.type,
        duration: formData.duration,
        calories: formData.calories ? parseInt(formData.calories) : undefined,
        notes: formData.notes || undefined,
      })
      setFormData({ name: '', type: 'CARDIO', duration: 30, calories: '', notes: '' })
      setShowForm(false)
      fetchWorkouts()
    } catch (err) {
      console.error('Failed to create workout:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workout?')) return
    try {
      await api.delete(`/health/workouts/${id}`)
      fetchWorkouts()
    } catch (err) {
      console.error('Failed to delete workout:', err)
    }
  }

  const getTypeConfig = (type: WorkoutType) => {
    return WORKOUT_TYPES.find((t) => t.value === type) || WORKOUT_TYPES[4]
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
          <h1 className="text-2xl font-bold text-content-primary">Workouts</h1>
          <p className="text-content-secondary mt-1">Track your exercise sessions</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Log Workout'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-theme-surface border border-border-subtle rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">
                Workout Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Morning Run"
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as WorkoutType })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              >
                {WORKOUT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                min="1"
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">
                Calories Burned (optional)
              </label>
              <input
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                placeholder="200"
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="How did it go?"
              rows={2}
              className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Save Workout
          </button>
        </form>
      )}

      {/* Workouts List */}
      {workouts.length === 0 ? (
        <div className="text-center py-12 bg-theme-surface border border-border-subtle rounded-lg">
          <p className="text-content-tertiary">No workouts logged yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-primary-500 hover:text-primary-400"
          >
            Log your first workout
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => {
            const typeConfig = getTypeConfig(workout.type)
            return (
              <div
                key={workout.id}
                className="bg-theme-surface border border-border-subtle rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${typeConfig.color}`}>
                    {typeConfig.label}
                  </span>
                  <div>
                    <h3 className="font-medium text-content-primary">{workout.name}</h3>
                    <p className="text-sm text-content-tertiary">
                      {workout.duration} min
                      {workout.calories && ` • ${workout.calories} kcal`}
                      {' • '}
                      {new Date(workout.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(workout.id)}
                  className="p-2 text-content-tertiary hover:text-red-500 transition-colors"
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
