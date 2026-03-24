import { View, Text, Image } from '@tarojs/components'
import { Volume2, VolumeX, Bookmark } from 'lucide-react-taro'
import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { useAudioStore } from '@/store/audio'
import { MarkdownRenderer, cleanMarkdownForSpeech } from './MarkdownRenderer'

interface Message {
  id: string
  type: 'text' | 'image'
  content: string
  from: 'user' | 'ai'
}

interface Props {
  message: Message
  autoPlay?: boolean // 是否自动朗读
}

export function ChatBubble({ message, autoPlay = false }: Props) {
  const isUser = message.from === 'user'
  const isImage = message.type === 'image'
  const [saving, setSaving] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const hasAutoPlayed = useRef(false) // 防止重复自动播放
  
  // 使用全局音频状态
  const { currentMessageId, isPlaying, playAudio, stopAudio } = useAudioStore()
  
  // 当前消息是否正在播放
  const isCurrentMessage = currentMessageId === message.id
  const isSpeaking = isCurrentMessage && isPlaying

  // 获取音频URL
  const getAudioUrl = async (): Promise<string | null> => {
    if (audioUrl) return audioUrl
    
    try {
      // 获取用户选择的音色
      // 有效的音色ID列表（与后端保持一致）
      const validVoiceIds = [
        'zh_female_xiaohe_uranus_bigtts',
        'zh_female_vv_uranus_bigtts',
        'zh_female_xueayi_saturn_bigtts',
        'zh_female_mizai_saturn_bigtts',
        'zh_female_jitangnv_saturn_bigtts',
        'zh_male_m191_uranus_bigtts',
        'zh_male_taocheng_uranus_bigtts',
        'zh_male_dayi_saturn_bigtts',
      ]
      const defaultVoice = 'zh_female_xiaohe_uranus_bigtts'
      
      // 获取用户选择的音色，如果无效则使用默认值
      let voiceId = typeof window !== 'undefined' 
        ? localStorage.getItem('selectedVoiceId') || defaultVoice
        : defaultVoice
      
      // 验证音色ID是否有效
      if (!validVoiceIds.includes(voiceId)) {
        voiceId = defaultVoice
        // 清除无效的localStorage值
        if (typeof window !== 'undefined') {
          localStorage.removeItem('selectedVoiceId')
        }
      }
      
      // 清理Markdown格式
      const cleanText = cleanMarkdownForSpeech(message.content)
      
      // 调用扣子TTS接口
      const response = await Network.request({
        url: '/api/tts/synthesize',
        method: 'POST',
        data: {
          text: cleanText,
          speaker: voiceId,
        },
      })

      const data = response.data as { data?: { audioUrl?: string }; code?: number }
      
      if (data?.data?.audioUrl) {
        setAudioUrl(data.data.audioUrl)
        return data.data.audioUrl
      }
      return null
    } catch (error) {
      console.error('Load audio error:', error)
      return null
    }
  }

  // 自动朗读（仅对新的AI消息）
  useEffect(() => {
    if (!isUser && !isImage && autoPlay && !hasAutoPlayed.current && message.content) {
      hasAutoPlayed.current = true
      
      // 检查是否开启自动朗读
      const autoSpeakEnabled = typeof window !== 'undefined' 
        ? localStorage.getItem('autoSpeak') === 'true'
        : false
      
      if (autoSpeakEnabled) {
        // 延迟一点，确保消息渲染完成
        setTimeout(async () => {
          const url = await getAudioUrl()
          if (url) {
            playAudio(message.id, url)
          }
        }, 300)
      }
    }
  }, [message.id, autoPlay])

  // 手动播放/停止
  const handlePlayVoice = async () => {
    // 如果正在播放当前消息，则停止
    if (isSpeaking) {
      stopAudio()
      return
    }
    
    setLoading(true)
    try {
      const url = await getAudioUrl()
      if (url) {
        playAudio(message.id, url)
      } else {
        Taro.showToast({ title: '语音合成失败', icon: 'none' })
      }
    } catch (error) {
      console.error('TTS error:', error)
      Taro.showToast({ title: '语音合成失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToNote = async () => {
    if (saving) return
    
    setSaving(true)
    try {
      const title = message.content.substring(0, 20) + (message.content.length > 20 ? '...' : '')
      
      await Network.request({
        url: '/api/notes/from-chat',
        method: 'POST',
        data: {
          title,
          content: message.content,
          sourceId: message.id
        }
      })
      
      Taro.showToast({ title: '已保存到笔记本', icon: 'success' })
    } catch (error) {
      console.error('Failed to save note:', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  if (isImage) {
    return (
      <View className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        <View className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-2 max-w-[80%]">
          <Image 
            src={message.content}
            className="w-full rounded-xl"
            mode="widthFix"
          />
        </View>
      </View>
    )
  }

  // 用户消息：对话框形式，三个圆角，右上角直角
  if (isUser) {
    return (
      <View className="flex justify-end mb-4">
        <View 
          className="px-4 py-3 max-w-[80%] bg-green-500"
          style={{
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            borderTopRightRadius: 4
          }}
        >
          <Text className="text-white text-sm">{message.content}</Text>
        </View>
      </View>
    )
  }

  // AI消息：无对话框，直接显示，铺满页面
  return (
    <View className="flex justify-start mb-4">
      <View className="w-full">
        <MarkdownRenderer content={message.content} />
        <View className="flex items-center gap-3 mt-3">
          <View onClick={handlePlayVoice} className="flex items-center gap-1 cursor-pointer active:scale-95 transition-transform duration-150">
            {isSpeaking ? (
              <VolumeX size={14} color="#22C55E" />
            ) : (
              <Volume2 size={14} color="#8C8C8C" />
            )}
            <Text className={`text-xs ${isSpeaking ? 'text-green-500' : 'text-gray-500'}`}>
              {loading ? '加载中...' : isSpeaking ? '停止' : '朗读'}
            </Text>
          </View>
          <View onClick={handleSaveToNote} className="flex items-center gap-1 cursor-pointer active:scale-95 transition-transform duration-150">
            <Bookmark size={14} color={saving ? '#22C55E' : '#8C8C8C'} />
            <Text className="text-xs text-gray-500">保存</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
