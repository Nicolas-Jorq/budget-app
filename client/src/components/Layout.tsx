/**
 * @fileoverview Main Layout Component for authenticated pages.
 *
 * Provides the primary layout structure using the Batman-inspired theme.
 * Features a dark sidebar, navbar, and main content area.
 *
 * @module components/Layout
 */

import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

/**
 * Layout component that provides the main application shell for authenticated users.
 *
 * Uses the theme system's dark backgrounds with proper layering:
 * - Base layer: Main background
 * - Surface layer: Cards and panels
 * - Elevated layer: Modals and popovers
 */
export default function Layout() {
  return (
    <div className="flex min-h-screen bg-theme-base">
      {/* Left sidebar with navigation */}
      <Sidebar />

      {/* Main content area with navbar and page content */}
      <div className="flex-1 flex flex-col">
        {/* Top navigation bar */}
        <Navbar />

        {/* Page content - child routes render here */}
        <main className="flex-1 p-section overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
