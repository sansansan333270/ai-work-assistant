import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import { Sun, Moon, ChevronRight } from 'lucide-react-taro'
import { useThemeStore } from '@/store/theme'
import { useModelStore } from '@/store/models'
import { AI_MODELS } from '@/config/models'
import './index.css'

export default function Settings() {
  const { theme, toggleTheme } = useThemeStore()
  const { currentModel, setCurrentModel } = useModelStore()
  const [autoPlay, setAutoPlay] = useState(true)

  return (
    <View className={`min-h-screen bg-white dark:bg-black p-4 ${theme === 'dark' ? 'dark' : ''}`}>
      <Text className="text-2xl font-bold text-black dark:text-white mb-6">设置</Text>

      {/* 外观设置 */}
      <View className="mb-6">
        <Text className="text-sm text-gray-500 mb-3">🎨 外观设置</Text>
        <View className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
          <View className="flex items-center justify-between">
            <View className="flex items-center gap-3">
              {theme === 'light' ? <Sun size={20} color="#8C8C8C" /> : <Moon size={20} color="#8C8C8C" />}
              <View>
                <Text className="text-black dark:text-white">背景主题</Text>
                <Text className="text-xs text-gray-500">
                  {theme === 'light' ? '浅色模式' : '深色模式'}
                </Text>
              </View>
            </View>
            
            <View 
              className="w-12 h-6 rounded-full relative cursor-pointer"
              style={{ backgroundColor: theme === 'dark' ? '#1890FF' : '#D1D5DB' }}
              onClick={toggleTheme}
            >
              <View 
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white
                  transition-transform duration-300
                  ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </View>
          </View>
        </View>
      </View>

      {/* AI设置 */}
      <View className="mb-6">
        <Text className="text-sm text-gray-500 mb-3">🤖 AI设置</Text>
        <View className="bg-gray-50 dark:bg-gray-900 rounded-xl">
          <View className="flex items-center justify-between p-4 border-b dark:border-gray-800">
            <Text className="text-black dark:text-white">对话模型</Text>
            <View className="flex items-center gap-2">
              <Text className="text-gray-500">{currentModel.name}</Text>
              <ChevronRight size={16} color="#8C8C8C" />
            </View>
          </View>
          <View className="flex items-center justify-between p-4">
            <Text className="text-black dark:text-white">生图模型</Text>
            <View className="flex items-center gap-2">
              <Text className="text-gray-500">你的API</Text>
              <ChevronRight size={16} color="#8C8C8C" />
            </View>
          </View>
        </View>
      </View>

      {/* 语音设置 */}
      <View className="mb-6">
        <Text className="text-sm text-gray-500 mb-3">📱 语音设置</Text>
        <View className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
          <View className="flex items-center justify-between">
            <Text className="text-black dark:text-white">自动播放回复</Text>
            <View 
              className="w-12 h-6 rounded-full relative cursor-pointer"
              style={{ backgroundColor: autoPlay ? '#1890FF' : '#D1D5DB' }}
              onClick={() => setAutoPlay(!autoPlay)}
            >
              <View 
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white
                  transition-transform duration-300
                  ${autoPlay ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </View>
          </View>
        </View>
      </View>

      {/* 模型管理 */}
      <View className="mb-6">
        <Text className="text-sm text-gray-500 mb-3">🤖 模型管理</Text>
        <View className="bg-gray-50 dark:bg-gray-900 rounded-xl">
          {AI_MODELS.map((model) => (
            <View 
              key={model.id} 
              className="p-4 border-b dark:border-gray-800 last:border-b-0 cursor-pointer"
              onClick={() => setCurrentModel(model.id)}
            >
              <View className="flex items-center justify-between">
                <View>
                  <Text className="text-black dark:text-white font-medium">{model.name}</Text>
                  <Text className="text-xs text-gray-500">{model.provider}</Text>
                </View>
                <View className="flex items-center gap-2">
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
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
