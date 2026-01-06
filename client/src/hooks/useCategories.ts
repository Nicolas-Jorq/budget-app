/**
 * @fileoverview useCategories Hook
 *
 * Custom hook for fetching and managing user categories.
 * Categories are fetched once and cached, with methods to refetch.
 *
 * @module hooks/useCategories
 */

import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { Category } from '../types'

interface UseCategoriesOptions {
  /** Filter by transaction type */
  type?: 'expense' | 'income'
}

interface UseCategoriesReturn {
  /** All categories (filtered by type if specified) */
  categories: Category[]
  /** Expense categories only */
  expenseCategories: Category[]
  /** Income categories only */
  incomeCategories: Category[]
  /** Loading state */
  isLoading: boolean
  /** Error message if fetch failed */
  error: string | null
  /** Refetch categories from API */
  refetch: () => Promise<void>
}

/**
 * Hook for fetching and managing user categories.
 *
 * @param options - Optional filter options
 * @returns Categories data, loading state, and refetch function
 *
 * @example
 * // Get all categories
 * const { categories, isLoading } = useCategories()
 *
 * @example
 * // Get only expense categories
 * const { categories } = useCategories({ type: 'expense' })
 *
 * @example
 * // Use separated lists
 * const { expenseCategories, incomeCategories } = useCategories()
 */
export function useCategories(options?: UseCategoriesOptions): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = options?.type ? `?type=${options.type}` : ''
      const response = await api.get(`/categories${params}`)
      setCategories(response.data)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch categories')
    } finally {
      setIsLoading(false)
    }
  }, [options?.type])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Filter categories by type
  const expenseCategories = categories.filter(
    (c) => c.type === 'EXPENSE' || c.type === 'BOTH'
  )
  const incomeCategories = categories.filter(
    (c) => c.type === 'INCOME' || c.type === 'BOTH'
  )

  return {
    categories,
    expenseCategories,
    incomeCategories,
    isLoading,
    error,
    refetch: fetchCategories,
  }
}

/**
 * Get category names as a simple string array.
 * Useful for dropdowns that only need the name.
 */
export function getCategoryNames(categories: Category[]): string[] {
  return categories.map((c) => c.name)
}

/**
 * Get a category's color by name.
 */
export function getCategoryColor(categories: Category[], name: string): string | undefined {
  return categories.find((c) => c.name === name)?.color
}
