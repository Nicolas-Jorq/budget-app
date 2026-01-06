/**
 * @fileoverview Authentication Context for the Budget App.
 *
 * This module provides authentication state management across the application.
 * It handles user login, registration, logout, and maintains the current user's
 * session state. The context persists authentication tokens in localStorage
 * and automatically validates tokens on app initialization.
 *
 * @module context/AuthContext
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../services/api'
import { User } from '../types'

/**
 * Defines the shape of the authentication context value.
 * This interface describes all the state and methods available
 * to components consuming the AuthContext.
 *
 * @interface AuthContextType
 * @property {User | null} user - The currently authenticated user, or null if not logged in
 * @property {string | null} token - The JWT authentication token, or null if not authenticated
 * @property {boolean} isLoading - Whether the auth state is being initialized/validated
 * @property {function} login - Authenticates a user with email and password
 * @property {function} register - Creates a new user account
 * @property {function} logout - Signs out the current user and clears session
 */
interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
}

/**
 * The React Context instance for authentication.
 * Initialized as undefined to detect usage outside of provider.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Authentication Provider component that wraps the application
 * and provides authentication state and methods to all child components.
 *
 * On mount, this provider checks for an existing token in localStorage
 * and validates it by fetching the current user's data. If the token
 * is invalid or expired, it clears the stored token.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to wrap with auth context
 * @returns {JSX.Element} Provider component wrapping children with auth context
 *
 * @example
 * // Wrap your app with AuthProvider
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  // Initialize authentication state on mount by validating stored token
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Validate token by fetching current user data
          const response = await api.get('/auth/me')
          setUser(response.data)
        } catch {
          // Token is invalid or expired - clear stored credentials
          localStorage.removeItem('token')
          setToken(null)
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [token])

  /**
   * Authenticates a user with email and password credentials.
   * On success, stores the JWT token and updates user state.
   *
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<void>} Resolves when login is complete
   * @throws {Error} Throws if authentication fails
   */
  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const { user, token } = response.data
    localStorage.setItem('token', token)
    setToken(token)
    setUser(user)
  }

  /**
   * Registers a new user account with the provided credentials.
   * On success, automatically logs in the user by storing the token.
   *
   * @param {string} email - New user's email address
   * @param {string} name - New user's display name
   * @param {string} password - New user's password
   * @returns {Promise<void>} Resolves when registration is complete
   * @throws {Error} Throws if registration fails (e.g., email already exists)
   */
  const register = async (email: string, name: string, password: string) => {
    const response = await api.post('/auth/register', { email, name, password })
    const { user, token } = response.data
    localStorage.setItem('token', token)
    setToken(token)
    setUser(user)
  }

  /**
   * Signs out the current user by clearing all authentication state.
   * Removes the token from localStorage and resets user state.
   */
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom hook to access the authentication context.
 * Provides access to the current user, authentication state,
 * and authentication methods (login, register, logout).
 *
 * @returns {AuthContextType} The authentication context value
 * @throws {Error} Throws if used outside of an AuthProvider
 *
 * @example
 * // Using the hook in a component
 * function MyComponent() {
 *   const { user, login, logout } = useAuth();
 *
 *   if (!user) {
 *     return <LoginForm onSubmit={login} />;
 *   }
 *
 *   return <button onClick={logout}>Sign out</button>;
 * }
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
