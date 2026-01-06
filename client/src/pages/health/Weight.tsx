/**
 * @fileoverview Weight Tracking Page
 *
 * @module pages/health/Weight
 */

import { useState, useEffect } from 'react'
import api from '../../services/api'

interface WeightLog {
  id: string
  weight: string
  unit: string
  bodyFat: string | null
  notes: string | null
  date: string
}

export default function Weight() {
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    weight: '',
    unit: 'kg',
    bodyFat: '',
    notes: '',
  })

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await api.get<WeightLog[]>('/health/weight')
      setLogs(response.data)
    } catch (err) {
      console.error('Failed to fetch weight logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/health/weight', {
        weight: parseFloat(formData.weight),
        unit: formData.unit,
        bodyFat: formData.bodyFat ? parseFloat(formData.bodyFat) : undefined,
        notes: formData.notes || undefined,
      })
      setFormData({ weight: '', unit: 'kg', bodyFat: '', notes: '' })
      setShowForm(false)
      fetchLogs()
    } catch (err) {
      console.error('Failed to log weight:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    try {
      await api.delete(`/health/weight/${id}`)
      fetchLogs()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const latestWeight = logs[0]
  const previousWeight = logs[1]
  const change = latestWeight && previousWeight
    ? (parseFloat(latestWeight.weight) - parseFloat(previousWeight.weight)).toFixed(1)
    : null

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
          <h1 className="text-2xl font-bold text-content-primary">Weight Tracking</h1>
          <p className="text-content-secondary mt-1">Monitor your weight over time</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Log Weight'}
        </button>
      </div>

      {/* Current Weight Card */}
      {latestWeight && (
        <div className="bg-theme-surface border border-border-subtle rounded-lg p-6">
          <p className="text-sm text-content-tertiary">Current Weight</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold text-content-primary">
              {parseFloat(latestWeight.weight).toFixed(1)}
            </span>
            <span className="text-xl text-content-secondary">{latestWeight.unit}</span>
            {change && (
              <span className={`text-sm ml-4 ${parseFloat(change) > 0 ? 'text-red-500' : parseFloat(change) < 0 ? 'text-green-500' : 'text-content-tertiary'}`}>
                {parseFloat(change) > 0 ? '+' : ''}{change} {latestWeight.unit} from last
              </span>
            )}
          </div>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-theme-surface border border-border-subtle rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Weight</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              >
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Body Fat % (optional)</label>
              <input
                type="number"
                step="0.1"
                value={formData.bodyFat}
                onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
            Save
          </button>
        </form>
      )}

      {/* History */}
      <div className="bg-theme-surface border border-border-subtle rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <h2 className="font-semibold text-content-primary">History</h2>
        </div>
        {logs.length === 0 ? (
          <div className="p-8 text-center text-content-tertiary">No weight entries yet</div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-content-primary">
                    {parseFloat(log.weight).toFixed(1)} {log.unit}
                  </span>
                  {log.bodyFat && (
                    <span className="text-content-tertiary ml-3">
                      {parseFloat(log.bodyFat).toFixed(1)}% body fat
                    </span>
                  )}
                  <span className="text-sm text-content-tertiary ml-3">
                    {new Date(log.date).toLocaleDateString()}
                  </span>
                </div>
                <button onClick={() => handleDelete(log.id)} className="text-content-tertiary hover:text-red-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
