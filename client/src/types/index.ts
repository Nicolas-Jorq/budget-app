export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

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

export interface AuthResponse {
  user: User
  token: string
}

export interface ApiError {
  message: string
  statusCode: number
}

// Chart Data Types
export interface SpendingByCategory {
  category: string
  amount: number
  percentage: number
}

export interface MonthlyComparison {
  month: string
  income: number
  expenses: number
}

export interface DailySpending {
  date: string
  amount: number
}

export interface BudgetProgress {
  id: string
  name: string
  category: string
  spent: number
  limit: number
  percentage: number
}

export interface RecentTransaction {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string
}

export interface ChartData {
  spendingByCategory: SpendingByCategory[]
  monthlyComparison: MonthlyComparison[]
  dailySpending: DailySpending[]
  budgetProgress: BudgetProgress[]
  recentTransactions: RecentTransaction[]
}

// Savings Goals Types
export type GoalType =
  | 'EMERGENCY_FUND'
  | 'BABY'
  | 'HOUSE'
  | 'VEHICLE'
  | 'VACATION'
  | 'EDUCATION'
  | 'RETIREMENT'
  | 'CUSTOM'

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

export interface GoalsSummary {
  goals: Pick<SavingsGoal, 'id' | 'name' | 'type' | 'targetAmount' | 'currentAmount' | 'deadline' | 'isCompleted' | 'color' | 'icon'>[]
  totalTarget: number
  totalSaved: number
  completedCount: number
  activeCount: number
  overallProgress: number
}

// Goal type display info
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

// Baby Goals Types
export type MilestoneCategory =
  | 'PRE_BIRTH'
  | 'NURSERY'
  | 'GEAR'
  | 'FIRST_YEAR'
  | 'CHILDCARE'
  | 'HEALTHCARE'
  | 'EDUCATION'

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

export interface BabyGoalMetadata {
  babyName?: string
  expectedDueDate?: string
  actualBirthDate?: string
  isPregnancy: boolean
}

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

export interface ProjectionsResponse {
  projections: ExpenseProjection[]
  totalProjected: number
  totalSaved: number
  shortfall: number
  percentComplete: number
  currentMonthFromBirth: number
  dueDate: string | null
}

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

// Milestone category display info
export const MILESTONE_CATEGORY_INFO: Record<MilestoneCategory, { label: string; icon: string; color: string; defaultAmount: number }> = {
  PRE_BIRTH: { label: 'Pre-Birth', icon: '🤰', color: '#ec4899', defaultAmount: 2500 },
  NURSERY: { label: 'Nursery', icon: '🛏️', color: '#8b5cf6', defaultAmount: 2000 },
  GEAR: { label: 'Gear & Equipment', icon: '🍼', color: '#3b82f6', defaultAmount: 1500 },
  FIRST_YEAR: { label: 'First Year', icon: '👶', color: '#10b981', defaultAmount: 3000 },
  CHILDCARE: { label: 'Childcare', icon: '🏫', color: '#f59e0b', defaultAmount: 12000 },
  HEALTHCARE: { label: 'Healthcare', icon: '🏥', color: '#ef4444', defaultAmount: 2000 },
  EDUCATION: { label: 'Education Fund', icon: '🎓', color: '#6366f1', defaultAmount: 5000 },
}

// House Goals Types
export type PropertyType =
  | 'single_family'
  | 'condo'
  | 'townhouse'
  | 'multi_family'
  | 'apartment'
  | 'land'
  | 'other'

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

export interface HouseGoalMetadata {
  targetPrice?: number
  targetLocation?: string
  targetBedrooms?: number
  targetBathrooms?: number
  downPaymentPct?: number
  propertyType?: PropertyType
}

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

export interface MarketInsight {
  summary: string
  analysis: string
  factors: string[]
  recommendation?: string
  confidence: 'low' | 'medium' | 'high'
  disclaimer: string
}

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

// Property type display info
export const PROPERTY_TYPE_INFO: Record<PropertyType, { label: string; icon: string }> = {
  single_family: { label: 'Single Family', icon: '🏠' },
  condo: { label: 'Condo', icon: '🏢' },
  townhouse: { label: 'Townhouse', icon: '🏘️' },
  multi_family: { label: 'Multi-Family', icon: '🏗️' },
  apartment: { label: 'Apartment', icon: '🏬' },
  land: { label: 'Land', icon: '🌳' },
  other: { label: 'Other', icon: '🏛️' },
}
