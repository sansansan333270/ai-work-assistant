import { View, Text, Image } from '@tarojs/components'
import { Download, RefreshCw, Volume2 } from 'lucide-react-taro'

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

  const handlePlayVoice = () => {
    // TTS播放
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message.content)
      utterance.lang = 'zh-CN'
      speechSynthesis.speak(utterance)
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
          <View className="flex gap-4 mt-2 px-2">
            <View className="flex items-center gap-1">
              <Download size={14} color="#8C8C8C" />
              <Text className="text-xs text-gray-500">下载</Text>
            </View>
            <View className="flex items-center gap-1">
              <RefreshCw size={14} color="#8C8C8C" />
              <Text className="text-xs text-gray-500">重新生成</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <View 
        className={`
          rounded-2xl px-4 py-3 max-w-[80%]
          ${isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 dark:bg-gray-900'
          }
        `}
      >
        <Text className={isUser ? 'text-white' : 'text-black dark:text-white'}>
          {message.content}
        </Text>
        {!isUser && (
          <View className="flex items-center gap-2 mt-2">
            <View onClick={handlePlayVoice}>
              <Volume2 size={16} color="#8C8C8C" />
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
