/**
 * @fileoverview Module Context
 *
 * Provides module management functionality throughout the app.
 * Handles fetching enabled modules and module switching.
 *
 * @module modules/core/ModuleContext
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import api from '../../services/api'

export type ModuleType = 'FINANCE' | 'HEALTH' | 'TASKS' | 'LIFE_GOALS'

interface UserModule {
  id: string
  module: ModuleType
  enabledAt: string
  settings: Record<string, unknown> | null
}

interface ModuleConfig {
  id: ModuleType
  name: string
  description: string
  icon: string
  color: string
  isCore: boolean
}

export const MODULE_CONFIGS: Record<ModuleType, ModuleConfig> = {
  FINANCE: {
    id: 'FINANCE',
    name: 'Finance',
    description: 'Budget tracking, transactions, and savings goals',
    icon: 'wallet',
    color: '#10B981',
    isCore: true,
  },
  HEALTH: {
    id: 'HEALTH',
    name: 'Health',
    description: 'Fitness, nutrition, and wellness tracking',
    icon: 'heart',
    color: '#EF4444',
    isCore: false,
  },
  TASKS: {
    id: 'TASKS',
    name: 'Tasks',
    description: 'Todo lists, projects, and productivity',
    icon: 'check-square',
    color: '#3B82F6',
    isCore: false,
  },
  LIFE_GOALS: {
    id: 'LIFE_GOALS',
    name: 'Life Goals',
    description: 'Long-term goals and milestones',
    icon: 'target',
    color: '#8B5CF6',
    isCore: false,
  },
}

interface ModuleContextValue {
  modules: UserModule[]
  enabledModules: ModuleType[]
  isLoading: boolean
  error: string | null
  activeModule: ModuleType
  setActiveModule: (module: ModuleType) => void
  isModuleEnabled: (module: ModuleType) => boolean
  enableModule: (module: ModuleType) => Promise<void>
  disableModule: (module: ModuleType) => Promise<void>
  refreshModules: () => Promise<void>
}

const ModuleContext = createContext<ModuleContextValue | null>(null)

interface ModuleProviderProps {
  children: ReactNode
}

export function ModuleProvider({ children }: ModuleProviderProps) {
  const [modules, setModules] = useState<UserModule[]>([])
  const [activeModule, setActiveModule] = useState<ModuleType>('FINANCE')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const enabledModules = modules.map((m) => m.module)

  const fetchModules = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.get<UserModule[]>('/modules')
      setModules(response.data)
    } catch (err) {
      console.error('Failed to fetch modules:', err)
      // Default to FINANCE if fetch fails (e.g., not logged in)
      setModules([{ id: 'default', module: 'FINANCE', enabledAt: new Date().toISOString(), settings: null }])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  const isModuleEnabled = useCallback(
    (module: ModuleType) => enabledModules.includes(module),
    [enabledModules]
  )

  const enableModule = useCallback(async (module: ModuleType) => {
    try {
      await api.post('/modules', { module })
      await fetchModules()
    } catch (err) {
      console.error('Failed to enable module:', err)
      throw err
    }
  }, [fetchModules])

  const disableModule = useCallback(async (module: ModuleType) => {
    try {
      await api.delete(`/modules/${module}`)
      await fetchModules()
      // If we disabled the active module, switch to FINANCE
      if (module === activeModule) {
        setActiveModule('FINANCE')
      }
    } catch (err) {
      console.error('Failed to disable module:', err)
      throw err
    }
  }, [fetchModules, activeModule])

  const value: ModuleContextValue = {
    modules,
    enabledModules,
    isLoading,
    error,
    activeModule,
    setActiveModule,
    isModuleEnabled,
    enableModule,
    disableModule,
    refreshModules: fetchModules,
  }

  return (
    <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>
  )
}

export function useModules() {
  const context = useContext(ModuleContext)
  if (!context) {
    throw new Error('useModules must be used within a ModuleProvider')
  }
  return context
}
