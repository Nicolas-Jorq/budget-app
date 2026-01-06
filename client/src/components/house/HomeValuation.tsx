import { useState } from 'react'
import api from '../../services/api'
import { HomeValuation as HomeValuationType } from '../../types'

export default function HomeValuation() {
  const [address, setAddress] = useState('')
  const [result, setResult] = useState<HomeValuationType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address.trim()) {
      setError('Please enter an address')
      return
    }

    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await api.get(`/house/valuation?address=${encodeURIComponent(address)}`)
      setResult(response.data)
    } catch (err: any) {
      console.error('Valuation error:', err)
      if (err.response?.status === 404) {
        setError('Could not find valuation for this address. Try a more specific address.')
      } else {
        setError('Failed to get valuation. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>📊</span> Home Valuation
      </h3>

      <form onSubmit={handleSubmit} className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Enter Address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Austin, TX 78701"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Get Estimate'}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estimated Value</p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              ${result.zestimate.toLocaleString('en-US')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {result.address}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Value Range</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                ${result.valueRange.low.toLocaleString('en-US')} - ${result.valueRange.high.toLocaleString('en-US')}
              </p>
            </div>

            {result.rentZestimate && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rent Estimate</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  ${result.rentZestimate.toLocaleString('en-US')}/mo
                </p>
              </div>
            )}

            {result.taxAssessment && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tax Assessment</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  ${result.taxAssessment.toLocaleString('en-US')}
                </p>
              </div>
            )}

            {result.sqft && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Size</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {result.sqft.toLocaleString()} sqft
                  <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                    (${Math.round(result.zestimate / result.sqft)}/sqft)
                  </span>
                </p>
              </div>
            )}

            {result.yearBuilt && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Year Built</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {result.yearBuilt}
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Last updated: {new Date(result.lastUpdated).toLocaleDateString()}
          </p>
        </div>
      )}

      {!result && !error && !isLoading && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          <p>Enter an address to get an estimated home value.</p>
          <p className="text-sm mt-2">Include street address, city, state, and ZIP for best results.</p>
        </div>
      )}
    </div>
  )
}
