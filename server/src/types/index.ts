export interface User {
  id: string
  email: string
  name: string
  password: string
  createdAt: Date
  updatedAt: Date
}

export interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  category: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  budgetId?: string
  userId: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

export type CreateUserInput = Pick<User, 'email' | 'name' | 'password'>
export type UpdateUserInput = Partial<Pick<User, 'email' | 'name'>>

export type CreateBudgetInput = Pick<Budget, 'name' | 'amount' | 'category'>
export type UpdateBudgetInput = Partial<CreateBudgetInput & { spent: number }>

export type CreateTransactionInput = Pick<Transaction, 'description' | 'amount' | 'type' | 'category' | 'date'> & { budgetId?: string }
export type UpdateTransactionInput = Partial<CreateTransactionInput>
