/**
 * @fileoverview Weight Tracking Page
 *
 * Comprehensive weight tracking with:
 * - CSV import functionality
 * - Weight trend visualization with moving average
 * - Manual weight entry
 * - History view
 *
 * @module pages/health/Weight
 */

import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import WeightTrendChart from '../../components/charts/WeightTrendChart'

interface WeightLog {
  id: string
  weight: string
  unit: string
  bodyFat: string | null
  notes: string | null
  date: string
}

interface ChartData {
  data: Array<{
    date: string
    weight: number
    movingAverage: number | null
  }>
  stats: {
    startWeight: number | null
    currentWeight: number | null
    change: number | null
    changePercent: number | null
    minWeight: number | null
    maxWeight: number | null
    avgWeight: number | null
  }
}

interface ImportPreview {
  validRows: number
  parseErrors: Array<{ row: number; error: string }>
  detectedHeaders: string[]
  preview: Array<{ date: string; weight: number; movingAverage: number | null }>
}

interface ImportResult {
  success: boolean
  totalRows: number
  imported: number
  duplicates: number
  errors: number
}

export default function Weight() {
  // Data state
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  // UI state
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [activeTab, setActiveTab] = useState<'chart' | 'history'>('chart')
  const [chartDays, setChartDays] = useState(90)

  // Form state
  const [formData, setFormData] = useState({
    weight: '',
    unit: 'lbs',
    bodyFat: '',
    notes: '',
  })

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importUnit, setImportUnit] = useState<'lbs' | 'kg'>('lbs')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch data on mount and when chartDays changes
  useEffect(() => {
    fetchData()
  }, [chartDays])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [logsRes, chartRes] = await Promise.all([
        api.get<WeightLog[]>('/health/weight?limit=100'),
        api.get<ChartData>(`/health/weight/chart?days=${chartDays}`),
      ])
      setLogs(logsRes.data)
      setChartData(chartRes.data)
    } catch (err) {
      console.error('Failed to fetch weight data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle manual weight entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/health/weight', {
        weight: parseFloat(formData.weight),
        unit: formData.unit,
        bodyFat: formData.bodyFat ? parseFloat(formData.bodyFat) : undefined,
        notes: formData.notes || undefined,
      })
      setFormData({ weight: '', unit: 'lbs', bodyFat: '', notes: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      console.error('Failed to log weight:', err)
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    try {
      await api.delete(`/health/weight/${id}`)
      fetchData()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  // Handle file selection for import
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportFile(file)
    setImportResult(null)

    try {
      setImportLoading(true)
      const content = await file.text()

      const response = await api.post<ImportPreview>('/health/weight/import/preview', {
        csvContent: content,
      })
      setImportPreview(response.data)
    } catch (err) {
      console.error('Failed to preview CSV:', err)
      setImportPreview(null)
    } finally {
      setImportLoading(false)
    }
  }

  // Handle import
  const handleImport = async () => {
    if (!importFile || !importPreview) return

    try {
      setImportLoading(true)
      const content = await importFile.text()

      const response = await api.post<ImportResult>('/health/weight/import', {
        csvContent: content,
        unit: importUnit,
        skipDuplicates: true,
      })
      setImportResult(response.data)

      if (response.data.imported > 0) {
        fetchData()
      }
    } catch (err) {
      console.error('Failed to import:', err)
    } finally {
      setImportLoading(false)
    }
  }

  // Reset import state
  const resetImport = () => {
    setImportFile(null)
    setImportPreview(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Get unit from existing data
  const dataUnit = logs[0]?.unit || 'lbs'

  if (loading && !chartData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Weight Tracking</h1>
          <p className="text-content-secondary mt-1">Monitor your weight trends over time</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowImport(!showImport); setShowForm(false) }}
            className="px-4 py-2 border border-border-subtle text-content-secondary rounded-lg hover:bg-theme-elevated transition-colors"
          >
            {showImport ? 'Cancel' : 'Import CSV'}
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setShowImport(false) }}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Log Weight'}
          </button>
        </div>
      </div>

      {/* Import Panel */}
      {showImport && (
        <div className="bg-theme-surface border border-border-subtle rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-content-primary">Import Weight Data</h2>
            {importFile && (
              <button onClick={resetImport} className="text-sm text-content-tertiary hover:text-content-secondary">
                Clear
              </button>
            )}
          </div>

          <div className="text-sm text-content-secondary space-y-1">
            <p>Upload a CSV file with your weight data. Expected columns:</p>
            <code className="block bg-theme-elevated px-3 py-2 rounded text-xs">
              Date, Weight Recorded, Moving Average
            </code>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="flex-1 px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary-500 file:text-white file:text-sm cursor-pointer"
            />
            <select
              value={importUnit}
              onChange={(e) => setImportUnit(e.target.value as 'lbs' | 'kg')}
              className="px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
            >
              <option value="lbs">Pounds (lbs)</option>
              <option value="kg">Kilograms (kg)</option>
            </select>
          </div>

          {/* Import Preview */}
          {importLoading && (
            <div className="flex items-center gap-2 text-content-secondary">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
              Processing...
            </div>
          )}

          {importPreview && !importResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-500">{importPreview.validRows} valid rows</span>
                {importPreview.parseErrors.length > 0 && (
                  <span className="text-yellow-500">{importPreview.parseErrors.length} errors</span>
                )}
              </div>

              {importPreview.preview.length > 0 && (
                <div className="bg-theme-elevated rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-theme-surface">
                      <tr>
                        <th className="px-3 py-2 text-left text-content-tertiary">Date</th>
                        <th className="px-3 py-2 text-right text-content-tertiary">Weight</th>
                        <th className="px-3 py-2 text-right text-content-tertiary">Moving Avg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {importPreview.preview.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-content-primary">{row.date}</td>
                          <td className="px-3 py-2 text-right text-content-primary">{row.weight}</td>
                          <td className="px-3 py-2 text-right text-content-secondary">
                            {row.movingAverage?.toFixed(1) || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.preview.length > 5 && (
                    <p className="px-3 py-2 text-xs text-content-tertiary border-t border-border-subtle">
                      ... and {importPreview.preview.length - 5} more rows
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={importLoading || importPreview.validRows === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {importPreview.validRows} Records
              </button>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
              <p className={`font-medium ${importResult.success ? 'text-green-500' : 'text-yellow-500'}`}>
                Import Complete
              </p>
              <div className="mt-2 text-sm text-content-secondary grid grid-cols-3 gap-2">
                <div>Imported: <span className="text-green-500 font-medium">{importResult.imported}</span></div>
                <div>Duplicates: <span className="text-yellow-500 font-medium">{importResult.duplicates}</span></div>
                <div>Errors: <span className="text-red-500 font-medium">{importResult.errors}</span></div>
              </div>
              <button
                onClick={() => { resetImport(); setShowImport(false) }}
                className="mt-3 text-sm text-primary-500 hover:text-primary-400"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-theme-surface border border-border-subtle rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-content-primary">Log Weight</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
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
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Notes (optional)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
                placeholder="e.g., Morning weigh-in"
              />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
            Save
          </button>
        </form>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-theme-elevated p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('chart')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'chart'
              ? 'bg-theme-surface text-content-primary shadow-sm'
              : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          Trend Chart
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-theme-surface text-content-primary shadow-sm'
              : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          History
        </button>
      </div>

      {/* Chart View */}
      {activeTab === 'chart' && (
        <div className="space-y-4">
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {[30, 60, 90, 180, 365].map((days) => (
              <button
                key={days}
                onClick={() => setChartDays(days)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  chartDays === days
                    ? 'bg-primary-500 text-white'
                    : 'bg-theme-elevated text-content-secondary hover:text-content-primary'
                }`}
              >
                {days <= 90 ? `${days}D` : days === 180 ? '6M' : '1Y'}
              </button>
            ))}
          </div>

          {/* Chart */}
          {chartData && (
            <WeightTrendChart
              data={chartData.data}
              stats={chartData.stats}
              unit={dataUnit}
              height={350}
            />
          )}
        </div>
      )}

      {/* History View */}
      {activeTab === 'history' && (
        <div className="bg-theme-surface border border-border-subtle rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
            <h2 className="font-semibold text-content-primary">Weight History</h2>
            <span className="text-sm text-content-tertiary">{logs.length} entries</span>
          </div>
          {logs.length === 0 ? (
            <div className="p-8 text-center text-content-tertiary">
              No weight entries yet. Start by logging your weight or importing data.
            </div>
          ) : (
            <div className="divide-y divide-border-subtle max-h-[600px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="px-4 py-3 flex items-center justify-between hover:bg-theme-elevated">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-lg font-semibold text-content-primary">
                        {parseFloat(log.weight).toFixed(1)}
                      </span>
                      <span className="text-content-secondary ml-1">{log.unit}</span>
                    </div>
                    {log.bodyFat && (
                      <span className="text-sm text-content-tertiary">
                        {parseFloat(log.bodyFat).toFixed(1)}% BF
                      </span>
                    )}
                    {log.notes && (
                      <span className="text-sm text-content-tertiary hidden sm:inline truncate max-w-[200px]">
                        {log.notes}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-content-tertiary">
                      {new Date(log.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-1.5 text-content-tertiary hover:text-red-500 rounded transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
