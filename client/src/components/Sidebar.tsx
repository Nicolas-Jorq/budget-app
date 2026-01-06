/**
 * @fileoverview Sidebar Navigation Component.
 *
 * This component renders the main navigation sidebar that appears on the left
 * side of all authenticated pages. It displays the application branding and
 * a list of navigation links to different sections of the app.
 *
 * The sidebar uses React Router's NavLink component to provide active state
 * styling for the current route.
 *
 * @module components/Sidebar
 */

import { NavLink } from 'react-router-dom'

/**
 * Navigation items configuration.
 * Each item defines a route path, display label, and SVG icon path data.
 *
 * @constant
 * @type {Array<{path: string, label: string, icon: string}>}
 */
const navItems = [
  { path: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/budgets', label: 'Budgets', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { path: '/transactions', label: 'Transactions', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { path: '/goals', label: 'Savings Goals', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { path: '/bank-statements', label: 'Bank Statements', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

/**
 * Sidebar component that renders the main navigation for the application.
 *
 * The sidebar includes:
 * - Application branding/logo at the top
 * - Vertical navigation menu with icons and labels
 * - Active state highlighting for the current route
 *
 * Each navigation item uses React Router's NavLink to automatically
 * apply active styling when the user is on that route.
 *
 * @returns {JSX.Element} The sidebar component with navigation links
 *
 * @example
 * // Used within the Layout component
 * <div className="flex min-h-screen">
 *   <Sidebar />
 *   <main>{children}</main>
 * </div>
 */
export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 min-h-screen">
      {/* Application branding */}
      <div className="p-4">
        <h1 className="text-xl font-bold text-white">Budget App</h1>
      </div>

      {/* Navigation menu */}
      <nav className="mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              // Dynamic class based on active state
              // Active links get a left border and highlighted background
              `flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                isActive ? 'bg-gray-800 text-white border-l-4 border-primary-500' : ''
              }`
            }
          >
            {/* Navigation icon */}
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            {/* Navigation label */}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
