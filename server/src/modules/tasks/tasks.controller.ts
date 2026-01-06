/**
 * @fileoverview Tasks Module Controller
 *
 * HTTP request handlers for tasks, projects, and labels.
 *
 * @module modules/tasks/tasks-controller
 */

import { Response } from 'express'
import { TaskPriority, TaskStatus } from '@prisma/client'
import { AuthRequest } from '../../middleware/auth.js'
import {
  taskService,
  projectService,
  labelService,
  tasksDashboardService,
} from './tasks.service.js'

// ==========================================
// Dashboard Controller
// ==========================================

export async function getDashboardSummary(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const summary = await tasksDashboardService.getDashboardSummary(userId)
    res.json(summary)
  } catch (error) {
    console.error('Error fetching tasks dashboard:', error)
    res.status(500).json({ message: 'Failed to fetch dashboard summary' })
  }
}

// ==========================================
// Task Controllers
// ==========================================

export async function getTasks(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { status, priority, projectId, includeCompleted, limit } = req.query

    const tasks = await taskService.getTasks(userId, {
      status: status as TaskStatus | undefined,
      priority: priority as TaskPriority | undefined,
      projectId: projectId === 'null' ? null : (projectId as string | undefined),
      includeCompleted: includeCompleted === 'true',
      limit: limit ? parseInt(limit as string) : undefined,
    })

    res.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({ message: 'Failed to fetch tasks' })
  }
}

export async function getTask(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { id } = req.params

    const task = await taskService.getTask(userId, id)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    res.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    res.status(500).json({ message: 'Failed to fetch task' })
  }
}

export async function createTask(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { title, description, priority, dueDate, projectId, parentId, labelIds } =
      req.body

    if (!title) {
      return res.status(400).json({ message: 'Title is required' })
    }

    const task = await taskService.createTask(userId, {
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      projectId,
      parentId,
      labelIds,
    })

    res.status(201).json(task)
  } catch (error) {
    console.error('Error creating task:', error)
    res.status(500).json({ message: 'Failed to create task' })
  }
}

export async function updateTask(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { id } = req.params
    const { title, description, priority, status, dueDate, projectId, labelIds } =
      req.body

    const task = await taskService.updateTask(userId, id, {
      title,
      description,
      priority,
      status,
      dueDate: dueDate === null ? null : dueDate ? new Date(dueDate) : undefined,
      projectId,
      labelIds,
    })

    res.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({ message: 'Failed to update task' })
  }
}

export async function toggleTaskStatus(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { id } = req.params

    const task = await taskService.toggleTaskStatus(userId, id)
    res.json(task)
  } catch (error) {
    console.error('Error toggling task status:', error)
    res.status(500).json({ message: 'Failed to toggle task status' })
  }
}

export async function deleteTask(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { id } = req.params

    await taskService.deleteTask(userId, id)
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting task:', error)
    res.status(500).json({ message: 'Failed to delete task' })
  }
}

export async function getTodaysTasks(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const tasks = await taskService.getTodaysTasks(userId)
    res.json(tasks)
  } catch (error) {
    console.error('Error fetching today\'s tasks:', error)
    res.status(500).json({ message: 'Failed to fetch today\'s tasks' })
  }
}

// ==========================================
// Project Controllers
// ==========================================

export async function getProjects(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { includeArchived } = req.query

    const projects = await projectService.getProjects(
      userId,
      includeArchived === 'true'
    )

    res.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    res.status(500).json({ message: 'Failed to fetch projects' })
  }
}

export async function getProject(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { id } = req.params

    const project = await projectService.getProject(userId, id)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    res.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    res.status(500).json({ message: 'Failed to fetch project' })
  }
}

export async function createProject(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { name, description, color, icon } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Name is required' })
    }

    const project = await projectService.createProject(userId, {
      name,
      description,
      color,
      icon,
    })

    res.status(201).json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    res.status(500).json({ message: 'Failed to create project' })
  }
}

export async function updateProject(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { id } = req.params
    const { name, description, color, icon, isArchived } = req.body

    const project = await projectService.updateProject(userId, id, {
      name,
      description,
      color,
      icon,
      isArchived,
    })

    res.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    res.status(500).json({ message: 'Failed to update project' })
  }
}

export async function deleteProject(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { id } = req.params

    await projectService.deleteProject(userId, id)
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting project:', error)
    res.status(500).json({ message: 'Failed to delete project' })
  }
}

// ==========================================
// Label Controllers
// ==========================================

export async function getLabels(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const labels = await labelService.getLabels(userId)
    res.json(labels)
  } catch (error) {
    console.error('Error fetching labels:', error)
    res.status(500).json({ message: 'Failed to fetch labels' })
  }
}

export async function createLabel(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { name, color } = req.body

    if (!name || !color) {
      return res.status(400).json({ message: 'Name and color are required' })
    }

    const label = await labelService.createLabel(userId, { name, color })
    res.status(201).json(label)
  } catch (error) {
    console.error('Error creating label:', error)
    res.status(500).json({ message: 'Failed to create label' })
  }
}

export async function updateLabel(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { id } = req.params
    const { name, color } = req.body

    const label = await labelService.updateLabel(userId, id, { name, color })
    res.json(label)
  } catch (error) {
    console.error('Error updating label:', error)
    res.status(500).json({ message: 'Failed to update label' })
  }
}

export async function deleteLabel(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!
    const { id } = req.params

    await labelService.deleteLabel(userId, id)
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting label:', error)
    res.status(500).json({ message: 'Failed to delete label' })
  }
}
