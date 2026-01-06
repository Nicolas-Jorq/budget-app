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
