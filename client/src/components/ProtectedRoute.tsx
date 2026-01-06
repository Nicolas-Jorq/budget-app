/**
 * @fileoverview Protected Route Component for authentication-guarded pages.
 *
 * This component acts as a route guard that ensures only authenticated users
 * can access certain parts of the application. It checks the authentication
 * state and either renders the protected content, redirects to login, or
 * displays a loading indicator while authentication status is being verified.
 *
 * @module components/ProtectedRoute
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Props interface for the ProtectedRoute component.
 *
 * @interface ProtectedRouteProps
 * @property {React.ReactNode} children - The protected content to render if authenticated
 */
interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * ProtectedRoute component that guards routes requiring authentication.
 *
 * This component implements a common authentication pattern:
 * 1. While auth state is loading, show a loading spinner
 * 2. If user is not authenticated, redirect to login page
 * 3. If user is authenticated, render the protected children
 *
 * The loading state is important to prevent flash of redirect before
 * the stored token can be validated on initial page load.
 *
 * @param {ProtectedRouteProps} props - Component props
 * @param {React.ReactNode} props.children - Protected content to render when authenticated
 * @returns {JSX.Element} Loading spinner, redirect to login, or protected content
 *
 * @example
 * // Wrapping a route that requires authentication
 * <Route
 *   path="/dashboard"
 *   element={
 *     <ProtectedRoute>
 *       <Dashboard />
 *     </ProtectedRoute>
 *   }
 * />
 *
 * @example
 * // Wrapping a layout with nested routes
 * <Route
 *   path="/"
 *   element={
 *     <ProtectedRoute>
 *       <Layout />
 *     </ProtectedRoute>
 *   }
 * >
 *   <Route index element={<Dashboard />} />
 * </Route>
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  // Show loading spinner while authentication state is being determined
  // This prevents a flash of redirect before token validation completes
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Redirect to login page if user is not authenticated
  // Using 'replace' to prevent the protected route from being in browser history
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // User is authenticated - render the protected content
  return <>{children}</>
}
