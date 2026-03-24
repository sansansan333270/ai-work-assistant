import { View, Text, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { ChatBubble } from '@/components/ChatBubble'
import { ThinkingMessage } from '@/components/ThinkingMessage'
import { Sidebar } from '@/components/Sidebar'
import { ChatModeSelector } from '@/components/ChatModeSelector'
import { useThemeStore } from '@/store/theme'
import { useChatStore } from '@/store/chat'
import { useModelStore } from '@/store/models'
import { Menu, Mic, FileText, MicOff } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

export default function Chat() {
  const { theme } = useThemeStore()
  const { messages, isLoading, thinking, addMessage, setLoading, setThinking } = useChatStore()
  const { currentModel, chatMode } = useModelStore()
  const [inputText, setInputText] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)
  const isRecordingRef = useRef(false)

  // 同步isRecording状态到ref
  useEffect(() => {
    isRecordingRef.current = isRecording
  }, [isRecording])

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
    // 初始化语音识别（仅在H5环境且语音启用时）
    if (typeof window !== 'undefined' && voiceEnabled) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                                (window as any).SpeechRecognition
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = false
        recognitionInstance.lang = 'zh-CN'
        recognitionInstance.interimResults = false
        
        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          handleVoiceInput(transcript)
          setIsRecording(false)
        }
        
        recognitionInstance.onerror = () => {
          setIsRecording(false)
        }
        
        recognitionInstance.onend = () => {
          setIsRecording(false)
        }
        
        recognitionRef.current = recognitionInstance
      }
    }
  }, [voiceEnabled])

  // 发送消息
  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage = inputText.trim()
    addMessage({ type: 'text', content: userMessage, from: 'user' })
    setInputText('')
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
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsRecording(true)
      } catch (error) {
        console.error('Voice recognition error:', error)
        setIsRecording(false)
      }
    }
  }

  const handleVoiceRelease = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Voice recognition error:', error)
      }
    }
    setIsRecording(false)
  }

  // 跳转到文档工作台
  const goToDocument = () => {
    Taro.navigateTo({ url: '/pages/document/index' })
  }

  return (
    <View className={`min-h-screen bg-white dark:bg-black ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 顶部导航 */}
      <View className="fixed top-0 left-0 right-0 z-50">
        <View className="flex items-center justify-between h-14 px-4">
          {/* 左侧菜单按钮 */}
          <View 
            onClick={() => setShowSidebar(true)} 
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm cursor-pointer"
          >
            <Menu size={20} color="#1F1F1F" />
          </View>
          
          {/* 中间标题 */}
          <Text className="text-base font-medium text-black dark:text-white">
            {currentModel.name}
          </Text>
          
          {/* 右侧按钮组 */}
          <View className="flex items-center gap-2">
            {/* 文档工作台快捷入口 */}
            <View 
              onClick={goToDocument}
              className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm cursor-pointer"
            >
              <FileText size={20} color="#8C8C8C" />
            </View>
            
            {/* 语音开关按钮 */}
            <View 
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer ${
                voiceEnabled 
                  ? 'bg-blue-500' 
                  : 'bg-white dark:bg-gray-900'
              }`}
            >
              {voiceEnabled ? (
                <Mic size={20} color="#FFFFFF" />
              ) : (
                <MicOff size={20} color="#8C8C8C" />
              )}
            </View>
          </View>
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
          {voiceEnabled ? (
            // 语音输入模式
            <View 
              className={`
                flex-1 h-12 flex items-center justify-center rounded-full cursor-pointer select-none
                ${isRecording 
                  ? 'bg-red-500' 
                  : 'bg-gray-100 dark:bg-gray-900'
                }
              `}
              style={{ touchAction: 'none' }}
              onTouchStart={(e) => {
                e.preventDefault()
                handleVoicePress()
              }}
              onTouchEnd={(e) => {
                e.preventDefault()
                handleVoiceRelease()
              }}
              onTouchCancel={(e) => {
                e.preventDefault()
                handleVoiceRelease()
              }}
            >
              <Text className={`text-base font-medium ${isRecording ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                {isRecording ? '松开发送' : '按住说话'}
              </Text>
            </View>
          ) : (
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
                <Text className="text-white text-lg">发送</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  )
}
