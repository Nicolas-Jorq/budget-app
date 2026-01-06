/**
 * @fileoverview Top Navigation Bar Component.
 *
 * Renders the top navigation bar with Batman-inspired theme.
 * Features user info and sign out functionality.
 *
 * @module components/Navbar
 */

import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

/**
 * Navbar component with Batman-inspired dark theme.
 *
 * Features:
 * - Clean, minimal header
 * - User name display
 * - Sign out button with gold accent
 */
export default function Navbar() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="bg-theme-surface border-b border-border-subtle">
      <div className="flex items-center justify-between px-section py-3">
        {/* Welcome message */}
        <div>
          <h2 className="text-base font-medium text-content-primary">
            Welcome back, <span className="text-primary-500">{user?.name?.split(' ')[0]}</span>
          </h2>
        </div>

        {/* User actions */}
        <div className="flex items-center gap-3">
          {/* User email - subtle display */}
          <span className="text-sm text-content-tertiary hidden sm:block">
            {user?.email}
          </span>

          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-content-secondary bg-theme-elevated rounded border border-border-subtle hover:border-primary-500/50 hover:text-primary-500 transition-all duration-fast"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Sign out button */}
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm font-medium text-content-secondary bg-theme-elevated rounded border border-border-subtle hover:border-primary-500/50 hover:text-primary-500 transition-all duration-fast"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
