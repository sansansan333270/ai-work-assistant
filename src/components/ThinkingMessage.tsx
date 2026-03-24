import { View, Text } from '@tarojs/components'
import { Brain, ChevronDown, ChevronUp, Loader } from 'lucide-react-taro'
import { useState } from 'react'

interface Props {
  thinking: string
  isThinking?: boolean
}

export function ThinkingMessage({ thinking, isThinking = false }: Props) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!thinking && !isThinking) return null

  return (
    <View className="mb-4">
      <View 
        className="rounded-2xl overflow-hidden"
        style={{ 
          backgroundColor: 'rgba(147, 51, 234, 0.08)',
          border: '1px solid rgba(147, 51, 234, 0.2)'
        }}
      >
        {/* 头部 */}
        <View 
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <View className="flex items-center gap-2">
            {isThinking ? (
              <Loader size={18} color="#9333EA" className="animate-spin" />
            ) : (
              <Brain size={18} color="#9333EA" />
            )}
            <Text className="text-sm font-medium" style={{ color: '#9333EA' }}>
              {isThinking ? '正在深度思考...' : '思考过程'}
            </Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={18} color="#9333EA" />
          ) : (
            <ChevronDown size={18} color="#9333EA" />
          )}
        </View>
        
        {/* 思考内容 */}
        {isExpanded && (
          <View 
            className="px-4 pb-3 pt-0"
            style={{ borderTop: '1px solid rgba(147, 51, 234, 0.15)' }}
          >
            {isThinking && !thinking ? (
              <View className="flex items-center gap-2 py-2">
                <View className="flex gap-1">
                  <View className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <View className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <View className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </View>
                <Text className="text-sm text-purple-400">分析问题中...</Text>
              </View>
            ) : (
              <View className="py-2">
                {thinking.split('\n').map((line, index) => (
                  <Text 
                    key={index} 
                    className="block text-sm leading-relaxed mb-1"
                    style={{ color: 'rgba(0, 0, 0, 0.6)' }}
                  >
                    {line || ' '}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  )
}
