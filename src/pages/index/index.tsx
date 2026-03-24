import { View, Text, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { ChatBubble } from '@/components/ChatBubble'
import { ThinkingMessage } from '@/components/ThinkingMessage'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStore } from '@/store/theme'
import { useChatStore } from '@/store/chat'
import { useModelStore } from '@/store/models'
import { Menu, Volume2, VolumeX, FileText, Mic, ChevronDown, Plus, Send } from 'lucide-react-taro'
import { Network } from '@/network'

const modes = [
  { id: 'fast' as const, label: '快速', description: '快速响应' },
  { id: 'standard' as const, label: '标准', description: '标准回答' },
  { id: 'thinking' as const, label: '深度', description: '深度思考' },
]

export default function Chat() {
  const { theme } = useThemeStore()
  const { messages, isLoading, thinking, addMessage, setLoading, setThinking } = useChatStore()
  const { currentModel, chatMode, setChatMode } = useModelStore()
  const [inputText, setInputText] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [showModePanel, setShowModePanel] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
  const recorderManagerRef = useRef<Taro.RecorderManager | null>(null)
  const recognitionRef = useRef<any>(null)
  const longPressTimerRef = useRef<any>(null)
  const isLongPressRef = useRef(false)

  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        type: 'text',
        content: `你好！我是${currentModel.name}，有什么可以帮你的？`,
        from: 'ai'
      })
    }
  }, [])

  // 初始化录音（小程序）
  useEffect(() => {
    if (isWeapp) {
      const manager = Taro.getRecorderManager()
      manager.onStop((res) => {
        setIsRecording(false)
        uploadAudio(res.tempFilePath)
      })
      manager.onError(() => {
        setIsRecording(false)
        Taro.showToast({ title: '录音失败', icon: 'none' })
      })
      recorderManagerRef.current = manager
    }
  }, [isWeapp])

  // 初始化语音识别（H5）
  useEffect(() => {
    if (!isWeapp && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.lang = 'zh-CN'
        recognition.interimResults = true
        recognition.onresult = (e: any) => {
          const text = e.results[0][0].transcript
          setInputText(text)
          if (e.results[0].isFinal) {
            setIsRecording(false)
            setShowTextInput(true)
          }
        }
        recognition.onerror = (err: any) => {
          console.error('Speech error:', err)
          setIsRecording(false)
          Taro.showToast({ title: '语音识别失败', icon: 'none' })
        }
        recognition.onend = () => {
          setIsRecording(false)
        }
        recognitionRef.current = recognition
      }
    }
  }, [isWeapp])

  const uploadAudio = async (path: string) => {
    try {
      Taro.showLoading({ title: '识别中...' })
      const res = await Network.uploadFile({
        url: '/api/ai/voice-recognition',
        filePath: path,
        name: 'audio'
      })
      Taro.hideLoading()
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      if (data?.text) {
        setInputText(data.text)
        setShowTextInput(true)
      }
    } catch {
      Taro.hideLoading()
      Taro.showToast({ title: '识别失败', icon: 'none' })
    }
  }

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return
    const userMessage = inputText.trim()
    addMessage({ type: 'text', content: userMessage, from: 'user' })
    setInputText('')
    setShowTextInput(false)
    setLoading(true)

    try {
      const response = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: {
          message: userMessage,
          model: currentModel.id,
          mode: chatMode,
          context: messages.slice(-10)
        }
      })

      if (response.data?.thinking) setThinking(response.data.thinking)

      const aiReply = response.data?.answer || '收到，正在为你处理...'
      addMessage({ type: 'text', content: aiReply, from: 'ai' })

      if (voiceReplyEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiReply)
        utterance.lang = 'zh-CN'
        window.speechSynthesis.speak(utterance)
      }
    } catch (error) {
      console.error('AI request error:', error)
      addMessage({ type: 'text', content: '抱歉，出现了错误，请稍后重试。', from: 'ai' })
    } finally {
      setLoading(false)
      setThinking('')
    }
  }

  // 开始录音
  const startRecording = () => {
    if (isWeapp) {
      recorderManagerRef.current?.start({ format: 'mp3', sampleRate: 16000, numberOfChannels: 1 })
      setIsRecording(true)
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
          setIsRecording(true)
        } catch (err: any) {
          console.error('Failed to start speech:', err)
          Taro.showToast({ title: '语音识别启动失败', icon: 'none' })
        }
      } else {
        Taro.showToast({ title: '浏览器不支持语音识别', icon: 'none' })
      }
    }
  }

  // 停止录音
  const stopRecording = () => {
    if (isWeapp) {
      recorderManagerRef.current?.stop()
    } else {
      recognitionRef.current?.stop()
    }
    setIsRecording(false)
  }

  // 长按开始
  const handleTouchStart = () => {
    isLongPressRef.current = false
    // 300ms 后触发长按
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      startRecording()
    }, 300)
  }

  // 长按结束
  const handleTouchEnd = () => {
    // 清除计时器
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    
    // 如果是长按，停止录音
    if (isLongPressRef.current) {
      stopRecording()
    } else {
      // 如果是短按，切换到文字输入
      if (!isRecording) {
        setShowTextInput(true)
      }
    }
  }

  // 选择文件
  const handleChooseFile = async () => {
    try {
      if (isWeapp) {
        const res = await Taro.chooseMessageFile({ count: 1, type: 'file' })
        const file = res.tempFiles[0]
        Taro.showLoading({ title: '上传中...' })
        await Network.uploadFile({ url: '/api/upload', filePath: file.path, name: 'file' })
        Taro.hideLoading()
        addMessage({ type: 'text', content: `已上传：${file.name}`, from: 'user' })
      } else {
        const input = document.createElement('input')
        input.type = 'file'
        input.onchange = async (e: any) => {
          const file = e.target.files[0]
          if (file) {
            addMessage({ type: 'text', content: `已选择：${file.name}`, from: 'user' })
          }
        }
        input.click()
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('选择文件失败', error)
    }
  }

  const currentMode = modes.find(m => m.id === chatMode) || modes[1]
  const iconColor = theme === 'dark' ? '#FFFFFF' : '#1F1F1F'
  const iconColorGray = theme === 'dark' ? '#666666' : '#8C8C8C'

  return (
    <View className={`min-h-screen bg-white dark:bg-black ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 顶部导航 */}
      <View className="fixed top-0 left-0 right-0 z-50">
        <View className="flex items-center justify-between h-14 px-4">
          <View onClick={() => setShowSidebar(true)} className="p-2 cursor-pointer">
            <Menu size={22} color={iconColor} />
          </View>
          <Text className="text-base font-medium text-black dark:text-white">{currentModel.name}</Text>
          <View className="flex items-center gap-1">
            <View onClick={() => Taro.navigateTo({ url: '/pages/document/index' })} className="p-2 cursor-pointer">
              <FileText size={22} color={iconColor} />
            </View>
            <View onClick={() => setVoiceReplyEnabled(!voiceReplyEnabled)} className="p-2 cursor-pointer">
              {voiceReplyEnabled ? <Volume2 size={22} color="#1890FF" /> : <VolumeX size={22} color={iconColorGray} />}
            </View>
          </View>
        </View>
      </View>

      {/* 侧边栏 */}
      {showSidebar && <Sidebar onClose={() => setShowSidebar(false)} />}

      {/* 对话内容 */}
      <ScrollView className="pt-16 pb-40 px-4" scrollY scrollIntoView={messages.length > 0 ? `msg-${messages[messages.length - 1].id}` : ''}>
        {thinking && <ThinkingMessage thinking={thinking} />}
        {messages.map((msg) => (
          <View key={msg.id} id={`msg-${msg.id}`}>
            <ChatBubble message={msg} />
          </View>
        ))}
        {isLoading && (
          <View className="flex justify-start mb-4">
            <Text className="block text-gray-500 text-sm">正在思考...</Text>
          </View>
        )}
      </ScrollView>

      {/* 模式选择面板 */}
      {showModePanel && (
        <>
          <View className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }} onClick={() => setShowModePanel(false)} />
          <View className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-50 p-4">
            <View className="flex items-center justify-between mb-4">
              <Text className="block text-lg font-medium text-black dark:text-white">选择模式</Text>
              <Text className="block text-gray-500 text-sm cursor-pointer" onClick={() => setShowModePanel(false)}>关闭</Text>
            </View>
            {modes.map((mode) => {
              const isActive = chatMode === mode.id
              const isDisabled = mode.id === 'thinking' && !currentModel.supportsThinking
              return (
                <View
                  key={mode.id}
                  className={`flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer ${isActive ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : 'bg-gray-50 dark:bg-gray-800'} ${isDisabled ? 'opacity-40' : ''}`}
                  onClick={() => { if (!isDisabled) { setChatMode(mode.id); setShowModePanel(false) } }}
                >
                  <View className="flex-1">
                    <Text className={`block text-sm font-medium ${isActive ? 'text-blue-500' : 'text-black dark:text-white'}`}>{mode.label}</Text>
                    <Text className="block text-xs text-gray-500">{mode.description}</Text>
                  </View>
                  {isActive && <View className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><Text className="block text-white text-xs">✓</Text></View>}
                </View>
              )
            })}
          </View>
        </>
      )}

      {/* 底部输入区域 - 两排布局 */}
      <View className="fixed bottom-0 left-0 right-0 p-3">
        <View className="bg-gray-100 dark:bg-gray-900 rounded-3xl overflow-hidden">
          {/* 上排：输入区域 */}
          {showTextInput ? (
            <View className="flex items-center gap-2 px-4 py-3">
              <Input
                value={inputText}
                onInput={(e) => setInputText(e.detail.value)}
                onConfirm={handleSend}
                placeholder="输入消息..."
                placeholderClass="text-gray-400"
                className="flex-1 bg-transparent text-sm text-black dark:text-white"
                confirmType="send"
                autoFocus
                onBlur={() => { if (!inputText.trim()) setShowTextInput(false) }}
              />
              {inputText.trim() && (
                <View onClick={handleSend} className="p-1 cursor-pointer">
                  <Send size={20} color="#1890FF" />
                </View>
              )}
            </View>
          ) : (
            <View 
              className={`flex items-center justify-center gap-2 px-4 py-3 ${isRecording ? 'bg-blue-500' : ''}`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Mic size={20} color={isRecording ? '#FFFFFF' : iconColorGray} />
              <Text className={`text-sm ${isRecording ? 'text-white' : 'text-black dark:text-white'}`}>
                {isRecording ? '正在聆听...' : '按住说话，轻点输入'}
              </Text>
            </View>
          )}
          
          {/* 分隔线 */}
          <View className="h-px bg-gray-200 dark:bg-gray-800 mx-4" />
          
          {/* 下排：功能按钮 */}
          <View className="flex items-center justify-between px-3 py-2">
            {/* 左侧：模式选择 */}
            <View onClick={() => setShowModePanel(true)} className="flex items-center gap-1 cursor-pointer">
              <Text className="block text-xs text-black dark:text-white">{currentMode.label}</Text>
              <ChevronDown size={12} color={iconColorGray} />
            </View>
            
            {/* 右侧：功能按钮 */}
            <View className="flex items-center gap-2">
              {/* 加号按钮 */}
              <View onClick={handleChooseFile} className="p-1 cursor-pointer">
                <Plus size={16} color={iconColorGray} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
