import { View, Text } from '@tarojs/components'
import { Brain } from 'lucide-react-taro'

interface Props {
  thinking: string
  isThinking?: boolean
}

export function ThinkingMessage({ thinking, isThinking = false }: Props) {
  return (
    <View className="mb-4">
      <View className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
        {/* 头部 */}
        <View className="flex items-center gap-2 mb-2">
          <Brain size={16} color="#8C8C8C" />
          <Text className="text-sm text-gray-500">
            {isThinking ? '思考中...' : '思考过程'}
          </Text>
        </View>
        
        {/* 思考内容 - 直接展开 */}
        <View>
          {isThinking && !thinking ? (
            <View className="flex items-center gap-2">
              <View className="flex gap-1">
                <View 
                  className="w-1 h-1 rounded-full bg-gray-400"
                  style={{ animation: 'pulse 1s infinite' }}
                />
                <View 
                  className="w-1 h-1 rounded-full bg-gray-400"
                  style={{ animation: 'pulse 1s infinite', animationDelay: '0.2s' }}
                />
                <View 
                  className="w-1 h-1 rounded-full bg-gray-400"
                  style={{ animation: 'pulse 1s infinite', animationDelay: '0.4s' }}
                />
              </View>
              <Text className="text-sm text-gray-400">分析问题中...</Text>
            </View>
          ) : (
            <View>
              {thinking.split('\n').map((line, index) => (
                <Text 
                  key={index} 
                  className="block text-sm leading-relaxed text-gray-600 dark:text-gray-400"
                >
                  {line || ' '}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
