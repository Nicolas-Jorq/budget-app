/**
 * @fileoverview Client-side TypeScript type definitions for the Budget App.
 *
 * This module contains all shared type definitions used throughout the React frontend,
 * including:
 * - Core domain models (User, Budget, Transaction)
 * - API response types
 * - Chart and visualization data types
 * - Savings goals and contributions
 * - Baby goal milestones and projections
 * - House goal and property types
 * - Bank statement import types
 * - Display configuration constants
 *
 * These types mirror the backend Prisma models and API response structures
 * to ensure type safety across the full stack.
 *
 * @module types
 */

// =============================================================================
// CORE DOMAIN TYPES
// =============================================================================

/**
 * Represents an authenticated user in the system.
 *
 * @interface User
 * @property {string} id - Unique identifier (CUID)
 * @property {string} email - User's email address (unique)
 * @property {string} name - User's display name
 * @property {string} createdAt - ISO 8601 timestamp of account creation
 * @property {string} updatedAt - ISO 8601 timestamp of last update
 */
export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

/**
 * Represents a budget category with spending limits.
 *
 * Budgets allow users to set spending limits for categories and
 * track actual spending against those limits.
 *
 * @interface Budget
 * @property {string} id - Unique identifier (CUID)
 * @property {string} name - User-friendly budget name (e.g., "Groceries")
 * @property {number} amount - Target budget amount (spending limit)
 * @property {number} spent - Current amount spent against this budget
 * @property {string} category - Category name for grouping
 * @property {string} userId - ID of the owning user
 * @property {string} createdAt - ISO 8601 timestamp of creation
 * @property {string} updatedAt - ISO 8601 timestamp of last update
 *
 * @example
 * const budget: Budget = {
 *   id: 'clx123...',
 *   name: 'Monthly Groceries',
 *   amount: 500,
 *   spent: 325.50,
 *   category: 'Groceries',
 *   userId: 'user123',
 *   createdAt: '2024-01-01T00:00:00Z',
 *   updatedAt: '2024-01-15T00:00:00Z'
 * };
 */
export interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  category: string
  userId: string
  createdAt: string
  updatedAt: string
}

/**
 * Represents a financial transaction (income or expense).
 *
 * Transactions are the core financial records that track money
 * flowing in and out of the user's accounts.
 *
 * @interface Transaction
 * @property {string} id - Unique identifier (CUID)
 * @property {string} description - Description of the transaction
 * @property {number} amount - Transaction amount (always positive)
 * @property {'income' | 'expense'} type - Whether money was received or spent
 * @property {string} category - Category for organization
 * @property {string} [budgetId] - Optional linked budget ID
 * @property {string} userId - ID of the owning user
 * @property {string} date - ISO 8601 date of the transaction
 * @property {string} createdAt - ISO 8601 timestamp of creation
 * @property {string} updatedAt - ISO 8601 timestamp of last update
 */
export interface Transaction {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  budgetId?: string
  userId: string
  date: string
  createdAt: string
  updatedAt: string
}

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

/**
 * Response from authentication endpoints (login/register).
 *
 * @interface AuthResponse
 * @property {User} user - The authenticated user's data
 * @property {string} token - JWT token for subsequent API requests
 */
export interface AuthResponse {
  user: User
  token: string
}

/**
 * Standardized API error response structure.
 *
 * @interface ApiError
 * @property {string} message - Human-readable error message
 * @property {number} statusCode - HTTP status code
 */
export interface ApiError {
  message: string
  statusCode: number
}

// =============================================================================
// DASHBOARD & CHART DATA TYPES
// =============================================================================

/**
 * Spending breakdown by category for pie/donut charts.
 *
 * @interface SpendingByCategory
 * @property {string} category - Category name
 * @property {number} amount - Total amount spent in this category
 * @property {number} percentage - Percentage of total spending (0-100)
 */
export interface SpendingByCategory {
  category: string
  amount: number
  percentage: number
}

/**
 * Monthly income vs expenses comparison for bar charts.
 *
 * @interface MonthlyComparison
 * @property {string} month - Month identifier (e.g., "Jan 2024")
 * @property {number} income - Total income for the month
 * @property {number} expenses - Total expenses for the month
 */
