/**
 * @fileoverview Theme Context for the Budget App.
 *
 * This module provides theme management (light/dark mode) across the application.
 * It handles theme persistence in localStorage, respects system preferences,
 * and applies theme classes to the document root for CSS styling.
 *
 * The theme is applied using useLayoutEffect to prevent flash of incorrect theme
 * during initial page load.
 *
 * @module context/ThemeContext
 */

import { createContext, useContext, useState, useLayoutEffect, ReactNode } from 'react'

/**
 * Available theme options for the application.
 * @typedef {'light' | 'dark'} Theme
 */
type Theme = 'light' | 'dark'

/**
 * Defines the shape of the theme context value.
 * This interface describes all the state and methods available
 * to components consuming the ThemeContext.
 *
 * @interface ThemeContextType
 * @property {Theme} theme - The current theme ('light' or 'dark')
 * @property {function} toggleTheme - Function to switch between light and dark themes
 * @property {boolean} isDark - Convenience boolean indicating if dark mode is active
 */
interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
}

/**
 * The React Context instance for theme management.
 * Initialized as undefined to detect usage outside of provider.
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Determines the initial theme based on user preferences.
 * Priority order:
 * 1. Previously stored theme in localStorage
 * 2. System preference via prefers-color-scheme media query
 * 3. Falls back to 'light' theme
 *
 * @returns {Theme} The initial theme to use
 */
function getInitialTheme(): Theme {
  // Handle server-side rendering where window is not available
  if (typeof window === 'undefined') return 'light'

  // Check for previously stored preference
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored

  // Fall back to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Theme Provider component that wraps the application
 * and provides theme state and toggle functionality to all child components.
 *
 * This provider applies the theme class to the document root element
 * and persists the user's preference to localStorage.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to wrap with theme context
 * @returns {JSX.Element} Provider component wrapping children with theme context
 *
 * @example
 * // Wrap your app with ThemeProvider
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // Use useLayoutEffect to apply theme before browser paint
  // This prevents flash of wrong theme on page load
  useLayoutEffect(() => {
    const root = document.documentElement

    // Remove both classes first to ensure clean state
    root.classList.remove('light', 'dark')

    // Add the current theme class for Tailwind dark mode
    root.classList.add(theme)

    // Set color-scheme for native browser elements (scrollbars, form controls)
    root.style.colorScheme = theme

    // Persist to localStorage for next visit
    localStorage.setItem('theme', theme)
  }, [theme])

  /**
   * Toggles between light and dark themes.
   * Uses functional update to ensure correct previous state.
   */
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Custom hook to access the theme context.
 * Provides access to the current theme, toggle function,
 * and a convenience boolean for dark mode check.
 *
 * @returns {ThemeContextType} The theme context value
 * @throws {Error} Throws if used outside of a ThemeProvider
 *
 * @example
 * // Using the hook in a component
 * function MyComponent() {
 *   const { isDark, toggleTheme } = useTheme();
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       {isDark ? 'Switch to Light' : 'Switch to Dark'}
 *     </button>
 *   );
 * }
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
