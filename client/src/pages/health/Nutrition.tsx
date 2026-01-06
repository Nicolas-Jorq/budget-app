/**
 * @fileoverview Nutrition/Meals Tracking Page
 *
 * @module pages/health/Nutrition
 */

import { useState, useEffect } from 'react'
import api from '../../services/api'

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'

interface Meal {
  id: string
  name: string
  type: MealType
  calories: number | null
  protein: string | null
  carbs: string | null
  fat: string | null
  date: string
}

interface DailyTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  mealCount: number
}

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast', icon: '🌅' },
  { value: 'LUNCH', label: 'Lunch', icon: '☀️' },
  { value: 'DINNER', label: 'Dinner', icon: '🌙' },
  { value: 'SNACK', label: 'Snack', icon: '🍎' },
]

export default function Nutrition() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [totals, setTotals] = useState<DailyTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'LUNCH' as MealType,
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [mealsRes, totalsRes] = await Promise.all([
        api.get<Meal[]>('/health/meals'),
        api.get<DailyTotals>('/health/nutrition/daily'),
      ])
      setMeals(mealsRes.data)
      setTotals(totalsRes.data)
    } catch (err) {
      console.error('Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/health/meals', {
        name: formData.name,
        type: formData.type,
        calories: formData.calories ? parseInt(formData.calories) : undefined,
        protein: formData.protein ? parseFloat(formData.protein) : undefined,
        carbs: formData.carbs ? parseFloat(formData.carbs) : undefined,
        fat: formData.fat ? parseFloat(formData.fat) : undefined,
      })
      setFormData({ name: '', type: 'LUNCH', calories: '', protein: '', carbs: '', fat: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      console.error('Failed to log meal:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this meal?')) return
    try {
      await api.delete(`/health/meals/${id}`)
      fetchData()
    } catch (err) {
      console.error('Failed to delete:', err)
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
          <h1 className="text-2xl font-bold text-content-primary">Nutrition</h1>
          <p className="text-content-secondary mt-1">Track your meals and macros</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          {showForm ? 'Cancel' : '+ Log Meal'}
        </button>
      </div>

      {/* Today's Totals */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-theme-surface border border-border-subtle rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{totals.calories}</p>
            <p className="text-sm text-content-tertiary">Calories</p>
          </div>
          <div className="bg-theme-surface border border-border-subtle rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{totals.protein.toFixed(0)}g</p>
            <p className="text-sm text-content-tertiary">Protein</p>
          </div>
          <div className="bg-theme-surface border border-border-subtle rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{totals.carbs.toFixed(0)}g</p>
            <p className="text-sm text-content-tertiary">Carbs</p>
          </div>
          <div className="bg-theme-surface border border-border-subtle rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{totals.fat.toFixed(0)}g</p>
            <p className="text-sm text-content-tertiary">Fat</p>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-theme-surface border border-border-subtle rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Meal Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Chicken Salad"
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as MealType })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Calories</label>
              <input
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Protein (g)</label>
              <input
                type="number"
                step="0.1"
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Carbs (g)</label>
              <input
                type="number"
                step="0.1"
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Fat (g)</label>
              <input
                type="number"
                step="0.1"
                value={formData.fat}
                onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
            Save Meal
          </button>
        </form>
      )}

      {/* Meals List */}
      {meals.length === 0 ? (
        <div className="text-center py-12 bg-theme-surface border border-border-subtle rounded-lg">
          <p className="text-content-tertiary">No meals logged today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meals.map((meal) => {
            const typeConfig = MEAL_TYPES.find((t) => t.value === meal.type)
            return (
              <div key={meal.id} className="bg-theme-surface border border-border-subtle rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{typeConfig?.icon}</span>
                  <div>
                    <h3 className="font-medium text-content-primary">{meal.name}</h3>
                    <p className="text-sm text-content-tertiary">
                      {meal.calories && `${meal.calories} kcal`}
                      {meal.protein && ` • ${parseFloat(meal.protein).toFixed(0)}g protein`}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete(meal.id)} className="text-content-tertiary hover:text-red-500">
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