export interface MonthlyComparison {
  month: string
  income: number
  expenses: number
}

/**
 * Daily spending for trend line charts.
 *
 * @interface DailySpending
 * @property {string} date - ISO date string
 * @property {number} amount - Amount spent on this date
 */
export interface DailySpending {
  date: string
  amount: number
}

/**
 * Budget progress for budget utilization displays.
 *
 * @interface BudgetProgress
 * @property {string} id - Budget identifier
 * @property {string} name - Budget name
 * @property {string} category - Budget category
 * @property {number} spent - Amount spent
 * @property {number} limit - Budget limit
 * @property {number} percentage - Utilization percentage (0-100+)
 */
export interface BudgetProgress {
  id: string
  name: string
  category: string
  spent: number
  limit: number
  percentage: number
}

/**
 * Simplified transaction for recent activity displays.
 *
 * @interface RecentTransaction
 * @property {string} id - Transaction identifier
 * @property {string} description - Transaction description
 * @property {number} amount - Transaction amount
 * @property {'income' | 'expense'} type - Transaction type
 * @property {string} category - Transaction category
 * @property {string} date - Transaction date
 */
export interface RecentTransaction {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string
}

/**
 * Complete chart data bundle for dashboard displays.
 *
 * @interface ChartData
 * @property {SpendingByCategory[]} spendingByCategory - Category breakdown
 * @property {MonthlyComparison[]} monthlyComparison - Monthly comparison data
 * @property {DailySpending[]} dailySpending - Daily spending trend
 * @property {BudgetProgress[]} budgetProgress - Budget utilization
 * @property {RecentTransaction[]} recentTransactions - Recent activity
 */
export interface ChartData {
  spendingByCategory: SpendingByCategory[]
  monthlyComparison: MonthlyComparison[]
  dailySpending: DailySpending[]
  budgetProgress: BudgetProgress[]
  recentTransactions: RecentTransaction[]
}

// =============================================================================
// SAVINGS GOALS TYPES
// =============================================================================

/**
 * Types of savings goals supported by the application.
 *
 * @typedef {string} GoalType
 * - EMERGENCY_FUND: Emergency savings
 * - BABY: Baby-related expenses
 * - HOUSE: Home purchase down payment
 * - VEHICLE: Vehicle purchase
 * - VACATION: Travel and vacation
 * - EDUCATION: Education expenses
 * - RETIREMENT: Retirement savings
 * - CUSTOM: User-defined goal type
 */
export type GoalType =
  | 'EMERGENCY_FUND'
  | 'BABY'
  | 'HOUSE'
  | 'VEHICLE'
  | 'VACATION'
  | 'EDUCATION'
  | 'RETIREMENT'
  | 'CUSTOM'

/**
 * Represents a savings goal with progress tracking.
 *
 * Savings goals allow users to set targets and track progress
 * through contributions over time.
 *
 * @interface SavingsGoal
 * @property {string} id - Unique identifier (CUID)
 * @property {string} name - Goal name
 * @property {GoalType} type - Category of goal
 * @property {number} targetAmount - Target amount to save
 * @property {number} currentAmount - Amount saved so far
 * @property {string | null} deadline - Optional target date
 * @property {number} priority - Sort priority (lower = higher priority)
 * @property {string | null} icon - Optional icon identifier
 * @property {string | null} color - Optional theme color
 * @property {Record<string, unknown> | null} metadata - Goal-specific metadata
 * @property {boolean} isCompleted - Whether goal is achieved
 * @property {string} userId - Owner's user ID
 * @property {Contribution[]} [contributions] - Recent contributions
 * @property {Object} [_count] - Contribution count
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 */
export interface SavingsGoal {
  id: string
  name: string
  type: GoalType
  targetAmount: number
  currentAmount: number
  deadline: string | null
  priority: number
  icon: string | null
  color: string | null
  metadata: Record<string, unknown> | null
  isCompleted: boolean
  userId: string
  contributions?: Contribution[]
  _count?: {
    contributions: number
  }
  createdAt: string
  updatedAt: string
}

