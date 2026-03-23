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
      {/* 当前模型显示 - 圆角胶囊按钮 */}
      <View 
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-full shadow-sm cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Text className="text-sm text-black dark:text-white font-medium">{currentModel.name}</Text>
        <ChevronDown size={16} color="#8C8C8C" />
      </View>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          <View 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <View className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl z-50 border border-gray-100 dark:border-gray-800 overflow-hidden min-w-[140px]">
            {AI_MODELS.map((model) => (
              <View
                key={model.id}
                className={`
                  flex items-center justify-between px-4 py-3 cursor-pointer
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  ${currentModel.id === model.id ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : ''}
                `}
                onClick={() => {
                  setCurrentModel(model.id)
                  setIsOpen(false)
                }}
              >
                <Text className={`text-sm ${currentModel.id === model.id ? 'text-blue-500 font-medium' : 'text-black dark:text-white'}`}>
                  {model.name}
                </Text>
                {currentModel.id === model.id && (
                  <Check size={16} color="#1890FF" />
                )}
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  )
}
