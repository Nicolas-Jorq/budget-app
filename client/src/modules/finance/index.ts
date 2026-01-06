/**
 * @fileoverview Finance Module Exports
 *
 * Re-exports all finance-related components, pages, and hooks.
 * This provides a clean namespace for the finance module while
 * maintaining backward compatibility with existing imports.
 *
 * @module modules/finance
 */

// Pages
export { default as Dashboard } from '../../pages/Dashboard'
export { default as Budgets } from '../../pages/Budgets'
export { default as Transactions } from '../../pages/Transactions'
export { default as RecurringTransactions } from '../../pages/RecurringTransactions'
export { default as Goals } from '../../pages/Goals'
export { default as HouseGoalDetail } from '../../pages/HouseGoalDetail'
export { default as BabyGoalDetail } from '../../pages/BabyGoalDetail'
export { default as BankStatements } from '../../pages/BankStatements'
export { default as DocumentReview } from '../../pages/DocumentReview'
export { default as Categories } from '../../pages/Categories'

// Components - Forms
export { default as BudgetForm } from '../../components/BudgetForm'
export { default as TransactionForm } from '../../components/TransactionForm'
export { default as RecurringTransactionForm } from '../../components/RecurringTransactionForm'
export { default as GoalForm } from '../../components/GoalForm'
export { default as ContributionForm } from '../../components/ContributionForm'
export { default as CategoryForm } from '../../components/CategoryForm'

// Components - Cards
export { default as BudgetCard } from '../../components/BudgetCard'
export { default as GoalCard } from '../../components/GoalCard'
export { default as RecurringTransactionCard } from '../../components/RecurringTransactionCard'

// Components - Charts (from charts subdirectory)
export * from '../../components/charts'

// Components - House (from house subdirectory)
export * from '../../components/house'

// Components - Baby (from baby subdirectory)
export * from '../../components/baby'

// Components - Insights (from insights subdirectory)
export * from '../../components/insights'

// Hooks
export { useCategories } from '../../hooks/useCategories'
