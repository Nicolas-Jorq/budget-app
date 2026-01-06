/**
 * @fileoverview Login page component for user authentication.
 *
 * This page handles user authentication by collecting email and password
 * credentials and submitting them to the auth service. On successful login,
 * users are redirected to the dashboard. The page includes error handling
 * for failed login attempts and provides a link to the registration page.
 *
 * Authentication Flow:
 * 1. User enters email and password
 * 2. Form submission triggers login via AuthContext
 * 3. On success: JWT token stored, redirect to dashboard
 * 4. On failure: Error message displayed to user
 *
 * @module pages/Login
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Login page component for user authentication.
 *
 * This component renders a centered login form with email and password fields.
 * It integrates with the AuthContext for authentication and uses React Router
 * for navigation after successful login.
 *
 * State Management:
 * - email/password: Form input values (controlled components)
 * - error: Error message to display on failed login
 * - isLoading: Loading state during authentication request
 *
 * @component
 * @returns {JSX.Element} The rendered Login page with form
 *
 * @example
 * // Used in router configuration for public routes
 * <Route path="/login" element={<Login />} />
 */
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  /**
   * Handles form submission for user login.
   * Prevents default form behavior, calls auth service, and handles navigation/errors.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')  // Clear any previous error messages
    setIsLoading(true)

    try {
      // Attempt login via AuthContext (stores JWT on success)
      await login(email, password)
      // Redirect to dashboard on successful authentication
      navigate('/')
    } catch (err) {
      // Display error message to user
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Sign in to Budget App
        </h2>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
