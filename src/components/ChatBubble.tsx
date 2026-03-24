import { View, Text, Image } from '@tarojs/components'
import { Volume2, VolumeX, Bookmark } from 'lucide-react-taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
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

// 语音音色配置
const voiceOptions = [
  { id: 'default', name: '默认', pitch: 1, rate: 1 },
  { id: 'friendly', name: '亲切', pitch: 1.1, rate: 0.9 },
  { id: 'professional', name: '专业', pitch: 1, rate: 0.95 },
  { id: 'lively', name: '活泼', pitch: 1.2, rate: 1.1 },
]

export function ChatBubble({ message }: Props) {
  const isUser = message.from === 'user'
  const isImage = message.type === 'image'
  const [saving, setSaving] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState('default')

  useEffect(() => {
    // 从localStorage读取音色设置
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voiceSetting')
      if (saved) {
        setSelectedVoice(saved)
      }
    }
    
    // 监听语音结束
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = () => {
        // 语音列表加载完成
      }
    }
  }, [])

  const handlePlayVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }

    // 如果正在朗读，停止
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    // 清理Markdown格式
    const cleanText = cleanMarkdownForSpeech(message.content)
    
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'zh-CN'
    
    // 应用音色设置
    const voiceSetting = voiceOptions.find(v => v.id === selectedVoice) || voiceOptions[0]
    utterance.pitch = voiceSetting.pitch
    utterance.rate = voiceSetting.rate
    
    // 尝试选择中文语音
    const voices = window.speechSynthesis.getVoices()
    const zhVoice = voices.find(v => v.lang.includes('zh'))
    if (zhVoice) {
      utterance.voice = zhVoice
    }
    
    utterance.onend = () => {
      setIsSpeaking(false)
    }
    
    utterance.onerror = () => {
      setIsSpeaking(false)
    }
    
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
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
      
      alert('已保存到笔记本')
    } catch (error) {
      console.error('Failed to save note:', error)
      alert('保存失败，请重试')
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

  // AI消息：无对话框，直接显示（支持Markdown）
  return (
    <View className="flex justify-start mb-4">
      <View className="max-w-[85%]">
        <MarkdownRenderer content={message.content} />
        <View className="flex items-center gap-3 mt-3">
          <View onClick={handlePlayVoice} className="flex items-center gap-1 cursor-pointer">
            {isSpeaking ? (
              <VolumeX size={14} color="#1890FF" />
            ) : (
              <Volume2 size={14} color="#8C8C8C" />
            )}
            <Text className={`text-xs ${isSpeaking ? 'text-blue-500' : 'text-gray-500'}`}>
              {isSpeaking ? '停止' : '朗读'}
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

// 导出音色选项供设置页面使用
export { voiceOptions }
