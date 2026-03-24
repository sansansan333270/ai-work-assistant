import { View, Text, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { ChatBubble } from '@/components/ChatBubble'
import { ThinkingMessage } from '@/components/ThinkingMessage'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStore } from '@/store/theme'
import { useChatStore } from '@/store/chat'
import { useModelStore } from '@/store/models'
import { Menu, Volume2, VolumeX, FileText, Mic, ChevronDown, Plus, AtSign } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

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
  const [showTextInput, setShowTextInput] = useState(false)
  const [showModePanel, setShowModePanel] = useState(false)
  
  // AI语音回复开关
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(false)
  
  // 语音输入状态
  const [isRecording, setIsRecording] = useState(false)
  const [showVoiceHint, setShowVoiceHint] = useState(false)
  const [voiceHintText, setVoiceHintText] = useState('松开发送，上滑取消')
  const [isCancellingState, setIsCancelling] = useState(false)
  
  const recognitionRef = useRef<any>(null)
  const touchStartY = useRef(0)
  const longPressTimer = useRef<any>(null)
  const isLongPress = useRef(false)
  const isCancelling = useRef(false)
  const inputRef = useRef<any>(null)

  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        type: 'text',
        content: `你好！我是${currentModel.name}，我记住了你的项目信息和偏好。有什么可以帮你的？`,
        from: 'ai'
      })
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                                (window as any).SpeechRecognition
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = false
        recognitionInstance.lang = 'zh-CN'
        recognitionInstance.interimResults = false
        
        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          if (!isCancelling.current) {
            handleVoiceInput(transcript)
          }
          setIsRecording(false)
          setShowVoiceHint(false)
        }
        
        recognitionInstance.onerror = () => {
          setIsRecording(false)
          setShowVoiceHint(false)
        }
        
        recognitionInstance.onend = () => {
          setIsRecording(false)
          setShowVoiceHint(false)
        }
        
        recognitionRef.current = recognitionInstance
      }
    }
  }, [])

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

      if (response.data?.thinking) {
        setThinking(response.data.thinking)
      }

      const aiReply = response.data?.answer || '收到，正在为你处理...'
      addMessage({ type: 'text', content: aiReply, from: 'ai' })

      if (voiceReplyEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiReply)
        utterance.lang = 'zh-CN'
        utterance.rate = 1.0
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

  const handleVoiceInput = (text: string) => {
    if (text.trim()) {
      addMessage({ type: 'text', content: text, from: 'user' })
      setLoading(true)
      handleSendVoice(text)
    }
  }

  const handleSendVoice = async (text: string) => {
    try {
      const response = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: {
          message: text,
          model: currentModel.id,
          mode: chatMode,
          context: messages.slice(-10)
        }
      })

      if (response.data?.thinking) {
        setThinking(response.data.thinking)
      }

      const aiReply = response.data?.answer || '收到，正在为你处理...'
      addMessage({ type: 'text', content: aiReply, from: 'ai' })

      if (voiceReplyEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiReply)
        utterance.lang = 'zh-CN'
        utterance.rate = 1.0
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

  const handleInputClick = () => {
    setShowTextInput(true)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  const handleTouchStart = (e: any) => {
    const touch = e.touches[0]
    touchStartY.current = touch.clientY
    isLongPress.current = false
    
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      setIsRecording(true)
      setShowVoiceHint(true)
      setVoiceHintText('松开发送，上滑取消')
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (error) {
          console.error('Voice recognition error:', error)
        }
      }
    }, 300)
  }

  const handleTouchMove = (e: any) => {
    if (!isLongPress.current) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
      return
    }
    
    const touch = e.touches[0]
    const deltaY = touchStartY.current - touch.clientY
    
    if (deltaY > 50) {
      isCancelling.current = true
      setIsCancelling(true)
      setVoiceHintText('松开取消发送')
    } else {
      isCancelling.current = false
      setIsCancelling(false)
      setVoiceHintText('松开发送，上滑取消')
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
    
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (error) {
          console.error('Voice recognition error:', error)
        }
      }
      
      setIsRecording(false)
      setShowVoiceHint(false)
    }
  }

  // 选择文件
  const handleChooseFile = () => {
    Taro.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0]
        addMessage({ 
          type: 'text', 
          content: `已选择文件：${file.name}`, 
          from: 'user' 
        })
      }
    })
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
          
          <Text className="text-base font-medium text-black dark:text-white">
            {currentModel.name}
          </Text>
          
          <View className="flex items-center gap-1">
            <View onClick={() => Taro.navigateTo({ url: '/pages/document/index' })} className="p-2 cursor-pointer">
              <FileText size={22} color={iconColor} />
            </View>
            <View onClick={() => setVoiceReplyEnabled(!voiceReplyEnabled)} className="p-2 cursor-pointer">
              {voiceReplyEnabled ? (
                <Volume2 size={22} color="#1890FF" />
              ) : (
                <VolumeX size={22} color={iconColorGray} />
              )}
            </View>
          </View>
        </View>
      </View>

      {/* 侧边栏 */}
      {showSidebar && <Sidebar onClose={() => setShowSidebar(false)} />}

      {/* 对话内容 */}
      <ScrollView 
        className="pt-16 pb-44 px-4"
        scrollY
        scrollIntoView={messages.length > 0 ? `msg-${messages[messages.length - 1].id}` : ''}
      >
        {thinking && <ThinkingMessage thinking={thinking} />}

        {messages.map((msg) => (
          <View key={msg.id} id={`msg-${msg.id}`}>
            <ChatBubble message={msg} />
          </View>
        ))}
        
        {isLoading && (
          <View className="flex justify-start mb-4">
            <View className="bg-gray-100 dark:bg-gray-900 rounded-2xl px-4 py-3">
              <Text className="text-gray-500 dark:text-gray-400">正在思考...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 语音输入提示遮罩 */}
      {showVoiceHint && (
        <View 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <View
            className={`
              flex flex-col items-center justify-center 
              w-40 h-40 rounded-full
              ${isCancellingState ? 'bg-red-500' : 'bg-gray-800'}
            `}
          >
            <Mic size={40} color="#FFFFFF" />
            <Text className="text-white text-sm mt-3">{voiceHintText}</Text>
          </View>
        </View>
      )}

      {/* 模式选择上拉面板 */}
      {showModePanel && (
        <>
          <View 
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            onClick={() => setShowModePanel(false)}
          />
          <View className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-50 p-4">
            <View className="flex items-center justify-between mb-4">
              <Text className="text-lg font-medium text-black dark:text-white">选择模式</Text>
              <View onClick={() => setShowModePanel(false)} className="p-1 cursor-pointer">
                <Text className="text-gray-500 text-sm">关闭</Text>
              </View>
            </View>
            {modes.map((mode) => {
              const isActive = chatMode === mode.id
              const isDisabled = mode.id === 'thinking' && !currentModel.supportsThinking
              
              return (
                <View
                  key={mode.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer
                    ${isActive ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : 'bg-gray-50 dark:bg-gray-800'}
                    ${isDisabled ? 'opacity-40' : ''}
                  `}
                  onClick={() => {
                    if (!isDisabled) {
                      setChatMode(mode.id)
                      setShowModePanel(false)
                    }
                  }}
                >
                  <View className="flex-1">
                    <Text className={`text-sm font-medium ${isActive ? 'text-blue-500' : 'text-black dark:text-white'}`}>
                      {mode.label}
                    </Text>
                    <Text className="text-xs text-gray-500">{mode.description}</Text>
                  </View>
                  {isActive && (
                    <View className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <Text className="text-white text-xs">✓</Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        </>
      )}

      {/* 底部输入区域 - 大圆角框 */}
      <View className="fixed bottom-0 left-0 right-0 p-3">
        <View className="bg-gray-100 dark:bg-gray-900 rounded-3xl overflow-hidden">
          {/* 上方：输入区域 */}
          {showTextInput ? (
            <View className="px-4 py-3">
              <Input
                ref={inputRef}
                value={inputText}
                onInput={(e) => setInputText(e.detail.value)}
                placeholder="输入消息..."
                className="w-full bg-transparent text-black dark:text-white text-sm"
                onConfirm={handleSend}
                confirmType="send"
                onBlur={() => {
                  if (!inputText.trim()) {
                    setShowTextInput(false)
                  }
                }}
              />
            </View>
          ) : (
            <View 
              className={`px-4 py-3 cursor-pointer ${isRecording ? 'bg-red-500' : ''}`}
              style={{ touchAction: 'none' }}
              onClick={handleInputClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <Text className={`text-center text-base font-medium ${isRecording ? 'text-white' : 'text-black dark:text-white'}`}>
                按住 说话
              </Text>
            </View>
          )}
          
          {/* 分隔线 */}
          <View className="h-px bg-gray-200 dark:bg-gray-800 mx-4" />
          
          {/* 下方：功能按钮 */}
          <View className="flex items-center justify-between px-2 py-2">
            {/* 左侧：模式选择 */}
            <View 
              onClick={() => setShowModePanel(true)}
              className="flex items-center gap-1 px-3 py-2 cursor-pointer"
            >
              <Text className="text-sm text-black dark:text-white">{currentMode.label}</Text>
              <ChevronDown size={14} color={iconColorGray} />
            </View>
            
            {/* 右侧：功能按钮 */}
            <View className="flex items-center gap-1">
              {/* @ 按钮 */}
              <View className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer">
                <AtSign size={20} color={iconColorGray} />
              </View>
              
              {/* 加号按钮 - 上传文件 */}
              <View 
                onClick={handleChooseFile}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
              >
                <Plus size={20} color={iconColorGray} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
