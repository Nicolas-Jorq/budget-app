/**
 * @fileoverview Main Layout Component for authenticated pages.
 *
 * This component provides the primary layout structure for all authenticated
 * routes in the application. It includes the sidebar navigation, top navbar,
 * and a main content area where child routes are rendered via React Router's
 * Outlet component.
 *
 * The layout uses a responsive flexbox design with the sidebar on the left
 * and the main content area expanding to fill the remaining space.
 *
 * @module components/Layout
 */

import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

/**
 * Layout component that provides the main application shell for authenticated users.
 *
 * The layout structure consists of:
 * - A fixed-width sidebar on the left with navigation links
 * - A flexible content area on the right containing:
 *   - A top navbar with user info and actions
 *   - A main content area for page-specific content
 *
 * Child routes are rendered in the main content area using React Router's
 * Outlet component, allowing for nested routing while maintaining the
 * consistent layout structure.
 *
 * @returns {JSX.Element} The layout component with sidebar, navbar, and content area
 *
 * @example
 * // Used in route configuration with nested routes
 * <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
 *   <Route index element={<Dashboard />} />
 *   <Route path="budgets" element={<Budgets />} />
 * </Route>
 */
export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Left sidebar with navigation */}
      <Sidebar />

      {/* Main content area with navbar and page content */}
      <div className="flex-1 flex flex-col">
        {/* Top navigation bar with user actions */}
        <Navbar />

        {/* Page content - child routes render here */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
