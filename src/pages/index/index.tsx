import { View, Text, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import { ChatBubble } from '@/components/ChatBubble'
import { ThinkingMessage } from '@/components/ThinkingMessage'
import { Sidebar } from '@/components/Sidebar'
import { ModelSelector } from '@/components/ModelSelector'
import { ChatModeSelector } from '@/components/ChatModeSelector'
import { useThemeStore } from '@/store/theme'
import { useChatStore } from '@/store/chat'
import { useModelStore } from '@/store/models'
import { Menu, Send, Mic, Keyboard } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

export default function Chat() {
  const { theme } = useThemeStore()
  const { messages, isLoading, thinking, addMessage, setLoading, setThinking } = useChatStore()
  const { currentModel, chatMode } = useModelStore()
  const [inputText, setInputText] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // 欢迎消息
    if (messages.length === 0) {
      addMessage({
        type: 'text',
        content: `你好！我是${currentModel.name}，我记住了你的项目信息和偏好。有什么可以帮你的？`,
        from: 'ai'
      })
    }
  }, [])

  useEffect(() => {
    // 初始化语音识别（仅在H5环境）
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                                (window as any).SpeechRecognition
      console.log('SpeechRecognition available:', !!SpeechRecognition)
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = false
        recognitionInstance.lang = 'zh-CN'
        recognitionInstance.interimResults = false
        
        recognitionInstance.onresult = (event: any) => {
          console.log('Speech recognition result:', event.results)
          const transcript = event.results[0][0].transcript
          handleVoiceInput(transcript)
          setIsRecording(false)
        }
        
        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsRecording(false)
        }
        
        recognitionInstance.onend = () => {
          console.log('Speech recognition ended')
          setIsRecording(false)
        }
        
        recognitionInstance.onstart = () => {
          console.log('Speech recognition started successfully')
        }
        
        recognitionRef.current = recognitionInstance
      }
    }
  }, [])

  useEffect(() => {
    // 为桌面环境添加鼠标事件支持
    if (typeof window !== 'undefined') {
      const voiceButton = document.getElementById('voice-button')
      if (voiceButton) {
        const handleMouseDown = (e: MouseEvent) => {
          e.preventDefault()
          handleVoicePress()
        }
        const handleMouseUp = (e: MouseEvent) => {
          e.preventDefault()
          handleVoiceRelease()
        }
        const handleMouseLeave = () => {
          if (isRecording) {
            handleVoiceRelease()
          }
        }

        voiceButton.addEventListener('mousedown', handleMouseDown)
        voiceButton.addEventListener('mouseup', handleMouseUp)
        voiceButton.addEventListener('mouseleave', handleMouseLeave)

        return () => {
          voiceButton.removeEventListener('mousedown', handleMouseDown)
          voiceButton.removeEventListener('mouseup', handleMouseUp)
          voiceButton.removeEventListener('mouseleave', handleMouseLeave)
        }
      }
    }
  }, [isRecording])

  // 发送消息
  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage = inputText.trim()
    addMessage({ type: 'text', content: userMessage, from: 'user' })
    setInputText('')
    setLoading(true)

    try {
      // 调用AI接口
      const response = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: {
          message: userMessage,
          model: currentModel.id,
          mode: chatMode,
          context: messages.slice(-10) // 最近10条消息作为上下文
        }
      })

      // 如果有思考过程，显示思考内容
      if (response.data?.thinking) {
        setThinking(response.data.thinking)
      }

      // 添加AI回复
      addMessage({
        type: 'text',
        content: response.data?.answer || '收到，正在为你处理...',
        from: 'ai'
      })
    } catch (error) {
      console.error('AI request error:', error)
      addMessage({
        type: 'text',
        content: '抱歉，出现了错误，请稍后重试。',
        from: 'ai'
      })
    } finally {
      setLoading(false)
      setThinking('')
    }
  }

  const handleVoiceInput = (text: string) => {
    setInputText(text)
    // 直接发送语音识别的结果
    if (text.trim()) {
      addMessage({ type: 'text', content: text, from: 'user' })
      setInputText('')
      setLoading(true)
      
      // 调用AI接口
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

      addMessage({
        type: 'text',
        content: response.data?.answer || '收到，正在为你处理...',
        from: 'ai'
      })
    } catch (error) {
      console.error('AI request error:', error)
      addMessage({
        type: 'text',
        content: '抱歉，出现了错误，请稍后重试。',
        from: 'ai'
      })
    } finally {
      setLoading(false)
      setThinking('')
    }
  }

  const handleVoicePress = () => {
    console.log('handleVoicePress called, recognitionRef:', recognitionRef.current)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsRecording(true)
        console.log('Voice recognition started')
      } catch (error) {
        console.error('Voice recognition error:', error)
        setIsRecording(false)
      }
    } else {
      console.log('No speech recognition available')
      setIsRecording(false)
    }
  }

  const handleVoiceRelease = () => {
    console.log('handleVoiceRelease called')
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        console.log('Voice recognition stopped')
      } catch (error) {
        console.error('Voice recognition error:', error)
      }
    }
    setIsRecording(false)
  }

  return (
    <View className={`min-h-screen bg-white dark:bg-black ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 顶部导航 - 透明背景 */}
      <View className="fixed top-0 left-0 right-0 z-50">
        <View className="flex items-center justify-between h-14 px-4">
          <View 
            onClick={() => setShowSidebar(true)} 
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm cursor-pointer"
          >
            <Menu size={20} color="#1F1F1F" />
          </View>
          <ModelSelector />
          <View className="w-10" />
        </View>
      </View>

      {/* 侧边栏 */}
      {showSidebar && <Sidebar onClose={() => setShowSidebar(false)} />}

      {/* 对话内容 */}
      <ScrollView 
        className="pt-16 pb-32 px-4"
        scrollY
        scrollIntoView={messages.length > 0 ? `msg-${messages[messages.length - 1].id}` : ''}
      >
        {/* 对话模式选择器 */}
        <View className="mb-4">
          <ChatModeSelector />
        </View>

        {/* 思考过程 */}
        {thinking && <ThinkingMessage thinking={thinking} />}

        {/* 消息列表 */}
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

      {/* 底部输入 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black p-4">
        <View className="flex items-center gap-3">
          {/* 左侧切换按钮 */}
          <View 
            className="w-10 h-10 flex items-center justify-center cursor-pointer"
            onClick={() => setInputMode(inputMode === 'text' ? 'voice' : 'text')}
          >
            {inputMode === 'text' ? (
              <Mic size={22} color="#8C8C8C" />
            ) : (
              <Keyboard size={22} color="#8C8C8C" />
            )}
          </View>

          {/* 中间区域 */}
          {inputMode === 'text' ? (
            // 文本输入模式
            <>
              <View className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-full px-4 py-2">
                <Input
                  value={inputText}
                  onInput={(e) => setInputText(e.detail.value)}
                  placeholder={`向${currentModel.name}提问...`}
                  className="w-full bg-transparent text-black dark:text-white text-sm"
                  onConfirm={handleSend}
                  confirmType="send"
                />
              </View>
              <View 
                className="bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer"
                onClick={handleSend}
              >
                <Send size={18} color="#FFFFFF" />
              </View>
            </>
          ) : (
            // 语音输入模式
            <View 
              id="voice-button"
              className={`
                flex-1 h-10 flex items-center justify-center rounded-full cursor-pointer
                ${isRecording 
                  ? 'bg-red-500' 
                  : 'bg-gray-100 dark:bg-gray-900'
                }
              `}
              onTouchStart={(e) => {
                e.stopPropagation()
                handleVoicePress()
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
                handleVoiceRelease()
              }}
              onTouchCancel={(e) => {
                e.stopPropagation()
                handleVoiceRelease()
              }}
            >
              <Text className={`text-sm ${isRecording ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                {isRecording ? '松开发送' : '按住说话'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
