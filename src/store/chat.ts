import { create } from 'zustand'

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
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  setMessages: (messages: Message[]) => void
  setLoading: (loading: boolean) => void
  setThinking: (thinking: string) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  thinking: '',
  
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
  
  clearMessages: () => set({ messages: [] })
}))
