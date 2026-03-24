import { View, Text, Image } from '@tarojs/components'
import { Volume2, Bookmark } from 'lucide-react-taro'
import { useState } from 'react'
import { Network } from '@/network'

interface Message {
  id: string
  type: 'text' | 'image'
  content: string
  from: 'user' | 'ai'
}

interface Props {
  message: Message
}

export function ChatBubble({ message }: Props) {
  const isUser = message.from === 'user'
  const isImage = message.type === 'image'
  const [saving, setSaving] = useState(false)

  const handlePlayVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message.content)
      utterance.lang = 'zh-CN'
      speechSynthesis.speak(utterance)
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

  // AI消息：无对话框，直接显示
  return (
    <View className="flex justify-start mb-4">
      <View className="max-w-[85%]">
        <Text className="block text-black dark:text-white text-sm leading-relaxed">{message.content}</Text>
        <View className="flex items-center gap-3 mt-3">
          <View onClick={handlePlayVoice} className="flex items-center gap-1 cursor-pointer">
            <Volume2 size={14} color="#8C8C8C" />
            <Text className="text-xs text-gray-500">朗读</Text>
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
