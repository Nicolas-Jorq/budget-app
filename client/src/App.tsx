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

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { ModuleProvider } from './modules/core'
import { APP_CONFIG } from './config/app'
import { ErrorBoundary } from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Lazy-loaded page components for code splitting
// Auth pages (small, load immediately for critical path)
import Login from './pages/Login'
import Register from './pages/Register'

// Finance module (core app functionality)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Budgets = lazy(() => import('./pages/Budgets'))
const Transactions = lazy(() => import('./pages/Transactions'))
const RecurringTransactions = lazy(() => import('./pages/RecurringTransactions'))
const Goals = lazy(() => import('./pages/Goals'))
const BabyGoalDetail = lazy(() => import('./pages/BabyGoalDetail'))
const HouseGoalDetail = lazy(() => import('./pages/HouseGoalDetail'))
const BankStatements = lazy(() => import('./pages/BankStatements'))
const DocumentReview = lazy(() => import('./pages/DocumentReview'))
const Categories = lazy(() => import('./pages/Categories'))

// Health module
const HealthDashboard = lazy(() => import('./pages/health').then(m => ({ default: m.HealthDashboard })))
const Workouts = lazy(() => import('./pages/health').then(m => ({ default: m.Workouts })))
const Weight = lazy(() => import('./pages/health').then(m => ({ default: m.Weight })))
const Nutrition = lazy(() => import('./pages/health').then(m => ({ default: m.Nutrition })))
const Sleep = lazy(() => import('./pages/health').then(m => ({ default: m.Sleep })))

// Tasks module
const TasksDashboard = lazy(() => import('./pages/tasks').then(m => ({ default: m.TasksDashboard })))
const TaskList = lazy(() => import('./pages/tasks').then(m => ({ default: m.TaskList })))
const Projects = lazy(() => import('./pages/tasks').then(m => ({ default: m.Projects })))

// Life Goals module
const LifeGoalsDashboard = lazy(() => import('./pages/life-goals').then(m => ({ default: m.LifeGoalsDashboard })))
const GoalsList = lazy(() => import('./pages/life-goals').then(m => ({ default: m.GoalsList })))
const GoalDetail = lazy(() => import('./pages/life-goals').then(m => ({ default: m.GoalDetail })))
const Milestones = lazy(() => import('./pages/life-goals').then(m => ({ default: m.Milestones })))

/**
 * Loading fallback for lazy-loaded components
 */
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
    </div>
  )
}

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
    // QueryClientProvider must be outermost for React Query
    <QueryClientProvider client={queryClient}>
    {/* ThemeProvider provides theme to all components */}
    <ThemeProvider>
      {/* ToastProvider for app-wide notifications */}
      <ToastProvider>
      {/* ErrorBoundary catches unhandled errors */}
      <ErrorBoundary>
      {/* AuthProvider wraps routes to provide auth state throughout */}
      <AuthProvider>
        {/* ModuleProvider manages which modules are enabled for the user */}
        <ModuleProvider>
        <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
        </BrowserRouter>
        </ModuleProvider>
      </AuthProvider>
      </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
    {/* React Query DevTools - only in development */}
    {APP_CONFIG.features.queryDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export default App