/**
 * Represents a contribution to a savings goal.
 *
 * @interface Contribution
 * @property {string} id - Unique identifier
 * @property {number} amount - Contribution amount
 * @property {string | null} note - Optional note
 * @property {string} goalId - Parent goal ID
 * @property {string | null} transactionId - Linked transaction ID
 * @property {Object} [transaction] - Linked transaction details
 * @property {string} createdAt - Creation timestamp
 */
export interface Contribution {
  id: string
  amount: number
  note: string | null
  goalId: string
  transactionId: string | null
  transaction?: {
    id: string
    description: string
    date: string
    amount?: number
  }
  createdAt: string
}

/**
 * Aggregated summary of all savings goals for dashboard.
 *
 * @interface GoalsSummary
 * @property {Array} goals - List of goals with essential fields
 * @property {number} totalTarget - Sum of all target amounts
 * @property {number} totalSaved - Sum of all saved amounts
 * @property {number} completedCount - Number of completed goals
 * @property {number} activeCount - Number of active goals
 * @property {number} overallProgress - Overall progress percentage (0-100)
 */
export interface GoalsSummary {
  goals: Pick<SavingsGoal, 'id' | 'name' | 'type' | 'targetAmount' | 'currentAmount' | 'deadline' | 'isCompleted' | 'color' | 'icon'>[]
  totalTarget: number
  totalSaved: number
  completedCount: number
  activeCount: number
  overallProgress: number
}

/**
 * Display configuration for goal types.
 * Maps each GoalType to its label, icon, and theme color.
 */
export const GOAL_TYPE_INFO: Record<GoalType, { label: string; icon: string; color: string }> = {
  EMERGENCY_FUND: { label: 'Emergency Fund', icon: '🛡️', color: '#ef4444' },
  BABY: { label: 'Baby', icon: '👶', color: '#ec4899' },
  HOUSE: { label: 'House', icon: '🏠', color: '#3b82f6' },
  VEHICLE: { label: 'Vehicle', icon: '🚗', color: '#6366f1' },
  VACATION: { label: 'Vacation', icon: '✈️', color: '#14b8a6' },
  EDUCATION: { label: 'Education', icon: '🎓', color: '#f59e0b' },
  RETIREMENT: { label: 'Retirement', icon: '🏖️', color: '#8b5cf6' },
  CUSTOM: { label: 'Custom', icon: '🎯', color: '#64748b' },
}

// =============================================================================
// BABY GOALS TYPES
// =============================================================================

/**
 * Categories for baby-related milestones and expenses.
 *
 * @typedef {string} MilestoneCategory
 * - PRE_BIRTH: Prenatal care and preparation
 * - NURSERY: Nursery furniture and setup
 * - GEAR: Baby gear and equipment
 * - FIRST_YEAR: First year essentials
 * - CHILDCARE: Daycare and childcare
 * - HEALTHCARE: Medical and health expenses
 * - EDUCATION: Education fund
 */
export type MilestoneCategory =
  | 'PRE_BIRTH'
  | 'NURSERY'
  | 'GEAR'
  | 'FIRST_YEAR'
  | 'CHILDCARE'
  | 'HEALTHCARE'
  | 'EDUCATION'

