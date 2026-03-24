import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import { Sun, Moon, Check } from 'lucide-react-taro'
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
        <Text className="text-sm text-gray-500 mb-3">外观设置</Text>
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

      {/* 模型设置 */}
      <View className="mb-6">
        <Text className="text-sm text-gray-500 mb-3">模型设置</Text>
        <View className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
          {AI_MODELS.map((model, index) => (
            <View 
              key={model.id} 
              className={`
                p-4 cursor-pointer
                ${index < AI_MODELS.length - 1 ? 'border-b dark:border-gray-800' : ''}
                ${currentModel.id === model.id ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : ''}
              `}
              onClick={() => setCurrentModel(model.id)}
            >
              <View className="flex items-center justify-between">
                <View className="flex-1">
                  <View className="flex items-center gap-2">
                    <Text className={`font-medium ${currentModel.id === model.id ? 'text-blue-500' : 'text-black dark:text-white'}`}>
                      {model.name}
                    </Text>
                    {currentModel.id === model.id && (
                      <Check size={16} color="#1890FF" />
                    )}
                  </View>
                  <Text className="text-xs text-gray-500 mt-1">{model.description}</Text>
                </View>
                <View className="flex items-center gap-2">
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

      {/* 语音设置 */}
      <View className="mb-6">
        <Text className="text-sm text-gray-500 mb-3">语音设置</Text>
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

      {/* 关于 */}
      <View className="mb-6">
        <Text className="text-sm text-gray-500 mb-3">关于</Text>
        <View className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
          <Text className="text-black dark:text-white text-sm">AI工作助手 v1.0.0</Text>
          <Text className="text-xs text-gray-500 mt-2">基于 Taro + DeepSeek 构建</Text>
        </View>
      </View>
    </View>
  )
}
