/**
 * @fileoverview Mortgage Calculator Component
 *
 * This component provides an interactive mortgage calculator that estimates
 * monthly payments, total costs, and payment breakdowns. It automatically
 * recalculates when inputs change, with debounced API calls for performance.
 *
 * @module components/house/MortgageCalculator
 */

import { useState, useEffect } from 'react'
import api from '../../services/api'
import { MortgageCalculation } from '../../types'

/**
 * Props for the MortgageCalculator component.
 *
 * @interface MortgageCalculatorProps
 * @property {number} [initialHomePrice=450000] - Starting home price value
 * @property {number} [initialDownPaymentPct=20] - Starting down payment percentage
 */
interface MortgageCalculatorProps {
  initialHomePrice?: number
  initialDownPaymentPct?: number
}

/**
 * Renders an interactive mortgage calculator with real-time estimates.
 *
 * Features:
 * - Home price and down payment inputs
 * - Interest rate input with 0.125% step increments
 * - Loan term selector (10, 15, 20, 30 years)
 * - Automatic calculation with 500ms debounce
 * - Monthly payment breakdown (principal, interest, taxes, insurance, PMI)
 * - Total payment and total interest over loan lifetime
 * - PMI warning when down payment is under 20%
 * - Responsive design with dark mode support
 *
 * @param {MortgageCalculatorProps} props - Component props
 * @param {number} [props.initialHomePrice=450000] - Initial home price
 * @param {number} [props.initialDownPaymentPct=20] - Initial down payment percentage
 * @returns {JSX.Element} A mortgage calculator card with inputs and results
 *
 * @example
 * // Use with defaults
 * <MortgageCalculator />
 *
 * @example
 * // Use with custom initial values
 * <MortgageCalculator
 *   initialHomePrice={600000}
 *   initialDownPaymentPct={25}
 * />
 */
