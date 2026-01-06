/**
 * @fileoverview Projects Page
 *
 * @module pages/tasks/Projects
 */

import { useState, useEffect } from 'react'
import api from '../../services/api'

interface Project {
  id: string
  name: string
  description: string | null
  color: string | null
  isArchived: boolean
  _count: { tasks: number }
}

const COLOR_OPTIONS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
]

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: COLOR_OPTIONS[0],
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await api.get<Project[]>('/tasks/projects?includeArchived=true')
      setProjects(response.data)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingProject) {
        await api.put(`/tasks/projects/${editingProject.id}`, formData)
      } else {
        await api.post('/tasks/projects', formData)
      }
      setFormData({ name: '', description: '', color: COLOR_OPTIONS[0] })
      setShowForm(false)
      setEditingProject(null)
      fetchProjects()
    } catch (err) {
      console.error('Failed to save project:', err)
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color || COLOR_OPTIONS[0],
    })
    setShowForm(true)
  }

  const handleArchive = async (project: Project) => {
    try {
      await api.put(`/tasks/projects/${project.id}`, {
        isArchived: !project.isArchived,
      })
      fetchProjects()
    } catch (err) {
      console.error('Failed to archive project:', err)
    }
  }

  const handleDelete = async (projectId: string) => {
    if (!confirm('Delete this project? Tasks will be moved to "No Project".')) return
    try {
      await api.delete(`/tasks/projects/${projectId}`)
      fetchProjects()
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingProject(null)
    setFormData({ name: '', description: '', color: COLOR_OPTIONS[0] })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  const activeProjects = projects.filter((p) => !p.isArchived)
  const archivedProjects = projects.filter((p) => p.isArchived)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Projects</h1>
          <p className="text-content-secondary mt-1">Organize your tasks into projects</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-theme-surface border border-border-subtle rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Project name"
              className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What's this project about?"
              rows={2}
              className="w-full px-3 py-2 bg-theme-elevated border border-border-subtle rounded-lg text-content-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-content-primary scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
              {editingProject ? 'Update Project' : 'Create Project'}
            </button>
            {editingProject && (
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 bg-theme-elevated text-content-secondary rounded-lg hover:text-content-primary"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Active Projects */}
      {activeProjects.length === 0 ? (
        <div className="text-center py-12 bg-theme-surface border border-border-subtle rounded-lg">
          <p className="text-content-tertiary">No projects yet. Create one to organize your tasks!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeProjects.map((project) => (
            <div
              key={project.id}
              className="bg-theme-surface border border-border-subtle rounded-lg p-4 hover:border-primary-500/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color || '#6B7280' }}
                  />
                  <div>
                    <h3 className="font-medium text-content-primary">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-content-tertiary mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-content-tertiary">
                  {project._count.tasks} active tasks
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-1.5 text-content-tertiary hover:text-content-primary rounded"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleArchive(project)}
                    className="p-1.5 text-content-tertiary hover:text-yellow-500 rounded"
                    title="Archive"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1.5 text-content-tertiary hover:text-red-500 rounded"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Archived Projects */}
      {archivedProjects.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-content-secondary mb-4">Archived Projects</h2>
          <div className="space-y-2">
            {archivedProjects.map((project) => (
              <div
                key={project.id}
                className="bg-theme-surface border border-border-subtle rounded-lg p-4 flex items-center justify-between opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color || '#6B7280' }}
                  />
                  <span className="text-content-secondary">{project.name}</span>
                  <span className="text-sm text-content-tertiary">({project._count.tasks} tasks)</span>
                </div>
                <button
                  onClick={() => handleArchive(project)}
                  className="text-sm text-primary-500 hover:text-primary-400"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
