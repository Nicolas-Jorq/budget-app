/**
 * @fileoverview Sleep Tracking Page
 *
 * @module pages/health/Sleep
 */

import { useState, useEffect } from 'react'
import api from '../../services/api'

interface SleepLog {
  id: string
  bedTime: string
  wakeTime: string
  duration: number
  quality: number | null
  notes: string | null
  date: string
}

interface SleepStats {
  avgDuration: number
  avgQuality: number
}

export default function Sleep() {
  const [logs, setLogs] = useState<SleepLog[]>([])
  const [stats, setStats] = useState<SleepStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    bedTime: '',
    wakeTime: '',
    quality: '',
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [logsRes, statsRes] = await Promise.all([
        api.get<SleepLog[]>('/health/sleep'),
        api.get<SleepStats>('/health/sleep/stats'),
      ])
      setLogs(logsRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error('Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/health/sleep', {
        bedTime: new Date(formData.bedTime).toISOString(),
        wakeTime: new Date(formData.wakeTime).toISOString(),
        quality: formData.quality ? parseInt(formData.quality) : undefined,
        notes: formData.notes || undefined,
      })
      setFormData({ bedTime: '', wakeTime: '', quality: '', notes: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      console.error('Failed to log sleep:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    try {
      await api.delete(`/health/sleep/${id}`)
      fetchData()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getQualityLabel = (quality: number) => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']
    return labels[quality] || ''
  }

  const getQualityColor = (quality: number) => {
    const colors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500', 'text-emerald-500']
    return colors[quality] || 'text-content-tertiary'
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
          <h1 className="text-2xl font-bold text-content-primary">Sleep</h1>
          <p className="text-content-secondary mt-1">Track your rest and recovery</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          {showForm ? 'Cancel' : '+ Log Sleep'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-theme-surface border border-border-subtle rounded-lg p-5">
            <p className="text-sm text-content-tertiary">Avg Sleep (7 days)</p>
            <p className="text-3xl font-bold text-purple-500 mt-1">
              {(stats.avgDuration / 60).toFixed(1)}h
            </p>
          </div>
          <div className="bg-theme-surface border border-border-subtle rounded-lg p-5">
            <p className="text-sm text-content-tertiary">Avg Quality</p>
            <p className={`text-3xl font-bold mt-1 ${getQualityColor(Math.round(stats.avgQuality))}`}>
              {stats.avgQuality > 0 ? getQualityLabel(Math.round(stats.avgQuality)) : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-theme-surface border border-border-subtle rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Bed Time</label>
              <input
                type="datetime-local"
                value={formData.bedTime}
                onChange={(e) => setFormData({ ...formData, bedTime: e.target.value })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Wake Time</label>
              <input
                type="datetime-local"
                value={formData.wakeTime}
                onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Quality (1-5)</label>
              <select
                value={formData.quality}
                onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              >
                <option value="">Select...</option>
                <option value="1">1 - Poor</option>
                <option value="2">2 - Fair</option>
                <option value="3">3 - Good</option>
                <option value="4">4 - Great</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="How did you sleep?"
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
            Save
          </button>
        </form>
      )}

      {/* Sleep History */}
      {logs.length === 0 ? (
        <div className="text-center py-12 bg-theme-surface border border-border-subtle rounded-lg">
          <p className="text-content-tertiary">No sleep entries yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="bg-theme-surface border border-border-subtle rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-content-primary">{formatDuration(log.duration)}</p>
                  <p className="text-sm text-content-tertiary">
                    {formatTime(log.bedTime)} → {formatTime(log.wakeTime)}
                    {log.quality && (
                      <span className={`ml-2 ${getQualityColor(log.quality)}`}>
                        • {getQualityLabel(log.quality)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-content-tertiary">
                  {new Date(log.date).toLocaleDateString()}
                </span>
                <button onClick={() => handleDelete(log.id)} className="text-content-tertiary hover:text-red-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
