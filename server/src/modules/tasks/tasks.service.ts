/**
 * @fileoverview Tasks Module Service
 *
 * Business logic for task management including tasks, projects, and labels.
 *
 * @module modules/tasks/tasks-service
 */

import { PrismaClient, TaskPriority, TaskStatus } from '@prisma/client'

const prisma = new PrismaClient()

// ==========================================
// Task Service
// ==========================================

export const taskService = {
  /**
   * Get all tasks for a user with optional filters.
   */
  async getTasks(
    userId: string,
    options?: {
      status?: TaskStatus
      priority?: TaskPriority
      projectId?: string | null
      includeCompleted?: boolean
      limit?: number
    }
  ) {
    const where: Record<string, unknown> = { userId }

    if (options?.status) {
      where.status = options.status
    } else if (!options?.includeCompleted) {
      where.status = { not: 'DONE' }
    }

    if (options?.priority) {
      where.priority = options.priority
    }

    if (options?.projectId !== undefined) {
      where.projectId = options.projectId
    }

    // Only get top-level tasks (not subtasks)
    where.parentId = null

    return prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, color: true } },
        labels: { include: { label: true } },
        subtasks: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { subtasks: true } },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
        { sortOrder: 'asc' },
      ],
      take: options?.limit,
    })
  },

  /**
   * Get a single task by ID.
   */
  async getTask(userId: string, taskId: string) {
    return prisma.task.findFirst({
      where: { id: taskId, userId },
      include: {
        project: { select: { id: true, name: true, color: true } },
        labels: { include: { label: true } },
        subtasks: {
          orderBy: { sortOrder: 'asc' },
          include: {
            labels: { include: { label: true } },
          },
        },
        parent: { select: { id: true, title: true } },
      },
    })
  },

  /**
   * Create a new task.
   */
  async createTask(
    userId: string,
    data: {
      title: string
      description?: string
      priority?: TaskPriority
      dueDate?: Date
      projectId?: string
      parentId?: string
      labelIds?: string[]
    }
  ) {
    const { labelIds, ...taskData } = data

    const task = await prisma.task.create({
      data: {
        ...taskData,
        userId,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
      },
    })

    // Add labels if provided
    if (labelIds && labelIds.length > 0) {
      await prisma.taskLabel.createMany({
        data: labelIds.map((labelId) => ({
          taskId: task.id,
          labelId,
        })),
      })
    }

    return this.getTask(userId, task.id)
  },

  /**
   * Update a task.
   */
  async updateTask(
    userId: string,
    taskId: string,
    data: {
      title?: string
      description?: string
      priority?: TaskPriority
      status?: TaskStatus
      dueDate?: Date | null
      projectId?: string | null
      labelIds?: string[]
    }
  ) {
    const { labelIds, ...taskData } = data

    // Handle status change - set completedAt when marking DONE, clear it otherwise
    if (taskData.status === 'DONE') {
      (taskData as Record<string, unknown>).completedAt = new Date()
    } else if (taskData.status) {
      // Status changed to something other than DONE, clear completedAt
      (taskData as Record<string, unknown>).completedAt = null
    }

    await prisma.task.update({
      where: { id: taskId, userId },
      data: taskData,
    })

    // Update labels if provided
    if (labelIds !== undefined) {
      // Remove existing labels
      await prisma.taskLabel.deleteMany({
        where: { taskId },
      })
      // Add new labels
      if (labelIds.length > 0) {
        await prisma.taskLabel.createMany({
          data: labelIds.map((labelId) => ({
            taskId,
            labelId,
          })),
        })
      }
    }

    return this.getTask(userId, taskId)
  },

  /**
   * Toggle task completion status.
   */
  async toggleTaskStatus(userId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    })

    if (!task) {
      throw new Error('Task not found')
    }

    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE'
    const completedAt = newStatus === 'DONE' ? new Date() : null

    return prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus, completedAt },
      include: {
        project: { select: { id: true, name: true, color: true } },
        labels: { include: { label: true } },
      },
    })
  },

  /**
   * Delete a task.
   */
  async deleteTask(userId: string, taskId: string) {
    return prisma.task.delete({
      where: { id: taskId, userId },
    })
  },

  /**
   * Get tasks due today or overdue.
   */
  async getTodaysTasks(userId: string) {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    return prisma.task.findMany({
      where: {
        userId,
        status: { not: 'DONE' },
        dueDate: { lte: today },
        parentId: null,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        labels: { include: { label: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    })
  },
}

// ==========================================
// Project Service
// ==========================================

export const projectService = {
  /**
   * Get all projects for a user.
   */
  async getProjects(userId: string, includeArchived = false) {
    const where: Record<string, unknown> = { userId }
    if (!includeArchived) {
      where.isArchived = false
    }

    return prisma.project.findMany({
      where,
      include: {
        _count: {
          select: {
            tasks: { where: { status: { not: 'DONE' } } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
  },

  /**
   * Get a single project with its tasks.
   */
  async getProject(userId: string, projectId: string) {
    return prisma.project.findFirst({
      where: { id: projectId, userId },
      include: {
        tasks: {
          where: { parentId: null },
          include: {
            labels: { include: { label: true } },
            subtasks: true,
          },
          orderBy: [{ status: 'asc' }, { sortOrder: 'asc' }],
        },
        _count: {
          select: {
            tasks: { where: { status: { not: 'DONE' } } },
          },
        },
      },
    })
  },

  /**
   * Create a new project.
   */
  async createProject(
    userId: string,
    data: {
      name: string
      description?: string
      color?: string
      icon?: string
    }
  ) {
    return prisma.project.create({
      data: { ...data, userId },
    })
  },

  /**
   * Update a project.
   */
  async updateProject(
    userId: string,
    projectId: string,
    data: {
      name?: string
      description?: string
      color?: string
      icon?: string
      isArchived?: boolean
    }
  ) {
    return prisma.project.update({
      where: { id: projectId, userId },
      data,
    })
  },

  /**
   * Delete a project (tasks will have projectId set to null).
   */
  async deleteProject(userId: string, projectId: string) {
    return prisma.project.delete({
      where: { id: projectId, userId },
    })
  },
}

// ==========================================
// Label Service
// ==========================================

export const labelService = {
  /**
   * Get all labels for a user.
   */
  async getLabels(userId: string) {
    return prisma.label.findMany({
      where: { userId },
      include: {
        _count: { select: { tasks: true } },
      },
      orderBy: { name: 'asc' },
    })
  },

  /**
   * Create a new label.
   */
  async createLabel(
    userId: string,
    data: {
      name: string
      color: string
    }
  ) {
    return prisma.label.create({
      data: { ...data, userId },
    })
  },

  /**
   * Update a label.
   */
  async updateLabel(
    userId: string,
    labelId: string,
    data: {
      name?: string
      color?: string
    }
  ) {
    return prisma.label.update({
      where: { id: labelId, userId },
      data,
    })
  },

  /**
   * Delete a label.
   */
  async deleteLabel(userId: string, labelId: string) {
    return prisma.label.delete({
      where: { id: labelId, userId },
    })
  },
}

// ==========================================
// Dashboard Service
// ==========================================

export const tasksDashboardService = {
  /**
   * Get tasks dashboard summary.
   */
  async getDashboardSummary(userId: string) {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const [
      totalTasks,
      completedToday,
      overdueTasks,
      dueTodayTasks,
      dueThisWeekTasks,
      recentlyCompleted,
      projectCount,
    ] = await Promise.all([
      // Total active tasks
      prisma.task.count({
        where: { userId, status: { not: 'DONE' }, parentId: null },
      }),
      // Completed today
      prisma.task.count({
        where: {
          userId,
          status: 'DONE',
          completedAt: { gte: new Date(today.setHours(0, 0, 0, 0)) },
        },
      }),
      // Overdue tasks
      prisma.task.count({
        where: {
          userId,
          status: { not: 'DONE' },
          dueDate: { lt: new Date(new Date().setHours(0, 0, 0, 0)) },
          parentId: null,
        },
      }),
      // Due today
      prisma.task.count({
        where: {
          userId,
          status: { not: 'DONE' },
          dueDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: today,
          },
          parentId: null,
        },
      }),
      // Due this week
      prisma.task.count({
        where: {
          userId,
          status: { not: 'DONE' },
          dueDate: { gte: today, lte: weekEnd },
          parentId: null,
        },
      }),
      // Recently completed (last 7 days)
      prisma.task.count({
        where: {
          userId,
          status: 'DONE',
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Active projects
      prisma.project.count({
        where: { userId, isArchived: false },
      }),
    ])

    return {
      totalTasks,
      completedToday,
      overdueTasks,
      dueTodayTasks,
      dueThisWeekTasks,
      recentlyCompleted,
      projectCount,
    }
  },
}
