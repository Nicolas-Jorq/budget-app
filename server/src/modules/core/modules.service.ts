/**
 * @fileoverview Module Service
 *
 * Manages user module enablement and settings.
 * Handles seeding default modules for new users.
 *
 * @module modules/core/modules-service
 */

import { PrismaClient, ModuleType, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Default modules enabled for new users.
 */
const DEFAULT_MODULES: ModuleType[] = ['FINANCE']

/**
 * Seed default modules for a user if they don't have any.
 */
async function seedDefaultModules(userId: string): Promise<void> {
  const existingCount = await prisma.userModule.count({ where: { userId } })

  if (existingCount > 0) {
    return // User already has modules
  }

  const modules = DEFAULT_MODULES.map((module) => ({
    userId,
    module,
  }))

  await prisma.userModule.createMany({
    data: modules,
  })
}

export const modulesService = {
  /**
   * Get all enabled modules for a user, seeding defaults if needed.
   */
  async getEnabledModules(userId: string) {
    await seedDefaultModules(userId)

    return prisma.userModule.findMany({
      where: { userId },
      orderBy: { enabledAt: 'asc' },
    })
  },

  /**
   * Check if a user has a specific module enabled.
   */
  async isModuleEnabled(userId: string, module: ModuleType): Promise<boolean> {
    const userModule = await prisma.userModule.findUnique({
      where: {
        userId_module: { userId, module },
      },
    })
    return !!userModule
  },

  /**
   * Enable a module for a user.
   */
  async enableModule(userId: string, module: ModuleType, settings?: Record<string, unknown>) {
    const jsonSettings = settings ? (settings as Prisma.InputJsonValue) : undefined
    return prisma.userModule.upsert({
      where: {
        userId_module: { userId, module },
      },
      create: {
        userId,
        module,
        settings: jsonSettings,
      },
      update: {
        settings: jsonSettings,
      },
    })
  },

  /**
   * Disable a module for a user.
   */
  async disableModule(userId: string, module: ModuleType) {
    // Don't allow disabling FINANCE module (it's the core module)
    if (module === 'FINANCE') {
      throw new Error('Cannot disable the Finance module')
    }

    return prisma.userModule.delete({
      where: {
        userId_module: { userId, module },
      },
    })
  },

  /**
   * Update module settings.
   */
  async updateModuleSettings(
    userId: string,
    module: ModuleType,
    settings: Record<string, unknown>
  ) {
    return prisma.userModule.update({
      where: {
        userId_module: { userId, module },
      },
      data: { settings: settings as Prisma.InputJsonValue },
    })
  },

  /**
   * Get Obsidian sync configuration for a user.
   */
  async getObsidianSync(userId: string) {
    return prisma.obsidianSync.findUnique({
      where: { userId },
    })
  },

  /**
   * Update Obsidian sync configuration.
   */
  async updateObsidianSync(
    userId: string,
    data: {
      vaultPath?: string
      syncSettings?: Record<string, unknown>
      isEnabled?: boolean
    }
  ) {
    const { syncSettings, ...rest } = data
    const jsonSyncSettings = syncSettings
      ? (syncSettings as Prisma.InputJsonValue)
      : undefined

    return prisma.obsidianSync.upsert({
      where: { userId },
      create: {
        userId,
        ...rest,
        syncSettings: jsonSyncSettings,
      },
      update: {
        ...rest,
        syncSettings: jsonSyncSettings,
      },
    })
  },

  /**
   * Record an export to Obsidian.
   */
  async recordObsidianExport(userId: string) {
    return prisma.obsidianSync.update({
      where: { userId },
      data: { lastExport: new Date() },
    })
  },

  /**
   * Record an import from Obsidian.
   */
  async recordObsidianImport(userId: string) {
    return prisma.obsidianSync.update({
      where: { userId },
      data: { lastImport: new Date() },
    })
  },
}
