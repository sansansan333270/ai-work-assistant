import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react-taro'
import { useModelStore } from '@/store/models'
import { AI_MODELS } from '@/config/models'

export function ModelSelector() {
  const { currentModel, setCurrentModel } = useModelStore()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <View className="relative">
      {/* 当前模型显示 */}
      <View 
        className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Text className="text-sm text-black dark:text-white">{currentModel.name}</Text>
        <ChevronDown size={16} color="#8C8C8C" />
      </View>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          <View 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <View className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 border dark:border-gray-800">
            {AI_MODELS.map((model) => (
              <View
                key={model.id}
                className={`
                  flex items-center justify-between p-3 cursor-pointer
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  ${currentModel.id === model.id ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : ''}
                `}
                onClick={() => {
                  setCurrentModel(model.id)
                  setIsOpen(false)
                }}
              >
                <View className="flex-1">
                  <View className="flex items-center gap-2">
                    <Text className="text-black dark:text-white font-medium">{model.name}</Text>
                    {model.pricing === 'free' ? (
                      <View className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded-full">
                        <Text className="text-xs text-green-600 dark:text-green-400">免费</Text>
                      </View>
                    ) : (
                      <View className="px-2 py-1 bg-orange-100 dark:bg-orange-900 rounded-full">
                        <Text className="text-xs text-orange-600 dark:text-orange-400">付费</Text>
                      </View>
                    )}
                    {model.supportsThinking && (
                      <View className="px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded-full">
                        <Text className="text-xs text-purple-600 dark:text-purple-400">深度思考</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-500 mt-1">{model.description}</Text>
                </View>
                {currentModel.id === model.id && (
                  <Check size={18} color="#1890FF" />
                )}
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  )
}
