import { View, Text } from '@tarojs/components'
import { Brain, ChevronDown, ChevronUp } from 'lucide-react-taro'
import { useState } from 'react'

interface Props {
  thinking: string
}

export function ThinkingMessage({ thinking }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <View className="mb-4">
      <View className="bg-purple-50 dark:bg-purple-900 dark:bg-opacity-20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
        <View 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <View className="flex items-center gap-2">
            <Brain size={18} color="#9333EA" />
            <Text className="text-sm font-medium text-purple-600 dark:text-purple-400">
              深度思考中...
            </Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={18} color="#9333EA" />
          ) : (
            <ChevronDown size={18} color="#9333EA" />
          )}
        </View>
        
        {isExpanded && (
          <View className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
            <Text className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {thinking}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}
