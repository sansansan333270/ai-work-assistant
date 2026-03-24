import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Sun, Moon, Check, ChevronLeft, Volume2 } from 'lucide-react-taro'
import { useThemeStore } from '@/store/theme'
import { useModelStore } from '@/store/models'
import { AI_MODELS } from '@/config/models'
import { Network } from '@/network'
import './index.css'

interface Voice {
  id: string
  name: string
  description: string
  gender: 'male' | 'female'
}

export default function Settings() {
  const { theme, toggleTheme } = useThemeStore()
  const { currentModel, setCurrentModel } = useModelStore()
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [selectedVoiceId, setSelectedVoiceId] = useState('zh_female_xiaohe_uranus_bigtts')
  const [voices, setVoices] = useState<Voice[]>([])
  const [showVoicePanel, setShowVoicePanel] = useState(false)

  useEffect(() => {
    // 从localStorage读取设置
    if (typeof window !== 'undefined') {
      const savedAutoSpeak = localStorage.getItem('autoSpeak')
      const savedVoiceId = localStorage.getItem('selectedVoiceId')
      
      if (savedAutoSpeak === 'true') {
        setAutoSpeak(true)
      }
      if (savedVoiceId) {
        setSelectedVoiceId(savedVoiceId)
      }
    }
    
    // 获取音色列表
    fetchVoices()
  }, [])

  // 获取音色列表
  const fetchVoices = async () => {
    try {
      const response = await Network.request({
        url: '/api/tts/voices',
        method: 'GET',
      })
      const data = response.data as { data?: Voice[] }
      if (data?.data) {
        setVoices(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error)
    }
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 切换自动朗读
  const handleToggleAutoSpeak = () => {
    const newValue = !autoSpeak
    setAutoSpeak(newValue)
    if (typeof window !== 'undefined') {
      localStorage.setItem('autoSpeak', String(newValue))
    }
    Taro.showToast({ 
      title: newValue ? '已开启自动朗读' : '已关闭自动朗读', 
      icon: 'none', 
      duration: 1000 
    })
  }

  // 选择音色
  const handleSelectVoice = (voiceId: string) => {
    setSelectedVoiceId(voiceId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedVoiceId', voiceId)
    }
    setShowVoicePanel(false)
    const voice = voices.find(v => v.id === voiceId)
    Taro.showToast({ title: `已选择${voice?.name || ''}`, icon: 'success', duration: 1000 })
  }

  // 当前选中的音色名称
  const selectedVoice = voices.find(v => v.id === selectedVoiceId)
  const iconColor = theme === 'dark' ? '#FFFFFF' : '#000000'
  const iconColorGray = theme === 'dark' ? '#888888' : '#8C8C8C'

  return (
    <View className={`min-h-screen bg-white dark:bg-black ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 顶部导航栏 */}
      <View className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <View className="flex items-center h-14 px-4">
          <View onClick={handleBack} className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-150">
            <ChevronLeft size={24} color={iconColor} />
          </View>
          <Text className="flex-1 text-center text-lg font-medium text-black dark:text-white">设置</Text>
          <View className="w-10 h-10" />
        </View>
      </View>

      {/* 内容区域 */}
      <View className="p-4">
        {/* 外观设置 */}
        <View className="mb-6">
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">外观设置</Text>
          <View className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-3">
                {theme === 'light' ? <Sun size={20} color={iconColorGray} /> : <Moon size={20} color={iconColorGray} />}
                <View>
                  <Text className="text-black dark:text-white">背景主题</Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">{theme === 'light' ? '浅色模式' : '深色模式'}</Text>
                </View>
              </View>
              <View 
                className="w-12 h-6 rounded-full relative cursor-pointer active:scale-95 transition-transform duration-150" 
                style={{ backgroundColor: theme === 'dark' ? '#22C55E' : '#D1D5DB' }} 
                onClick={toggleTheme}
              >
                <View 
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${theme === 'dark' ? 'left-7' : 'left-1'}`} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* 模型设置 */}
        <View className="mb-6">
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">模型设置</Text>
          <View className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
            {AI_MODELS.map((model, index) => (
              <View 
                key={model.id} 
                className={`p-4 cursor-pointer active:scale-98 transition-all duration-150 ${index < AI_MODELS.length - 1 ? 'border-b border-gray-200 dark:border-gray-800' : ''} ${currentModel.id === model.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`} 
                onClick={() => setCurrentModel(model.id)}
              >
                <View className="flex items-center justify-between">
                  <View className="flex-1">
                    <View className="flex items-center gap-2">
                      <Text className={`font-medium ${currentModel.id === model.id ? 'text-green-500' : 'text-black dark:text-white'}`}>{model.name}</Text>
                      {currentModel.id === model.id && <Check size={16} color="#22C55E" />}
                    </View>
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">{model.description}</Text>
                  </View>
                  <View className="flex items-center gap-2">
                    {model.supportsThinking && (
                      <View 
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                      >
                        <Text className="text-xs" style={{ color: '#22C55E' }}>深度思考</Text>
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
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">语音设置</Text>
          <View className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
            {/* 自动朗读开关 */}
            <View className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <View>
                <Text className="text-black dark:text-white">自动朗读回复</Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">开车时解放双手，AI回复后自动朗读</Text>
              </View>
              <View 
                className="w-12 h-6 rounded-full relative cursor-pointer active:scale-95 transition-transform duration-150" 
                style={{ backgroundColor: autoSpeak ? '#22C55E' : '#D1D5DB' }} 
                onClick={handleToggleAutoSpeak}
              >
                <View 
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${autoSpeak ? 'left-7' : 'left-1'}`} 
                />
              </View>
            </View>
            
            {/* 音色选择 */}
            <View className="p-4 cursor-pointer active:scale-98 transition-all duration-150" onClick={() => setShowVoicePanel(true)}>
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-3">
                  <Volume2 size={20} color={iconColorGray} />
                  <View>
                    <Text className="text-black dark:text-white">朗读音色</Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">{selectedVoice?.name || '小荷'} · {selectedVoice?.description || '温柔自然'}</Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-sm">{'>'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 关于 */}
        <View className="mb-6">
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">关于</Text>
          <View className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <Text className="text-black dark:text-white text-sm">AI工作助手 v1.0.0</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">基于 Taro + DeepSeek 构建</Text>
          </View>
        </View>
      </View>

      {/* 音色选择面板 */}
      {showVoicePanel && (
        <>
          <View 
            className="fixed inset-0 z-40" 
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }} 
            onClick={() => setShowVoicePanel(false)} 
          />
          <View 
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black rounded-t-2xl z-50 max-h-[70vh] overflow-hidden"
            style={{ animation: 'slideUp 0.25s ease-out' }}
          >
            <View className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <Text className="text-base font-medium text-black dark:text-white">选择音色</Text>
              <Text 
                className="text-gray-500 dark:text-gray-400 text-sm cursor-pointer active:opacity-60" 
                onClick={() => setShowVoicePanel(false)}
              >
                关闭
              </Text>
            </View>
            <View className="overflow-y-auto p-4" style={{ maxHeight: 'calc(70vh - 60px)' }}>
              {/* 女声 */}
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">女声</Text>
              <View className="grid grid-cols-2 gap-2 mb-4">
                {voices.filter(v => v.gender === 'female').map((voice) => (
                  <View 
                    key={voice.id} 
                    className={`p-3 rounded-xl cursor-pointer active:scale-95 transition-all duration-150 ${selectedVoiceId === voice.id ? 'bg-green-500' : 'bg-gray-50 dark:bg-gray-800'}`} 
                    onClick={() => handleSelectVoice(voice.id)}
                  >
                    <Text className={`text-sm font-medium ${selectedVoiceId === voice.id ? 'text-white' : 'text-black dark:text-white'}`}>{voice.name}</Text>
                    <Text className={`text-xs mt-1 ${selectedVoiceId === voice.id ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>{voice.description}</Text>
                  </View>
                ))}
              </View>
              
              {/* 男声 */}
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">男声</Text>
              <View className="grid grid-cols-2 gap-2">
                {voices.filter(v => v.gender === 'male').map((voice) => (
                  <View 
                    key={voice.id} 
                    className={`p-3 rounded-xl cursor-pointer active:scale-95 transition-all duration-150 ${selectedVoiceId === voice.id ? 'bg-green-500' : 'bg-gray-50 dark:bg-gray-800'}`} 
                    onClick={() => handleSelectVoice(voice.id)}
                  >
                    <Text className={`text-sm font-medium ${selectedVoiceId === voice.id ? 'text-white' : 'text-black dark:text-white'}`}>{voice.name}</Text>
                    <Text className={`text-xs mt-1 ${selectedVoiceId === voice.id ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>{voice.description}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  )
}
