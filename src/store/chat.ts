import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Message {
  id: string
  type: 'text' | 'image'
  content: string
  from: 'user' | 'ai'
  timestamp: number
  thinking?: string
}

interface ChatState {
  messages: Message[]
  isLoading: boolean
  thinking: string
  currentSessionId: number | null
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  setMessages: (messages: Message[]) => void
  setLoading: (loading: boolean) => void
  setThinking: (thinking: string) => void
  clearMessages: () => void
  setCurrentSessionId: (id: number | null) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      thinking: '',
      currentSessionId: null,
      
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, {
          ...message,
          id: Date.now().toString(),
          timestamp: Date.now()
        }]
      })),
      
      setMessages: (messages) => set({ messages }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setThinking: (thinking) => set({ thinking }),
      
      clearMessages: () => set({ messages: [], currentSessionId: null }),
      
      setCurrentSessionId: (id) => set({ currentSessionId: id }),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      // 只持久化消息和会话ID，不持久化loading状态
      partialize: (state) => ({ 
        messages: state.messages,
        currentSessionId: state.currentSessionId 
      }),
    }
  )
)
