import { create } from 'zustand'

export interface Skill {
  id: number
  userId: string
  name: string
  description: string
  prompt: string
  category: string
  icon: string
  isPublic: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

interface SkillsState {
  skills: Skill[]
  loading: boolean
  setSkills: (skills: Skill[]) => void
  addSkill: (skill: Skill) => void
  updateSkill: (id: number, skill: Partial<Skill>) => void
  removeSkill: (id: number) => void
  setLoading: (loading: boolean) => void
  fetchSkills: () => Promise<void>
}

export const useSkillsStore = create<SkillsState>((set) => ({
  skills: [],
  loading: false,
  
  setSkills: (skills) => set({ skills }),
  
  addSkill: (skill) => set((state) => ({
    skills: [skill, ...state.skills]
  })),
  
  updateSkill: (id, updatedSkill) => set((state) => ({
    skills: state.skills.map((s) => s.id === id ? { ...s, ...updatedSkill } : s)
  })),
  
  removeSkill: (id) => set((state) => ({
    skills: state.skills.filter((s) => s.id !== id)
  })),
  
  setLoading: (loading) => set({ loading }),
  
  fetchSkills: async () => {
    set({ loading: true })
    try {
      const { Network } = await import('@/network')
      const res = await Network.request({ url: '/api/skills' })
      const data = res.data as { data: Skill[] }
      set({ skills: data.data || [], loading: false })
    } catch {
      set({ loading: false })
    }
  }
}))
