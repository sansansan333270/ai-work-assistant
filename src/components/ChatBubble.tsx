import { View, Text, Image } from '@tarojs/components'
import { Volume2, VolumeX, Bookmark } from 'lucide-react-taro'
import { useState, useEffect } from 'react'
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
}

// 扣子TTS音色映射
const voiceMap: Record<string, string> = {
  default: 'zh_female_xiaohe_uranus_bigtts',
  friendly: 'zh_female_xueayi_saturn_bigtts',
  professional: 'zh_male_m191_uranus_bigtts',
  lively: 'zh_female_mizai_saturn_bigtts',
}

export function ChatBubble({ message }: Props) {
  const isUser = message.from === 'user'
  const isImage = message.type === 'image'
  const [saving, setSaving] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  // 使用全局音频状态
  const { currentMessageId, isPlaying, playAudio, stopAudio } = useAudioStore()
  
  // 当前消息是否正在播放
  const isCurrentMessage = currentMessageId === message.id
  const isSpeaking = isCurrentMessage && isPlaying

  // 预加载音频
  useEffect(() => {
    if (!isUser && !isImage && message.content) {
      loadAudio()
    }
  }, [message.content])

  const loadAudio = async () => {
    try {
      // 获取用户选择的音色
      const voiceSetting = typeof window !== 'undefined' 
        ? localStorage.getItem('voiceSetting') || 'default' 
        : 'default'
      const speaker = voiceMap[voiceSetting] || voiceMap.default
      
      // 清理Markdown格式
      const cleanText = cleanMarkdownForSpeech(message.content)
      
      // 调用扣子TTS接口
      const response = await Network.request({
        url: '/api/tts/synthesize',
        method: 'POST',
        data: {
          text: cleanText,
          speaker,
        },
      })

      const data = response.data as { data?: { audioUrl?: string }; code?: number }
      
      if (data?.data?.audioUrl) {
        setAudioUrl(data.data.audioUrl)
      }
    } catch (error) {
      console.error('Load audio error:', error)
    }
  }

  const handlePlayVoice = async () => {
    // 如果正在播放当前消息，则停止
    if (isSpeaking) {
      stopAudio()
      return
    }
    
    // 如果有缓存的音频URL，直接播放
    if (audioUrl) {
      playAudio(message.id, audioUrl)
      return
    }

    // 否则先加载音频
    setLoading(true)
    try {
      // 获取用户选择的音色
      const voiceSetting = typeof window !== 'undefined' 
        ? localStorage.getItem('voiceSetting') || 'default' 
        : 'default'
      const speaker = voiceMap[voiceSetting] || voiceMap.default
      
      // 清理Markdown格式
      const cleanText = cleanMarkdownForSpeech(message.content)
      
      // 调用扣子TTS接口
      const response = await Network.request({
        url: '/api/tts/synthesize',
        method: 'POST',
        data: {
          text: cleanText,
          speaker,
        },
      })

      const data = response.data as { data?: { audioUrl?: string }; code?: number }
      
      if (data?.data?.audioUrl) {
        setAudioUrl(data.data.audioUrl)
        playAudio(message.id, data.data.audioUrl)
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
          className="px-4 py-3 max-w-[80%] bg-blue-500"
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
          <View onClick={handlePlayVoice} className="flex items-center gap-1 cursor-pointer">
            {isSpeaking ? (
              <VolumeX size={14} color="#1890FF" />
            ) : (
              <Volume2 size={14} color="#8C8C8C" />
            )}
            <Text className={`text-xs ${isSpeaking ? 'text-blue-500' : 'text-gray-500'}`}>
              {loading ? '加载中...' : isSpeaking ? '停止' : '朗读'}
            </Text>
          </View>
          <View onClick={handleSaveToNote} className="flex items-center gap-1 cursor-pointer">
            <Bookmark size={14} color={saving ? '#3B82F6' : '#8C8C8C'} />
            <Text className="text-xs text-gray-500">保存</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