/**
 * Represents a baby expense milestone within a baby goal.
 *
 * @interface BabyMilestone
 * @property {string} id - Unique identifier
 * @property {string} goalId - Parent baby goal ID
 * @property {string} name - Milestone name
 * @property {MilestoneCategory} category - Category of expense
 * @property {number} targetAmount - Target amount for this milestone
 * @property {number} currentAmount - Amount saved for this milestone
 * @property {boolean} isCompleted - Whether milestone is funded
 * @property {number | null} dueMonth - Target month (months from birth)
 * @property {string | null} notes - Optional notes
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 */
export interface BabyMilestone {
  id: string
  goalId: string
  name: string
  category: MilestoneCategory
  targetAmount: number
  currentAmount: number
  isCompleted: boolean
  dueMonth: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Metadata stored with baby-type savings goals.
 *
 * @interface BabyGoalMetadata
 * @property {string} [babyName] - Baby's name (if known)
 * @property {string} [expectedDueDate] - Expected due date
 * @property {string} [actualBirthDate] - Actual birth date
 * @property {boolean} isPregnancy - Whether currently expecting
 */
export interface BabyGoalMetadata {
  babyName?: string
  expectedDueDate?: string
  actualBirthDate?: string
  isPregnancy: boolean
}

/**
 * Projected expense for baby planning.
 *
 * @interface ExpenseProjection
 * @property {MilestoneCategory} category - Expense category
 * @property {string} label - Display label
 * @property {number} estimatedCost - Estimated expense amount
 * @property {number} currentSaved - Amount already saved
 * @property {number} dueMonth - Target month from birth
 * @property {boolean} isOverdue - Whether past due date
 * @property {boolean} hasExistingMilestone - Whether milestone exists
 * @property {number} percentComplete - Progress percentage
 */
export interface ExpenseProjection {
  category: MilestoneCategory
  label: string
  estimatedCost: number
  currentSaved: number
  dueMonth: number
  isOverdue: boolean
  hasExistingMilestone: boolean
  percentComplete: number
}

/**
 * Response from projections API endpoint.
 *
 * @interface ProjectionsResponse
 * @property {ExpenseProjection[]} projections - List of projections
 * @property {number} totalProjected - Total projected expenses
 * @property {number} totalSaved - Total amount saved
 * @property {number} shortfall - Remaining amount needed
 * @property {number} percentComplete - Overall progress
 * @property {number} currentMonthFromBirth - Months since/until birth
 * @property {string | null} dueDate - Due date if pregnancy
 */
export interface ProjectionsResponse {
  projections: ExpenseProjection[]
  totalProjected: number
  totalSaved: number
  shortfall: number
  percentComplete: number
  currentMonthFromBirth: number
  dueDate: string | null
}

/**
 * Phase in the baby timeline (e.g., "Before Birth", "First 3 Months").
 *
 * @interface TimelinePhase
 * @property {string} name - Phase name
 * @property {Array} milestones - Milestones in this phase
 * @property {number} totalTarget - Total target for phase
 * @property {number} totalSaved - Total saved for phase
 */
export interface TimelinePhase {
  name: string
  milestones: {
    id: string
    name: string
    category: MilestoneCategory
    targetAmount: number
    currentAmount: number
    isCompleted: boolean
    dueMonth: number | null
    percentComplete: number
  }[]
  totalTarget: number
  totalSaved: number
}

/**
 * Complete timeline response for baby goal visualization.
 *
 * @interface TimelineResponse
 * @property {string} goalId - Baby goal ID
 * @property {string} goalName - Baby goal name
 * @property {string | null} dueDate - Due date
 * @property {boolean} isPregnancy - Pregnancy status
 * @property {string} [babyName] - Baby's name
 * @property {TimelinePhase[]} phases - Timeline phases
 * @property {number} totalMilestones - Total milestone count
 * @property {number} completedMilestones - Completed milestone count
 */
export interface TimelineResponse {
  goalId: string
  goalName: string
  dueDate: string | null
  isPregnancy: boolean
  babyName?: string
  phases: TimelinePhase[]
  totalMilestones: number
  completedMilestones: number
}

/**
 * Display configuration for milestone categories.
 * Maps each category to its label, icon, color, and default amount.
 */
export const MILESTONE_CATEGORY_INFO: Record<MilestoneCategory, { label: string; icon: string; color: string; defaultAmount: number }> = {
  PRE_BIRTH: { label: 'Pre-Birth', icon: '🤰', color: '#ec4899', defaultAmount: 2500 },
  NURSERY: { label: 'Nursery', icon: '🛏️', color: '#8b5cf6', defaultAmount: 2000 },
  GEAR: { label: 'Gear & Equipment', icon: '🍼', color: '#3b82f6', defaultAmount: 1500 },
  FIRST_YEAR: { label: 'First Year', icon: '👶', color: '#10b981', defaultAmount: 3000 },
  CHILDCARE: { label: 'Childcare', icon: '🏫', color: '#f59e0b', defaultAmount: 12000 },
  HEALTHCARE: { label: 'Healthcare', icon: '🏥', color: '#ef4444', defaultAmount: 2000 },
  EDUCATION: { label: 'Education Fund', icon: '🎓', color: '#6366f1', defaultAmount: 5000 },
}

// =============================================================================
// HOUSE GOALS TYPES
// =============================================================================

/**
 * Types of properties supported for house goals.
 *
 * @typedef {string} PropertyType
 */
export type PropertyType =
  | 'single_family'
  | 'condo'
  | 'townhouse'
  | 'multi_family'
  | 'apartment'
  | 'land'
  | 'other'

/**
 * House-specific configuration for a house savings goal.
 *
 * @interface HouseGoal
 * @property {string} id - Unique identifier
 * @property {string} goalId - Parent savings goal ID
 * @property {number} targetPrice - Target home price
 * @property {string | null} targetLocation - Target city/state/ZIP
 * @property {number | null} targetBedrooms - Desired bedrooms
 * @property {number | null} targetBathrooms - Desired bathrooms
 * @property {number} downPaymentPct - Down payment percentage (0-100)
 * @property {PropertyType | null} propertyType - Desired property type
 * @property {unknown | null} savedSearches - Saved search criteria
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 * @property {PropertySnapshot[]} [savedProperties] - Saved property listings
 */
export interface HouseGoal {
  id: string
  goalId: string
  targetPrice: number
  targetLocation: string | null
  targetBedrooms: number | null
  targetBathrooms: number | null
  downPaymentPct: number
  propertyType: PropertyType | null
  savedSearches: unknown | null
  createdAt: string
  updatedAt: string
  savedProperties?: PropertySnapshot[]
}

/**
 * Metadata for house goal stored in parent SavingsGoal.
 *
 * @interface HouseGoalMetadata
 */
export interface HouseGoalMetadata {
  targetPrice?: number
  targetLocation?: string
  targetBedrooms?: number
  targetBathrooms?: number
  downPaymentPct?: number
  propertyType?: PropertyType
}

/**
 * Saved property snapshot for comparison and tracking.
 *
 * @interface PropertySnapshot
 * @property {string} id - Unique identifier
 * @property {string} houseGoalId - Parent house goal ID
 * @property {string | null} zpid - Zillow property ID
 * @property {string} address - Street address
 * @property {string} city - City
 * @property {string} state - State
 * @property {string} zipCode - ZIP code
 * @property {number} price - Listing price
 * @property {number | null} bedrooms - Number of bedrooms
 * @property {number | null} bathrooms - Number of bathrooms
 * @property {number | null} sqft - Square footage
 * @property {number | null} yearBuilt - Year built
 * @property {string | null} propertyType - Property type
 * @property {number | null} zestimate - Zillow estimate
 * @property {string | null} imageUrl - Property image URL
 * @property {string | null} listingUrl - Listing page URL
 * @property {boolean} isFavorite - User favorite status
 * @property {string | null} notes - User notes
 * @property {string} capturedAt - Snapshot timestamp
 */
export interface PropertySnapshot {
  id: string
  houseGoalId: string
  zpid: string | null
  address: string
  city: string
  state: string
  zipCode: string
  price: number
  bedrooms: number | null
  bathrooms: number | null
  sqft: number | null
  yearBuilt: number | null
  propertyType: string | null
  zestimate: number | null
  imageUrl: string | null
  listingUrl: string | null
  isFavorite: boolean
  notes: string | null
  capturedAt: string
}

/**
 * Property listing from real estate API search results.
 *
 * @interface PropertyListing
 * @property {string} id - Provider-specific property ID
 * @property {string} address - Street address
 * @property {string} city - City
 * @property {string} state - State
 * @property {string} zipCode - ZIP code
 * @property {number} price - Listing price
 * @property {number} bedrooms - Number of bedrooms
 * @property {number} bathrooms - Number of bathrooms
 * @property {number} sqft - Square footage
 * @property {number} [yearBuilt] - Year built
 * @property {PropertyType} propertyType - Property type
 * @property {string} [imageUrl] - Primary image URL
 * @property {string} [listingUrl] - Full listing URL
 * @property {number} [latitude] - Latitude coordinate
 * @property {number} [longitude] - Longitude coordinate
 * @property {number} [lotSize] - Lot size in sqft
 * @property {string} [description] - Listing description
 * @property {number} [daysOnMarket] - Days since listing
 * @property {number} [pricePerSqft] - Price per square foot
 */
export interface PropertyListing {
  id: string
  address: string
  city: string
  state: string
  zipCode: string
  price: number
  bedrooms: number
  bathrooms: number
  sqft: number
  yearBuilt?: number
  propertyType: PropertyType
  imageUrl?: string
  listingUrl?: string
  latitude?: number
  longitude?: number
  lotSize?: number
  description?: string
  daysOnMarket?: number
  pricePerSqft?: number
}

/**
 * Home valuation estimate from real estate API.
 *
 * @interface HomeValuation
 * @property {string} address - Property address
 * @property {number} zestimate - Estimated value
 * @property {number} [rentZestimate] - Estimated monthly rent
 * @property {Object} valueRange - Value range estimate
 * @property {string} lastUpdated - Last update timestamp
 * @property {number} [taxAssessment] - Tax assessed value
 * @property {number} [yearBuilt] - Year built
 * @property {number} [sqft] - Square footage
 */
export interface HomeValuation {
  address: string
  zestimate: number
  rentZestimate?: number
  valueRange: {
    low: number
    high: number
  }
  lastUpdated: string
  taxAssessment?: number
  yearBuilt?: number
  sqft?: number
}

/**
 * Mortgage payment calculation results.
 *
 * @interface MortgageCalculation
 * @property {number} homePrice - Home purchase price
 * @property {number} downPayment - Down payment amount
 * @property {number} downPaymentPercent - Down payment percentage
 * @property {number} loanAmount - Loan principal
 * @property {number} interestRate - Annual interest rate
 * @property {number} loanTermYears - Loan term in years
 * @property {number} monthlyPayment - Total monthly payment
 * @property {Object} monthlyBreakdown - Payment breakdown
 * @property {number} totalPayment - Total paid over loan term
 * @property {number} totalInterest - Total interest paid
 */
export interface MortgageCalculation {
  homePrice: number
  downPayment: number
  downPaymentPercent: number
  loanAmount: number
  interestRate: number
  loanTermYears: number
  monthlyPayment: number
  monthlyBreakdown: {
    principal: number
    interest: number
    propertyTax: number
    homeInsurance: number
    pmi?: number
  }
  totalPayment: number
  totalInterest: number
}

/**
 * AI-generated market insight analysis.
 *
 * @interface MarketInsight
 * @property {string} summary - Brief summary
 * @property {string} analysis - Detailed analysis
 * @property {string[]} factors - Key factors considered
 * @property {string} [recommendation] - Recommendation if applicable
 * @property {'low' | 'medium' | 'high'} confidence - Confidence level
 * @property {string} disclaimer - Legal/accuracy disclaimer
 */
export interface MarketInsight {
  summary: string
  analysis: string
  factors: string[]
  recommendation?: string
  confidence: 'low' | 'medium' | 'high'
  disclaimer: string
}

/**
 * Complete house goal summary for dashboard.
 *
 * @interface HouseGoalSummary
 * @property {Object} goal - Parent savings goal info
 * @property {Object} houseDetails - House-specific configuration
 * @property {Object} progress - Down payment progress tracking
 * @property {MortgageCalculation} mortgageEstimate - Estimated mortgage
 * @property {Object} savedProperties - Saved property counts
 */
export interface HouseGoalSummary {
  goal: {
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    deadline: string | null
    isCompleted: boolean
  }
  houseDetails: {
    targetPrice: number
    targetLocation: string | null
    targetBedrooms: number | null
    targetBathrooms: number | null
    downPaymentPct: number
    propertyType: string | null
  }
  progress: {
    downPaymentAmount: number
    currentSaved: number
    remainingForDownPayment: number
    progressPercent: number
  }
  mortgageEstimate: MortgageCalculation
  savedProperties: {
    total: number
    favorites: number
  }
}

/**
 * Status of external API providers.
 *
 * @interface ProviderStatus
 * @property {Object} realEstate - Real estate API provider status
 * @property {Object} llm - LLM provider status
 */
export interface ProviderStatus {
  realEstate: {
    type: string
    name: string
    available: boolean
    missingEnv: string[]
  }
  llm: {
    type: string
    name: string
    available: boolean
    missingEnv: string[]
  }
}

/**
 * Display configuration for property types.
 * Maps each property type to its label and icon.
 */
export const PROPERTY_TYPE_INFO: Record<PropertyType, { label: string; icon: string }> = {
  single_family: { label: 'Single Family', icon: '🏠' },
  condo: { label: 'Condo', icon: '🏢' },
  townhouse: { label: 'Townhouse', icon: '🏘️' },
  multi_family: { label: 'Multi-Family', icon: '🏗️' },
  apartment: { label: 'Apartment', icon: '🏬' },
  land: { label: 'Land', icon: '🌳' },
  other: { label: 'Other', icon: '🏛️' },
}

// =============================================================================
// BANK STATEMENT IMPORT TYPES
// =============================================================================

/**
 * Types of bank accounts supported for statement import.
 *
 * @typedef {string} AccountType
 */
export type AccountType = 'CREDIT_CARD' | 'CHECKING' | 'SAVINGS' | 'INVESTMENT'

/**
 * Processing status for uploaded bank documents.
 *
 * @typedef {string} DocumentStatus
 * - PENDING: Awaiting processing
 * - PROCESSING: Currently being analyzed
 * - EXTRACTED: Transactions extracted, ready for review
 * - REVIEWED: User has reviewed transactions
 * - IMPORTED: Transactions imported to main ledger
 * - FAILED: Processing failed
 */
export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'EXTRACTED' | 'REVIEWED' | 'IMPORTED' | 'FAILED'

/**
 * Status of extracted pending transactions.
 *
 * @typedef {string} PendingTransactionStatus
 * - PENDING: Awaiting user review
 * - APPROVED: Approved for import
 * - REJECTED: Rejected by user
 * - IMPORTED: Successfully imported
 * - DUPLICATE: Detected as duplicate
 */
export type PendingTransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IMPORTED' | 'DUPLICATE'

/**
 * Bank account for organizing statement uploads.
 *
 * @interface BankAccount
 * @property {string} id - Unique identifier
 * @property {string} name - User-friendly name
 * @property {string} bankName - Financial institution name
 * @property {AccountType} accountType - Type of account
 * @property {string | null} lastFour - Last 4 digits of account number
 * @property {boolean} isActive - Whether account is active
 * @property {string} userId - Owner's user ID
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 * @property {Object} [_count] - Document count aggregation
 */
export interface BankAccount {
  id: string
  name: string
  bankName: string
  accountType: AccountType
  lastFour: string | null
  isActive: boolean
  userId: string
  createdAt: string
  updatedAt: string
  _count?: {
    documents: number
  }
}

/**
 * Uploaded bank statement document.
 *
 * @interface BankDocument
 * @property {string} id - Unique identifier
 * @property {string} filename - Stored filename
 * @property {string} originalName - Original upload filename
 * @property {number} fileSize - File size in bytes
 * @property {string} mimeType - File MIME type
 * @property {DocumentStatus} status - Processing status
 * @property {string | null} statementStartDate - Statement period start
 * @property {string | null} statementEndDate - Statement period end
 * @property {number | null} transactionCount - Extracted transaction count
 * @property {string | null} llmProvider - LLM provider used
 * @property {string | null} llmModel - LLM model used
 * @property {number | null} processingTimeMs - Processing duration
 * @property {string | null} processingError - Error message if failed
 * @property {string} uploadedAt - Upload timestamp
 * @property {string | null} processedAt - Processing completion timestamp
 * @property {Object} [bankAccount] - Associated bank account
 */
export interface BankDocument {
  id: string
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  status: DocumentStatus
  statementStartDate: string | null
  statementEndDate: string | null
  transactionCount: number | null
  llmProvider: string | null
  llmModel: string | null
  processingTimeMs: number | null
  processingError: string | null
  uploadedAt: string
  processedAt: string | null
  bankAccount?: {
    id: string
    name: string
    bankName: string
  } | null
}

/**
 * Transaction extracted from bank statement awaiting import.
 *
 * @interface PendingTransaction
 * @property {string} id - Unique identifier
 * @property {string} date - Transaction date
 * @property {string} description - Cleaned description
 * @property {string | null} originalDescription - Original from statement
 * @property {number} amount - Transaction amount
 * @property {'INCOME' | 'EXPENSE'} type - Transaction type
 * @property {string | null} category - AI-suggested category
 * @property {number | null} confidence - AI confidence score (0-1)
 * @property {PendingTransactionStatus} status - Review status
 * @property {string | null} userCategory - User-assigned category
 * @property {string | null} userNotes - User notes
 */
export interface PendingTransaction {
  id: string
  date: string
  description: string
  originalDescription: string | null
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: string | null
  confidence: number | null
  status: PendingTransactionStatus
  userCategory: string | null
  userNotes: string | null
}

/**
 * Document with its extracted transactions for review page.
 *
 * @interface DocumentWithTransactions
 * @property {BankDocument} document - The document metadata
 * @property {PendingTransaction[]} transactions - Extracted transactions
 */
export interface DocumentWithTransactions {
  document: BankDocument
  transactions: PendingTransaction[]
}

/**
 * LLM provider configuration and availability.
 *
 * @interface LLMProvider
 * @property {string} id - Provider identifier
 * @property {string} name - Display name
 * @property {string} description - Provider description
 * @property {boolean} available - Whether provider is configured
 * @property {string | null} setup_url - Setup documentation URL
 * @property {string[]} setup_steps - Setup instructions
 */
export interface LLMProvider {
  id: string
  name: string
  description: string
  available: boolean
  setup_url: string | null
  setup_steps: string[]
}

/**
 * Summary statistics for a document's transactions.
 *
 * @interface DocumentSummary
 * @property {string} document_id - Document identifier
 * @property {Object} by_status - Transaction counts by status
 * @property {Array} by_category - Transaction counts by category
 * @property {number} ready_to_import - Count ready for import
 */
export interface DocumentSummary {
  document_id: string
  by_status: Record<PendingTransactionStatus, { count: number; total: number }>
  by_category: Array<{ category: string; count: number; total: number }>
  ready_to_import: number
}

/**
 * Display configuration for account types.
 * Maps each account type to its label and icon.
 */
export const ACCOUNT_TYPE_INFO: Record<AccountType, { label: string; icon: string }> = {
  CREDIT_CARD: { label: 'Credit Card', icon: '💳' },
  CHECKING: { label: 'Checking', icon: '🏦' },
  SAVINGS: { label: 'Savings', icon: '💰' },
  INVESTMENT: { label: 'Investment', icon: '📈' },
}

/**
 * Display configuration for document statuses.
 * Maps each status to its label and Tailwind color class.
 */
export const DOCUMENT_STATUS_INFO: Record<DocumentStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-gray-500' },
  PROCESSING: { label: 'Processing', color: 'bg-blue-500' },
  EXTRACTED: { label: 'Ready for Review', color: 'bg-yellow-500' },
  REVIEWED: { label: 'Reviewed', color: 'bg-purple-500' },
  IMPORTED: { label: 'Imported', color: 'bg-green-500' },
  FAILED: { label: 'Failed', color: 'bg-red-500' },
}

/**
 * Display configuration for pending transaction statuses.
 * Maps each status to its label and Tailwind color class.
 */
export const TRANSACTION_STATUS_INFO: Record<PendingTransactionStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending Review', color: 'bg-gray-500' },
  APPROVED: { label: 'Approved', color: 'bg-green-500' },
  REJECTED: { label: 'Rejected', color: 'bg-red-500' },
  IMPORTED: { label: 'Imported', color: 'bg-blue-500' },
  DUPLICATE: { label: 'Duplicate', color: 'bg-orange-500' },
}
