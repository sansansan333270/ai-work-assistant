import { create } from 'zustand'
import { Network } from '@/network'

export interface Project {
  id: number
  name: string
  type: 'novel' | 'article' | 'code' | 'other'
  description: string
  settings: Record<string, any>
  outline: Record<string, any>
  writingStyle: Record<string, any>
  currentProgress: string
  status: 'active' | 'paused' | 'completed'
  sessionCount: number
  lastActiveAt: string
  createdAt: string
  updatedAt: string
}

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  
  fetchProjects: () => Promise<void>
  setCurrentProject: (project: Project | null) => void
  createProject: (data: {
    name: string
    type: string
    description?: string
    settings?: Record<string, any>
    outline?: Record<string, any>
    writingStyle?: Record<string, any>
  }) => Promise<Project | null>
  updateProject: (id: number, data: Partial<Project>) => Promise<void>
  deleteProject: (id: number) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true })
    try {
      const res = await Network.request({ url: '/api/projects' })
      const projects = res.data?.data || []
      // 解析 JSON 字段
      const parsedProjects = projects.map((p: any) => ({
        ...p,
        settings: p.settings ? JSON.parse(p.settings) : {},
        outline: p.outline ? JSON.parse(p.outline) : {},
        writingStyle: p.writingStyle ? JSON.parse(p.writingStyle) : {},
      }))
      set({ projects: parsedProjects, loading: false })
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      set({ loading: false })
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project })
  },

  createProject: async (data) => {
    try {
      const res = await Network.request({
        url: '/api/projects',
        method: 'POST',
        data
      })
      const newProject = res.data
      if (newProject) {
        const parsed = {
          ...newProject,
          settings: newProject.settings ? JSON.parse(newProject.settings) : {},
          outline: newProject.outline ? JSON.parse(newProject.outline) : {},
          writingStyle: newProject.writingStyle ? JSON.parse(newProject.writingStyle) : {},
        }
        set(state => ({ projects: [parsed, ...state.projects] }))
        return parsed
      }
      return null
    } catch (error) {
      console.error('Failed to create project:', error)
      return null
    }
  },

  updateProject: async (id, data) => {
    try {
      await Network.request({
        url: `/api/projects/${id}`,
        method: 'PUT',
        data
      })
      set(state => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...data } : p),
        currentProject: state.currentProject?.id === id ? { ...state.currentProject, ...data } : state.currentProject
      }))
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  },

  deleteProject: async (id) => {
    try {
      await Network.request({
        url: `/api/projects/${id}`,
        method: 'DELETE'
      })
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject
      }))
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }
}))
