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
import { Menu, Volume2, VolumeX, FileText, Mic } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

export default function Chat() {
  const { theme } = useThemeStore()
  const { messages, isLoading, thinking, addMessage, setLoading, setThinking } = useChatStore()
  const { currentModel, chatMode } = useModelStore()
  const [inputText, setInputText] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  
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

  // 发送消息
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
      addMessage({
        type: 'text',
        content: aiReply,
        from: 'ai'
      })

      // 如果开启了语音回复，使用语音合成朗读
      if (voiceReplyEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiReply)
        utterance.lang = 'zh-CN'
        utterance.rate = 1.0
        window.speechSynthesis.speak(utterance)
      }
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
      addMessage({
        type: 'text',
        content: aiReply,
        from: 'ai'
      })

      // 语音回复
      if (voiceReplyEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiReply)
        utterance.lang = 'zh-CN'
        utterance.rate = 1.0
        window.speechSynthesis.speak(utterance)
      }
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

  // 单击输入区域 - 显示文字输入
  const handleInputClick = () => {
    setShowTextInput(true)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  // 长按开始语音输入
  const handleTouchStart = (e: any) => {
    const touch = e.touches[0]
    touchStartY.current = touch.clientY
    isLongPress.current = false
    
    // 设置长按计时器（300ms判定为长按）
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

  // 触摸移动，检测上滑取消
  const handleTouchMove = (e: any) => {
    if (!isLongPress.current) {
      // 如果还没进入长按状态，移动就取消长按判定
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
      return
    }
    
    const touch = e.touches[0]
    const deltaY = touchStartY.current - touch.clientY
    
    // 向上滑动超过50px判定为取消
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

  // 触摸结束
  const handleTouchEnd = () => {
    // 清除长按计时器
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
    
    if (isRecording) {
      // 停止语音识别
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
            
            {/* AI语音回复开关 */}
            <View 
              onClick={() => setVoiceReplyEnabled(!voiceReplyEnabled)}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer ${
                voiceReplyEnabled 
                  ? 'bg-blue-500' 
                  : 'bg-white dark:bg-gray-900'
              }`}
            >
              {voiceReplyEnabled ? (
                <Volume2 size={20} color="#FFFFFF" />
              ) : (
                <VolumeX size={20} color="#8C8C8C" />
              )}
            </View>
          </View>
        </View>
      </View>

      {/* 侧边栏 */}
      {showSidebar && <Sidebar onClose={() => setShowSidebar(false)} />}

      {/* 对话内容 */}
      <ScrollView 
        className="pt-16 pb-40 px-4"
        scrollY
        scrollIntoView={messages.length > 0 ? `msg-${messages[messages.length - 1].id}` : ''}
      >
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

      {/* 底部输入区域 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black px-4 pt-3 pb-4">
        {showTextInput ? (
          // 文字输入模式
          <View className="flex items-center gap-3">
            <View className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-full px-4 py-3">
              <Input
                ref={inputRef}
                value={inputText}
                onInput={(e) => setInputText(e.detail.value)}
                placeholder={`向${currentModel.name}提问...`}
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
            <View 
              className="bg-blue-500 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer"
              onClick={handleSend}
            >
              <Text className="text-white text-base">发送</Text>
            </View>
          </View>
        ) : (
          // 语音输入区域（单击=文字输入，长按=语音）
          <View 
            className="flex items-center gap-3"
            style={{ touchAction: 'none' }}
            onClick={handleInputClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <View className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-full px-4 py-3 cursor-pointer">
              <View className="flex items-center justify-center gap-2">
                <Mic size={18} color="#8C8C8C" />
                <Text className="text-gray-400 text-sm">
                  {isRecording ? '正在录音...' : '按住说话，轻点输入文字'}
                </Text>
              </View>
            </View>
          </View>
        )}
        
        {/* 对话模式选择器 - 放在输入框下方 */}
        <View className="mt-2">
          <ChatModeSelector />
        </View>
      </View>
    </View>
  )
}
