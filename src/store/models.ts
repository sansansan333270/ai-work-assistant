import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AIModel, AI_MODELS, DEFAULT_MODEL } from '@/config/models'

interface ModelState {
  currentModel: AIModel
  models: AIModel[]
  chatMode: 'standard' | 'thinking' | 'fast'
  setCurrentModel: (modelId: string) => void
  setChatMode: (mode: 'standard' | 'thinking' | 'fast') => void
  getModelById: (modelId: string) => AIModel | undefined
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      currentModel: DEFAULT_MODEL, // 默认DeepSeek
      models: AI_MODELS,
      chatMode: 'standard',
      
      setCurrentModel: (modelId) => {
        const model = AI_MODELS.find(m => m.id === modelId)
        if (model) {
          set({ currentModel: model })
          // 如果切换到不支持深度思考的模型，自动切换到标准模式
          if (!model.supportsThinking && get().chatMode === 'thinking') {
            set({ chatMode: 'standard' })
          }
        }
      },
      
      setChatMode: (mode) => set({ chatMode: mode }),
      
      getModelById: (modelId) => AI_MODELS.find(m => m.id === modelId)
    }),
    {
      name: 'model-storage'
    }
  )
)
