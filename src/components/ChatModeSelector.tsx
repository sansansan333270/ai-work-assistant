import { View, Text } from '@tarojs/components'
import { Zap, Brain, Sparkles } from 'lucide-react-taro'
import { useModelStore } from '@/store/models'

const modes = [
  { 
    id: 'fast' as const, 
    label: '快速', 
    icon: Zap, 
    description: '快速响应，适合简单问题' 
  },
  { 
    id: 'standard' as const, 
    label: '标准', 
    icon: Sparkles, 
    description: '平衡速度和质量' 
  },
  { 
    id: 'thinking' as const, 
    label: '深度思考', 
    icon: Brain, 
    description: '深度推理，适合复杂问题' 
  }
]

export function ChatModeSelector() {
  const { chatMode, setChatMode, currentModel } = useModelStore()

  return (
    <View className="flex gap-2 mb-3">
      {modes.map((mode) => {
        const IconComponent = mode.icon
        const isActive = chatMode === mode.id
        const isDisabled = mode.id === 'thinking' && !currentModel.supportsThinking

        return (
          <View
            key={mode.id}
            className={`
              flex-1 p-3 rounded-xl cursor-pointer transition-all
              ${isActive 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-900 text-black dark:text-white'
              }
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => !isDisabled && setChatMode(mode.id)}
          >
            <View className="flex flex-col items-center gap-1">
              <IconComponent size={20} color={isActive ? '#FFFFFF' : '#1F1F1F'} />
              <Text className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>{mode.label}</Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}
