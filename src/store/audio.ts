import { create } from 'zustand'

interface AudioState {
  currentAudio: HTMLAudioElement | null
  currentMessageId: string | null
  isPlaying: boolean
  playAudio: (messageId: string, audioUrl: string) => Promise<void>
  stopAudio: () => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentAudio: null,
  currentMessageId: null,
  isPlaying: false,

  playAudio: async (messageId: string, audioUrl: string) => {
    // 先停止当前正在播放的音频
    const { currentAudio, currentMessageId } = get()
    
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.src = ''
    }
    
    // 如果是同一条消息，则停止（toggle效果）
    if (currentMessageId === messageId && get().isPlaying) {
      set({ currentAudio: null, currentMessageId: null, isPlaying: false })
      return
    }

    // 创建新的音频
    const audio = new Audio(audioUrl)
    
    audio.onended = () => {
      set({ currentAudio: null, currentMessageId: null, isPlaying: false })
    }
    
    audio.onerror = () => {
      set({ currentAudio: null, currentMessageId: null, isPlaying: false })
    }

    set({ currentAudio: audio, currentMessageId: messageId, isPlaying: true })
    
    try {
      await audio.play()
    } catch (error) {
      console.error('Audio play error:', error)
      set({ currentAudio: null, currentMessageId: null, isPlaying: false })
    }
  },

  stopAudio: () => {
    const { currentAudio } = get()
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.src = ''
    }
    set({ currentAudio: null, currentMessageId: null, isPlaying: false })
  },
}))
