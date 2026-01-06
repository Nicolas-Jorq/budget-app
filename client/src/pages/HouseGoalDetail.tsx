import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { SavingsGoal, HouseGoalSummary, PropertySnapshot, ProviderStatus, HouseGoalMetadata } from '../types'
import PropertySearch from '../components/house/PropertySearch'
import PropertyCard from '../components/house/PropertyCard'
import MortgageCalculator from '../components/house/MortgageCalculator'
import HomeValuation from '../components/house/HomeValuation'

type Tab = 'overview' | 'search' | 'saved' | 'calculator' | 'valuation'

export default function HouseGoalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [goal, setGoal] = useState<SavingsGoal | null>(null)
  const [summary, setSummary] = useState<HouseGoalSummary | null>(null)
  const [savedProperties, setSavedProperties] = useState<PropertySnapshot[]>([])
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    if (!id) return

    try {
      setIsLoading(true)
      const [goalRes, summaryRes, propertiesRes, statusRes] = await Promise.all([
        api.get(`/goals/${id}`),
        api.get(`/goals/${id}/house/summary`).catch(() => ({ data: null })),
        api.get(`/goals/${id}/properties`).catch(() => ({ data: [] })),
        api.get('/house/providers/status').catch(() => ({ data: null })),
      ])

      if (goalRes.data.type !== 'HOUSE') {
        navigate('/goals')
        return
      }

      setGoal(goalRes.data)
      setSummary(summaryRes.data)
      setSavedProperties(propertiesRes.data)
      setProviderStatus(statusRes.data)
    } catch (err: any) {
      console.error('Error fetching house goal:', err)
      setError('Failed to load house goal')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleToggleFavorite = async (propertyId: string, isFavorite: boolean) => {
    if (!id) return

    try {
      await api.put(`/goals/${id}/properties/${propertyId}`, { isFavorite: !isFavorite })
      setSavedProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, isFavorite: !isFavorite } : p))
      )
    } catch (err) {
      console.error('Error toggling favorite:', err)
    }
  }

  const handleRemoveProperty = async (propertyId: string) => {
    if (!id) return

    try {
      await api.delete(`/goals/${id}/properties/${propertyId}`)
      setSavedProperties((prev) => prev.filter((p) => p.id !== propertyId))
    } catch (err) {
      console.error('Error removing property:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !goal) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Goal not found'}</p>
        <Link to="/goals" className="text-blue-600 hover:underline">
          Back to Goals
        </Link>
      </div>
    )
  }

  const houseMetadata = goal.metadata as HouseGoalMetadata | null
  const currentAmount = Number(goal.currentAmount)
  const targetAmount = Number(goal.targetAmount)
  const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'saved', label: 'Saved', icon: '❤️' },
    { id: 'calculator', label: 'Calculator', icon: '🧮' },
    { id: 'valuation', label: 'Valuation', icon: '💰' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/goals"
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🏠</span> {goal.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {houseMetadata?.targetLocation || 'House savings goal'}
            </p>
          </div>
        </div>

        {/* Provider Status Indicator */}
        {providerStatus && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <span className={`inline-flex items-center gap-1 ${providerStatus.realEstate.available ? 'text-green-500' : 'text-yellow-500'}`}>
              <span className={`w-2 h-2 rounded-full ${providerStatus.realEstate.available ? 'bg-green-500' : 'bg-yellow-500'}`} />
              {providerStatus.realEstate.name}
            </span>
          </div>
        )}
      </div>

      {/* Progress Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Progress to Goal</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              <span className="text-lg text-gray-500 dark:text-gray-400 font-normal">
                {' '}/ ${targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {percentage.toFixed(1)}%
            </p>
            {summary && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ${summary.progress.remainingForDownPayment.toLocaleString('en-US')} to go
              </p>
            )}
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Target Home Price</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ${summary.houseDetails.targetPrice.toLocaleString('en-US')}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Down Payment</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {summary.houseDetails.downPaymentPct}% (${summary.progress.downPaymentAmount.toLocaleString('en-US')})
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Est. Monthly Payment</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ${summary.mortgageEstimate.monthlyPayment.toLocaleString('en-US')}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Saved Properties</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {summary.savedProperties.total} ({summary.savedProperties.favorites} favorites)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'saved' && savedProperties.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
                  {savedProperties.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* House Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Target Property Details
              </h3>
              <dl className="space-y-3">
                {houseMetadata?.targetLocation && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Location</dt>
                    <dd className="text-gray-900 dark:text-white font-medium">
                      {houseMetadata.targetLocation}
                    </dd>
                  </div>
                )}
                {houseMetadata?.targetBedrooms && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Bedrooms</dt>
                    <dd className="text-gray-900 dark:text-white font-medium">
                      {houseMetadata.targetBedrooms}+
                    </dd>
                  </div>
                )}
                {houseMetadata?.targetBathrooms && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Bathrooms</dt>
                    <dd className="text-gray-900 dark:text-white font-medium">
                      {houseMetadata.targetBathrooms}+
                    </dd>
                  </div>
                )}
                {houseMetadata?.propertyType && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Property Type</dt>
                    <dd className="text-gray-900 dark:text-white font-medium capitalize">
                      {houseMetadata.propertyType.replace('_', ' ')}
                    </dd>
                  </div>
                )}
                {goal.deadline && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Target Date</dt>
                    <dd className="text-gray-900 dark:text-white font-medium">
                      {new Date(goal.deadline).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Quick Mortgage Estimate */}
            {summary && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Mortgage Estimate
                </h3>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400">Estimated Monthly Payment</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      ${summary.mortgageEstimate.monthlyPayment.toLocaleString('en-US')}
                    </p>
                  </div>

                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Loan Amount</span>
                      <span className="text-gray-900 dark:text-white">
                        ${summary.mortgageEstimate.loanAmount.toLocaleString('en-US')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Interest Rate (est.)</span>
                      <span className="text-gray-900 dark:text-white">
                        {summary.mortgageEstimate.interestRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Loan Term</span>
                      <span className="text-gray-900 dark:text-white">
                        {summary.mortgageEstimate.loanTermYears} years
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('calculator')}
                    className="w-full py-2 text-blue-600 dark:text-blue-400 text-sm hover:underline"
                  >
                    View detailed calculator
                  </button>
                </div>
              </div>
            )}

            {/* Favorite Properties Preview */}
            {savedProperties.filter((p) => p.isFavorite).length > 0 && (
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Favorite Properties
                  </h3>
                  <button
                    onClick={() => setActiveTab('saved')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View all saved
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedProperties
                    .filter((p) => p.isFavorite)
                    .slice(0, 3)
                    .map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        isSaved
                        showActions={false}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && id && (
          <PropertySearch
            goalId={id}
            initialLocation={houseMetadata?.targetLocation}
            initialBedrooms={houseMetadata?.targetBedrooms || undefined}
            initialBathrooms={houseMetadata?.targetBathrooms || undefined}
            initialPropertyType={houseMetadata?.propertyType || undefined}
            onPropertySaved={fetchData}
          />
        )}

        {activeTab === 'saved' && (
          <div>
            {savedProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isSaved
                    onToggleFavorite={() => handleToggleFavorite(property.id, property.isFavorite)}
                    onRemove={() => handleRemoveProperty(property.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p className="text-4xl mb-4">🏠</p>
                <p className="text-lg">No saved properties yet</p>
                <p className="text-sm mt-2">
                  Search for properties and save the ones you like!
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Start Searching
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'calculator' && (
          <MortgageCalculator
            initialHomePrice={houseMetadata?.targetPrice || summary?.houseDetails.targetPrice || 450000}
            initialDownPaymentPct={houseMetadata?.downPaymentPct || summary?.houseDetails.downPaymentPct || 20}
          />
        )}

        {activeTab === 'valuation' && <HomeValuation />}
      </div>
    </div>
  )
}
