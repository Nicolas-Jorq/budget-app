import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import {
  SavingsGoal,
  BabyMilestone,
  BabyGoalMetadata,
  TimelineResponse,
  ProjectionsResponse,
  MILESTONE_CATEGORY_INFO,
} from '../types'
import BabyMilestoneCard from '../components/baby/BabyMilestoneCard'
import BabyMilestoneForm from '../components/baby/BabyMilestoneForm'
import MilestoneContributionForm from '../components/baby/MilestoneContributionForm'
import GoalForm from '../components/GoalForm'

type TabType = 'overview' | 'milestones' | 'timeline' | 'projections'

export default function BabyGoalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [goal, setGoal] = useState<SavingsGoal | null>(null)
  const [milestones, setMilestones] = useState<BabyMilestone[]>([])
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null)
  const [projections, setProjections] = useState<ProjectionsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Form states
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [showContributionForm, setShowContributionForm] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<BabyMilestone | null>(null)
  const [contributingMilestone, setContributingMilestone] = useState<BabyMilestone | null>(null)

  const fetchData = async () => {
    if (!id) return
    try {
      const [goalRes, milestonesRes, timelineRes, projectionsRes] = await Promise.all([
        api.get(`/goals/${id}`),
        api.get(`/goals/${id}/milestones`),
        api.get(`/goals/${id}/timeline`),
        api.get(`/goals/${id}/projections`),
      ])
      setGoal(goalRes.data)
      setMilestones(milestonesRes.data)
      setTimeline(timelineRes.data)
      setProjections(projectionsRes.data)
    } catch (error) {
      console.error('Failed to fetch baby goal data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this goal? All milestones will be lost.')) return
    try {
      await api.delete(`/goals/${id}`)
      navigate('/goals')
    } catch (error) {
      console.error('Failed to delete goal:', error)
    }
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!id || !confirm('Are you sure you want to delete this milestone?')) return
    try {
      await api.delete(`/goals/${id}/milestones/${milestoneId}`)
      fetchData()
    } catch (error) {
      console.error('Failed to delete milestone:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Goal not found</p>
        <Link to="/goals" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to Goals
        </Link>
      </div>
    )
  }

  const metadata = goal.metadata as BabyGoalMetadata | null
  const percentage = goal.targetAmount > 0
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0

  // Calculate days until due date
  const getDaysUntilDue = () => {
    const dueDate = metadata?.expectedDueDate || metadata?.actualBirthDate
    if (!dueDate) return null
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilDue = getDaysUntilDue()

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/goals"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-2 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Goals
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{metadata?.isPregnancy ? '🤰' : '👶'}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {goal.name}
                {metadata?.babyName && (
                  <span className="text-gray-500 dark:text-gray-400"> - {metadata.babyName}</span>
                )}
              </h1>
              {metadata?.expectedDueDate && metadata.isPregnancy && (
                <p className="text-gray-500 dark:text-gray-400">
                  Due: {new Date(metadata.expectedDueDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {daysUntilDue !== null && daysUntilDue > 0 && (
                    <span className="ml-2 text-pink-600 dark:text-pink-400">
                      ({daysUntilDue} days to go!)
                    </span>
                  )}
                </p>
              )}
              {metadata?.actualBirthDate && !metadata.isPregnancy && (
                <p className="text-gray-500 dark:text-gray-400">
                  Born: {new Date(metadata.actualBirthDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGoalForm(true)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600 dark:text-gray-400">Total Progress</span>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
            ${goal.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
          <div
            className="h-3 rounded-full bg-pink-500 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">{percentage.toFixed(1)}% complete</span>
          <span className="text-gray-900 dark:text-white">
            ${goal.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} target
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-4">
          {(['overview', 'milestones', 'timeline', 'projections'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Milestones</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {milestones.filter(m => m.isCompleted).length}/{milestones.length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Saved</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${goal.currentAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${Math.max(goal.targetAmount - goal.currentAmount, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {metadata?.isPregnancy ? 'Expecting' : 'Born'}
              </p>
            </div>
          </div>

          {/* Recent milestones */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Milestones</h2>
              <button
                onClick={() => setActiveTab('milestones')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                View all
              </button>
            </div>
            {milestones.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {milestones.slice(0, 3).map((milestone) => (
                  <BabyMilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    onContribute={() => {
                      setContributingMilestone(milestone)
                      setShowContributionForm(true)
                    }}
                    onEdit={() => {
                      setEditingMilestone(milestone)
                      setShowMilestoneForm(true)
                    }}
                    onDelete={() => handleDeleteMilestone(milestone.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-3">No milestones yet</p>
                <button
                  onClick={() => {
                    setEditingMilestone(null)
                    setShowMilestoneForm(true)
                  }}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Add your first milestone
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'milestones' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Milestones ({milestones.length})
            </h2>
            <button
              onClick={() => {
                setEditingMilestone(null)
                setShowMilestoneForm(true)
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              + Add Milestone
            </button>
          </div>
          {milestones.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {milestones.map((milestone) => (
                <BabyMilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onContribute={() => {
                    setContributingMilestone(milestone)
                    setShowContributionForm(true)
                  }}
                  onEdit={() => {
                    setEditingMilestone(milestone)
                    setShowMilestoneForm(true)
                  }}
                  onDelete={() => handleDeleteMilestone(milestone.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No milestones yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Break down your baby savings into manageable milestones
              </p>
              <button
                onClick={() => {
                  setEditingMilestone(null)
                  setShowMilestoneForm(true)
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Add Your First Milestone
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'timeline' && timeline && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Savings Timeline
            </h2>
            {timeline.phases.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                {timeline.phases.map((phase, index) => (
                  <div key={phase.name} className="relative pl-10 pb-8 last:pb-0">
                    {/* Timeline dot */}
                    <div className="absolute left-2 w-5 h-5 rounded-full bg-pink-500 border-4 border-white dark:border-gray-800" />

                    <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                      {phase.name}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ${phase.totalSaved.toLocaleString()} / ${phase.totalTarget.toLocaleString()}
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {phase.milestones.map((m) => {
                        const catInfo = MILESTONE_CATEGORY_INFO[m.category]
                        return (
                          <div
                            key={m.id}
                            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center gap-3"
                          >
                            <span className="text-xl">{catInfo.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {m.name}
                              </p>
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                                <div
                                  className="h-1.5 rounded-full"
                                  style={{
                                    width: `${m.percentComplete}%`,
                                    backgroundColor: m.isCompleted ? '#10b981' : catInfo.color,
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {m.percentComplete}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Add milestones to see your timeline
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'projections' && projections && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Projected</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${projections.totalProjected.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Saved</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${projections.totalSaved.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Shortfall</p>
              <p className={`text-2xl font-bold ${projections.shortfall > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                ${projections.shortfall.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {projections.percentComplete}%
              </p>
            </div>
          </div>

          {/* Projections by category */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Expense Projections by Category
            </h2>
            <div className="space-y-4">
              {projections.projections.map((proj) => {
                const catInfo = MILESTONE_CATEGORY_INFO[proj.category]
                return (
                  <div key={proj.category} className="flex items-center gap-4">
                    <span className="text-2xl w-8">{catInfo.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {proj.label}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ${proj.currentSaved.toLocaleString()} / ${proj.estimatedCost.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${proj.percentComplete}%`,
                            backgroundColor: proj.percentComplete >= 100 ? '#10b981' : catInfo.color,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className={proj.isOverdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}>
                          {proj.isOverdue ? 'Overdue' : `Target: month ${proj.dueMonth}`}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {proj.percentComplete}% funded
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showGoalForm && (
        <GoalForm
          goal={goal}
          onClose={() => setShowGoalForm(false)}
          onSuccess={() => {
            setShowGoalForm(false)
            fetchData()
          }}
        />
      )}

      {showMilestoneForm && id && (
        <BabyMilestoneForm
          goalId={id}
          milestone={editingMilestone}
          onClose={() => {
            setShowMilestoneForm(false)
            setEditingMilestone(null)
          }}
          onSuccess={() => {
            setShowMilestoneForm(false)
            setEditingMilestone(null)
            fetchData()
          }}
        />
      )}

      {showContributionForm && contributingMilestone && id && (
        <MilestoneContributionForm
          goalId={id}
          milestone={contributingMilestone}
          onClose={() => {
            setShowContributionForm(false)
            setContributingMilestone(null)
          }}
          onSuccess={() => {
            setShowContributionForm(false)
            setContributingMilestone(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}
