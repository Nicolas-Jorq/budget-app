/**
 * @fileoverview Module Rail Component
 *
 * Vertical icon rail for switching between app modules.
 * Displays module icons with the active module highlighted.
 * Similar to navigation patterns in Slack, Discord, Notion.
 *
 * @module components/ModuleRail
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useModules, MODULE_CONFIGS, ModuleType } from '../modules/core'

/**
 * Module icon paths (SVG path data)
 */
const MODULE_ICONS: Record<ModuleType, string> = {
  FINANCE: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', // Credit card / wallet
  HEALTH: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', // Heart
  TASKS: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', // Clipboard check
  LIFE_GOALS: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', // Shield / target
}

/**
 * Default routes for each module
 */
const MODULE_ROUTES: Record<ModuleType, string> = {
  FINANCE: '/',
  HEALTH: '/health',
  TASKS: '/tasks',
  LIFE_GOALS: '/life-goals',
}

/**
 * Check if current path belongs to a module
 */
function getActiveModuleFromPath(pathname: string): ModuleType {
  if (pathname.startsWith('/health')) return 'HEALTH'
  if (pathname.startsWith('/tasks')) return 'TASKS'
  if (pathname.startsWith('/life-goals')) return 'LIFE_GOALS'
  return 'FINANCE'
}

/**
 * ModuleRail component - vertical icon navigation for module switching.
 *
 * Features:
 * - Displays enabled modules as icons
 * - Active module highlighted with module color
 * - Click to switch modules and navigate
 * - Tooltip on hover showing module name
 */
export default function ModuleRail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { enabledModules, setActiveModule } = useModules()

  const activeModuleFromPath = getActiveModuleFromPath(location.pathname)

  const handleModuleClick = (module: ModuleType) => {
    setActiveModule(module)
    navigate(MODULE_ROUTES[module])
  }

  return (
    <aside className="w-14 bg-theme-base border-r border-border-subtle flex flex-col items-center py-3">
      {/* App logo / home */}
      <div className="mb-4 p-2">
        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">B</span>
        </div>
      </div>

      {/* Module icons */}
      <nav className="flex-1 flex flex-col items-center gap-1">
        {enabledModules.map((moduleType) => {
          const config = MODULE_CONFIGS[moduleType]
          const isActive = activeModuleFromPath === moduleType
          const iconPath = MODULE_ICONS[moduleType]

          return (
            <button
              key={moduleType}
              onClick={() => handleModuleClick(moduleType)}
              className={`
                group relative w-10 h-10 rounded-xl flex items-center justify-center
                transition-all duration-fast
                ${isActive
                  ? 'bg-theme-elevated'
                  : 'hover:bg-theme-surface'
                }
              `}
              title={config.name}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div
                  className="absolute left-0 w-1 h-5 rounded-r-full"
                  style={{ backgroundColor: config.color }}
                />
              )}

              {/* Module icon */}
              <svg
                className="w-5 h-5 transition-colors duration-fast"
                style={{ color: isActive ? config.color : undefined }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={iconPath}
                />
              </svg>

              {/* Tooltip */}
              <div className="
                absolute left-full ml-2 px-2 py-1
                bg-theme-elevated text-content-primary text-xs font-medium
                rounded shadow-lg border border-border-subtle
                opacity-0 group-hover:opacity-100 pointer-events-none
                transition-opacity duration-fast whitespace-nowrap z-50
              ">
                {config.name}
              </div>
            </button>
          )
        })}
      </nav>

      {/* Settings / bottom section */}
      <div className="mt-auto pt-3 border-t border-border-subtle">
        <button
          className="w-10 h-10 rounded-xl flex items-center justify-center text-content-tertiary hover:text-content-secondary hover:bg-theme-surface transition-all duration-fast"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
