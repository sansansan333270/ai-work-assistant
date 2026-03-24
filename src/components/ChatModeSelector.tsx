import { View, Text } from '@tarojs/components'
import { Zap, Brain, Sparkles } from 'lucide-react-taro'
import { useModelStore } from '@/store/models'

const modes = [
  { 
    id: 'fast' as const, 
    label: '快速', 
    icon: Zap
  },
  { 
    id: 'standard' as const, 
    label: '标准', 
    icon: Sparkles
  },
  { 
    id: 'thinking' as const, 
    label: '深度', 
    icon: Brain
  }
]

export function ChatModeSelector() {
  const { chatMode, setChatMode, currentModel } = useModelStore()

  return (
    <View className="flex gap-2 justify-center">
      {modes.map((mode) => {
        const IconComponent = mode.icon
        const isActive = chatMode === mode.id
        const isDisabled = mode.id === 'thinking' && !currentModel.supportsThinking

        return (
          <View
            key={mode.id}
            className={`
              flex items-center gap-1 px-3 py-2 rounded-full cursor-pointer transition-all
              ${isActive 
                ? 'bg-blue-500' 
                : 'bg-gray-100 dark:bg-gray-900'
              }
              ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
            `}
            onClick={() => !isDisabled && setChatMode(mode.id)}
          >
            <IconComponent size={12} color={isActive ? '#FFFFFF' : '#8C8C8C'} />
            <Text className={`text-xs ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
              {mode.label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
