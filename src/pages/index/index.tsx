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

// 声纹动画组件
function VoiceWaveAnimation({ isRecording }: { isRecording: boolean }) {
  if (!isRecording) return null
  
  return (
    <View className="flex items-center justify-center gap-1 h-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          className="w-1 bg-white rounded-full"
          style={{
            height: `${12 + Math.random() * 12}px`,
            animation: `wave 0.5s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </View>
  )
}

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
  const [recordingText, setRecordingText] = useState('')
  
  // 平台检测
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
  
  const recorderManagerRef = useRef<Taro.RecorderManager | null>(null)
  const recognitionRef = useRef<any>(null)
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

  // 初始化录音管理器（小程序端）
  useEffect(() => {
    if (isWeapp) {
      const manager = Taro.getRecorderManager()
      
      manager.onStart(() => {
        console.log('录音开始')
        setIsRecording(true)
      })
      
      manager.onStop((res) => {
        console.log('录音结束', res.tempFilePath)
        setIsRecording(false)
        // 这里可以上传音频文件进行语音识别
        handleUploadAudio(res.tempFilePath)
      })
      
      manager.onError((err) => {
        console.error('录音错误', err)
        setIsRecording(false)
        Taro.showToast({ title: '录音失败', icon: 'none' })
      })
      
      recorderManagerRef.current = manager
    }
  }, [isWeapp])

  // 初始化语音识别（H5端）
  useEffect(() => {
    if (!isWeapp && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                                (window as any).SpeechRecognition
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true
        recognitionInstance.lang = 'zh-CN'
        recognitionInstance.interimResults = true
        
        recognitionInstance.onresult = (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }
          
          if (interimTranscript) {
            setRecordingText(interimTranscript)
          }
          
          if (finalTranscript) {
            handleVoiceInput(finalTranscript)
            setRecordingText('')
          }
        }
        
        recognitionInstance.onerror = (err: any) => {
          console.error('语音识别错误', err)
          setIsRecording(false)
          setRecordingText('')
        }
        
        recognitionInstance.onend = () => {
          setIsRecording(false)
          setRecordingText('')
        }
        
        recognitionRef.current = recognitionInstance
      }
    }
  }, [isWeapp])

  // 上传音频文件（小程序端）
  const handleUploadAudio = async (audioPath: string) => {
    try {
      Taro.showLoading({ title: '识别中...' })
      
      const res = await Network.uploadFile({
        url: '/api/ai/voice-recognition',
        filePath: audioPath,
        name: 'audio'
      })
      
      Taro.hideLoading()
      
      // 解析返回数据
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      if (data?.text) {
        handleVoiceInput(data.text)
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('上传音频失败', error)
      Taro.showToast({ title: '语音识别失败', icon: 'none' })
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

  // 开始录音
  const handleStartRecord = () => {
    if (isWeapp) {
      recorderManagerRef.current?.start({
        format: 'mp3',
        sampleRate: 16000,
        numberOfChannels: 1
      })
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
          setIsRecording(true)
        } catch (error) {
          console.error('启动语音识别失败', error)
          Taro.showToast({ title: '请使用Chrome浏览器', icon: 'none' })
        }
      }
    }
  }

  // 停止录音
  const handleStopRecord = () => {
    if (isWeapp) {
      recorderManagerRef.current?.stop()
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsRecording(false)
    }
  }

  // 选择并上传文件
  const handleChooseFile = async () => {
    try {
      // 小程序端使用 chooseMessageFile
      if (isWeapp) {
        const res = await Taro.chooseMessageFile({
          count: 1,
          type: 'file'
        })
        const file = res.tempFiles[0]
        await uploadFile(file.path, file.name)
      } else {
        // H5端使用 input file
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '*/*'
        input.onchange = async (e: any) => {
          const file = e.target.files[0]
          if (file) {
            addMessage({
              type: 'text',
              content: `已选择文件：${file.name}`,
              from: 'user'
            })
          }
        }
        input.click()
      }
    } catch (error) {
      console.error('选择文件失败', error)
    }
  }

  // 上传文件到服务器
  const uploadFile = async (filePath: string, fileName: string) => {
    try {
      Taro.showLoading({ title: '上传中...' })
      
      await Network.uploadFile({
        url: '/api/upload',
        filePath: filePath,
        name: 'file'
      })
      
      Taro.hideLoading()
      
      addMessage({
        type: 'text',
        content: `已上传文件：${fileName}`,
        from: 'user'
      })
      
      Taro.showToast({ title: '上传成功', icon: 'success' })
    } catch (error) {
      Taro.hideLoading()
      console.error('上传失败', error)
      Taro.showToast({ title: '上传失败', icon: 'none' })
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
              <Text className="block text-lg font-medium text-black dark:text-white">选择模式</Text>
              <View onClick={() => setShowModePanel(false)} className="p-1 cursor-pointer">
                <Text className="block text-gray-500 text-sm">关闭</Text>
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
                    <Text className={`block text-sm font-medium ${isActive ? 'text-blue-500' : 'text-black dark:text-white'}`}>
                      {mode.label}
                    </Text>
                    <Text className="block text-xs text-gray-500">{mode.description}</Text>
                  </View>
                  {isActive && (
                    <View className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <Text className="block text-white text-xs">✓</Text>
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
          {/* 上方：输入区域（放大） */}
          {showTextInput ? (
            <View className="px-4 py-4">
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
              className={`flex flex-col items-center justify-center gap-2 px-4 py-5 cursor-pointer ${isRecording ? 'bg-blue-500' : ''}`}
              onClick={handleInputClick}
              onTouchStart={(e) => {
                e.preventDefault()
                handleStartRecord()
              }}
              onTouchEnd={(e) => {
                e.preventDefault()
                handleStopRecord()
              }}
            >
              {isRecording ? (
                <>
                  {/* 声纹动画 */}
                  <VoiceWaveAnimation isRecording={isRecording} />
                  <Text className="block text-sm text-white">
                    {recordingText || '正在聆听...'}
                  </Text>
                </>
              ) : (
                <>
                  <Mic size={22} color={iconColorGray} />
                  <Text className="block text-sm text-black dark:text-white">
                    按住说话，轻点输入
                  </Text>
                </>
              )}
            </View>
          )}
          
          {/* 分隔线 */}
          <View className="h-px bg-gray-200 dark:bg-gray-800 mx-4" />
          
          {/* 下方：功能按钮（缩小） */}
          <View className="flex items-center justify-between px-3 py-2">
            {/* 左侧：模式选择 */}
            <View 
              onClick={() => setShowModePanel(true)}
              className="flex items-center gap-0.5 px-2 py-1 cursor-pointer"
            >
              <Text className="block text-xs text-black dark:text-white">{currentMode.label}</Text>
              <ChevronDown size={12} color={iconColorGray} />
            </View>
            
            {/* 右侧：功能按钮 */}
            <View className="flex items-center gap-0.5">
              {/* @ 按钮 */}
              <View className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">
                <AtSign size={16} color={iconColorGray} />
              </View>
              
              {/* 加号按钮 - 上传文件 */}
              <View 
                onClick={handleChooseFile}
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              >
                <Plus size={16} color={iconColorGray} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
