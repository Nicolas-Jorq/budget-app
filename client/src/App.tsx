/**
 * @fileoverview Main Application Entry Point.
 *
 * This is the root component of the Budget App that sets up the application
 * structure including context providers and routing configuration. It establishes
 * the provider hierarchy and defines all application routes.
 *
 * Provider hierarchy (outer to inner):
 * 1. ThemeProvider - Provides light/dark theme management
 * 2. AuthProvider - Provides authentication state and methods
 * 3. BrowserRouter - Provides React Router navigation context
 *
 * @module App
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { ModuleProvider } from './modules/core'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Budgets from './pages/Budgets'
import Transactions from './pages/Transactions'
import RecurringTransactions from './pages/RecurringTransactions'
import Goals from './pages/Goals'
import BabyGoalDetail from './pages/BabyGoalDetail'
import HouseGoalDetail from './pages/HouseGoalDetail'
import BankStatements from './pages/BankStatements'
import DocumentReview from './pages/DocumentReview'
import Categories from './pages/Categories'
import { HealthDashboard, Workouts, Weight, Nutrition, Sleep } from './pages/health'
import { TasksDashboard, TaskList, Projects } from './pages/tasks'
import { LifeGoalsDashboard, GoalsList, GoalDetail, Milestones } from './pages/life-goals'

/**
 * Root application component that configures providers and routing.
 *
 * The application structure:
 * - Public routes: /login, /register (accessible without authentication)
 * - Protected routes: All other routes (require authentication)
 *
 * Protected routes are nested under a Layout component that provides
 * the common UI structure (sidebar, navbar) for authenticated pages.
 *
 * Route structure:
 * - / (protected, Layout wrapper)
 *   - index -> Dashboard (default route)
 *   - /budgets -> Budgets management
 *   - /transactions -> Transaction history
 *   - /goals -> Savings goals list
 *   - /goals/:id/baby -> Baby savings goal details
 *   - /goals/:id/house -> House savings goal details
 *   - /bank-statements -> Bank statements list
 *   - /bank-statements/:id -> Individual document review
 *   - /health -> Health dashboard
 *   - /health/workouts -> Workout tracking
 *   - /health/weight -> Weight tracking
 *   - /health/nutrition -> Nutrition/meal tracking
 *   - /health/sleep -> Sleep tracking
 * - /login (public) -> Login page
 * - /register (public) -> Registration page
 *
 * @returns {JSX.Element} The complete application with providers and routes
 *
 * @example
 * // Rendering the app in main.tsx
 * import App from './App'
 *
 * ReactDOM.createRoot(document.getElementById('root')!).render(
 *   <React.StrictMode>
 *     <App />
 *   </React.StrictMode>
 * )
 */
function App() {
  return (
    // ThemeProvider must be outermost to provide theme to all components
    <ThemeProvider>
      {/* ToastProvider for app-wide notifications */}
      <ToastProvider>
      {/* AuthProvider wraps routes to provide auth state throughout */}
      <AuthProvider>
        {/* ModuleProvider manages which modules are enabled for the user */}
        <ModuleProvider>
        <BrowserRouter>
        <Routes>
          {/* Public routes - accessible without authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes - require authentication */}
          {/* All authenticated routes share the Layout component */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Nested routes render inside Layout's Outlet */}
            <Route index element={<Dashboard />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="categories" element={<Categories />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="recurring" element={<RecurringTransactions />} />
            <Route path="goals" element={<Goals />} />
            {/* Dynamic goal detail routes with type-specific pages */}
            <Route path="goals/:id/baby" element={<BabyGoalDetail />} />
            <Route path="goals/:id/house" element={<HouseGoalDetail />} />
            <Route path="bank-statements" element={<BankStatements />} />
            {/* Dynamic document review route */}
            <Route path="bank-statements/:id" element={<DocumentReview />} />

            {/* Health module routes */}
            <Route path="health" element={<HealthDashboard />} />
            <Route path="health/workouts" element={<Workouts />} />
            <Route path="health/weight" element={<Weight />} />
            <Route path="health/nutrition" element={<Nutrition />} />
            <Route path="health/sleep" element={<Sleep />} />

            {/* Tasks module routes */}
            <Route path="tasks" element={<TasksDashboard />} />
            <Route path="tasks/list" element={<TaskList />} />
            <Route path="tasks/projects" element={<Projects />} />

            {/* Life Goals module routes */}
            <Route path="life-goals" element={<LifeGoalsDashboard />} />
            <Route path="life-goals/list" element={<GoalsList />} />
            <Route path="life-goals/milestones" element={<Milestones />} />
            <Route path="life-goals/:id" element={<GoalDetail />} />
          </Route>
        </Routes>
        </BrowserRouter>
        </ModuleProvider>
      </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