export default function MortgageCalculator({
  initialHomePrice = 450000,
  initialDownPaymentPct = 20,
}: MortgageCalculatorProps) {
  // Form input states (stored as strings for input binding)
  const [homePrice, setHomePrice] = useState(initialHomePrice.toString())
  const [downPaymentPct, setDownPaymentPct] = useState(initialDownPaymentPct.toString())
  const [interestRate, setInterestRate] = useState('6.5')
  const [loanTermYears, setLoanTermYears] = useState('30')

  // Calculation result and loading state
  const [result, setResult] = useState<MortgageCalculation | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Performs the mortgage calculation via API.
   * Called automatically when inputs change (debounced).
   */
  const calculate = async () => {
    setIsLoading(true)
    try {
      const homePriceNum = parseFloat(homePrice)
      const downPaymentPctNum = parseFloat(downPaymentPct)
      const interestRateNum = parseFloat(interestRate)
      const loanTermYearsNum = parseInt(loanTermYears, 10)

      const response = await api.post('/finance/house/mortgage/calculate', {
        homePrice: homePriceNum,
        downPaymentPct: downPaymentPctNum,
        interestRate: interestRateNum,
        loanTermYears: loanTermYearsNum,
      })

      // Transform backend response to match frontend MortgageCalculation type
      const data = response.data.data

      // Calculate actual principal/interest split for first payment
      // Interest for first month = loanAmount * (annualRate / 12 / 100)
      const monthlyRate = interestRateNum / 100 / 12
      const firstMonthInterest = data.loanAmount * monthlyRate
      const firstMonthPrincipal = data.monthlyPayment.principalAndInterest - firstMonthInterest

      setResult({
        homePrice: data.homePrice,
        downPayment: data.downPayment,
        downPaymentPercent: downPaymentPctNum,
        loanAmount: data.loanAmount,
        interestRate: interestRateNum,
        loanTermYears: loanTermYearsNum,
        monthlyPayment: data.monthlyPayment.total,
        totalPayment: data.totalPaid,
        totalInterest: data.totalInterest,
        monthlyBreakdown: {
          principal: Math.round(firstMonthPrincipal),
          interest: Math.round(firstMonthInterest),
          propertyTax: data.monthlyPayment.propertyTax,
          homeInsurance: data.monthlyPayment.insurance,
          pmi: data.monthlyPayment.pmi > 0 ? data.monthlyPayment.pmi : undefined,
        },
      })
    } catch (error) {
      console.error('Error calculating mortgage:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Effect to automatically recalculate when inputs change.
   * Uses a 500ms debounce to avoid excessive API calls during typing.
   */
  useEffect(() => {
    // Only calculate when all required fields have values
    if (homePrice && downPaymentPct && interestRate && loanTermYears) {
      const timer = setTimeout(calculate, 500)
      // Cleanup: cancel pending calculation if inputs change again
      return () => clearTimeout(timer)
    }
  }, [homePrice, downPaymentPct, interestRate, loanTermYears])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>🧮</span> Mortgage Calculator
      </h3>

      {/* Input fields grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Home price input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Home Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={homePrice}
              onChange={(e) => setHomePrice(e.target.value)}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Down payment percentage input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Down Payment
          </label>
          <div className="relative">
            <input
              type="number"
              value={downPaymentPct}
              onChange={(e) => setDownPaymentPct(e.target.value)}
              min="0"
              max="100"
              className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
        </div>

        {/* Interest rate input with 0.125% steps (standard mortgage rate increments) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Interest Rate
          </label>
          <div className="relative">
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              step="0.125"
              min="0"
              max="15"
              className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
        </div>

        {/* Loan term selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Loan Term
          </label>
          <select
            value={loanTermYears}
            onChange={(e) => setLoanTermYears(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="30">30 years</option>
            <option value="20">20 years</option>
            <option value="15">15 years</option>
            <option value="10">10 years</option>
          </select>
        </div>
      </div>

      {/* Results section - only shown when calculation is complete */}
      {result && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Monthly payment highlight */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Monthly Payment</p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              ${result.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Loan amount and down payment summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Loan Amount</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ${result.loanAmount.toLocaleString('en-US')}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Down Payment</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ${result.downPayment.toLocaleString('en-US')}
              </p>
            </div>
          </div>

          {/* Monthly payment breakdown section */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Monthly Payment Breakdown
            </h4>
            <div className="space-y-2">
              {/* Principal & Interest combined */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Principal & Interest</span>
                <span className="text-gray-900 dark:text-white">
                  ${(result.monthlyBreakdown.principal + result.monthlyBreakdown.interest).toFixed(2)}
                </span>
              </div>
              {/* Property tax */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Property Tax</span>
                <span className="text-gray-900 dark:text-white">
                  ${result.monthlyBreakdown.propertyTax.toFixed(2)}
                </span>
              </div>
              {/* Home insurance */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Home Insurance</span>
                <span className="text-gray-900 dark:text-white">
                  ${result.monthlyBreakdown.homeInsurance.toFixed(2)}
                </span>
              </div>
              {/* PMI (only shown when applicable - down payment < 20%) */}
              {result.monthlyBreakdown.pmi && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">PMI</span>
                  <span className="text-gray-900 dark:text-white">
                    ${result.monthlyBreakdown.pmi.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Total cost summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-blue-700 dark:text-blue-300">Total Payments ({loanTermYears} years)</span>
              <span className="font-semibold text-blue-900 dark:text-blue-100">
                ${result.totalPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300">Total Interest</span>
              <span className="font-semibold text-blue-900 dark:text-blue-100">
                ${result.totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* PMI explanation warning (shown when PMI is required) */}
          {result.monthlyBreakdown.pmi && (
            <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">
              * PMI (Private Mortgage Insurance) is required when down payment is less than 20%.
              You can typically remove PMI once you have 20% equity in your home.
            </p>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="text-center py-4 text-gray-500">Calculating...</div>
      )}
    </div>
  )
}
