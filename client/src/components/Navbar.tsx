/**
 * @fileoverview Top Navigation Bar Component.
 *
 * This component renders the top navigation bar that appears on all authenticated
 * pages. It displays a welcome message, the current user's name, a dark mode toggle
 * button, and a sign out button.
 *
 * The navbar integrates with both the AuthContext for user information and logout
 * functionality, and the ThemeContext for theme switching.
 *
 * @module components/Navbar
 */

import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

/**
 * Navbar component that renders the top navigation bar for authenticated pages.
 *
 * Features:
 * - Welcome message greeting the user
 * - Dark/light mode toggle button with sun/moon icons
 * - Display of current user's name
 * - Sign out button to log out the user
 *
 * The component automatically adapts its styling based on the current theme
 * using Tailwind CSS dark mode classes.
 *
 * @returns {JSX.Element} The navbar component with user controls
 *
 * @example
 * // Used within the Layout component
 * <div className="flex-1 flex flex-col">
 *   <Navbar />
 *   <main>{children}</main>
 * </div>
 */
export default function Navbar() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Welcome message section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Welcome back!</h2>
        </div>

        {/* User actions section */}
        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {/* Show sun icon in dark mode, moon icon in light mode */}
            {isDark ? (
              // Sun icon - shown in dark mode to indicate switching to light
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              // Moon icon - shown in light mode to indicate switching to dark
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Current user's name display */}
          <span className="text-sm text-gray-600 dark:text-gray-300">{user?.name}</span>

          {/* Sign out button */}
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
