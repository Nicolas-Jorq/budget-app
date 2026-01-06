/**
 * @fileoverview Sidebar Navigation Component.
 *
 * Renders the main navigation sidebar with Batman-inspired dark theme styling.
 * Features gold accent colors on active/hover states.
 *
 * @module components/Sidebar
 */

import { NavLink } from 'react-router-dom'

/**
 * Navigation items configuration.
 * Each item defines a route path, display label, and SVG icon path data.
 */
const navItems = [
  { path: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/budgets', label: 'Budgets', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { path: '/categories', label: 'Categories', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { path: '/transactions', label: 'Transactions', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { path: '/recurring', label: 'Recurring', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { path: '/goals', label: 'Savings Goals', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { path: '/bank-statements', label: 'Statements', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

/**
 * Sidebar component with Batman-inspired dark theme.
 *
 * Features:
 * - Near-black background for maximum contrast
 * - Gold accent on active links (bat signal inspired)
 * - Subtle hover states
 * - Compact navigation with clear hierarchy
 */
export default function Sidebar() {
  return (
    <aside className="w-56 bg-theme-surface border-r border-border-subtle flex flex-col">
      {/* Application branding */}
      <div className="p-4 border-b border-border-subtle">
        <h1 className="text-lg font-bold text-primary-500">Budget App</h1>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 mx-2 rounded transition-all duration-fast ${
                isActive
                  ? 'bg-primary-500/10 text-primary-500 border-l-2 border-primary-500 -ml-0.5 pl-[14px]'
                  : 'text-content-secondary hover:text-content-primary hover:bg-theme-elevated'
              }`
            }
          >
            {/* Navigation icon */}
            <svg
              className="w-5 h-5 mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            {/* Navigation label */}
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border-subtle">
        <p className="text-xs text-content-tertiary">v1.3.0</p>
      </div>
    </aside>
  )
}
