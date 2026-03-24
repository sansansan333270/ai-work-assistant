import { View, Text, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { ChatBubble } from '@/components/ChatBubble'
import { ThinkingMessage } from '@/components/ThinkingMessage'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStore } from '@/store/theme'
import { useChatStore } from '@/store/chat'
import { useModelStore } from '@/store/models'
import { useSkillsStore } from '@/store/skills'
import { Menu, Mic, ChevronDown, Plus, Send, Sparkles, Code, Pen, Zap, ChartBarBig, Image as ImageIcon, FileText, MessageCircle, Download } from 'lucide-react-taro'
import { Network } from '@/network'

// 对话模式
const chatModes = [
  { id: 'fast' as const, label: '快速', description: '快速响应' },
  { id: 'standard' as const, label: '标准', description: '标准回答' },
  { id: 'thinking' as const, label: '深度', description: '深度思考' },
]

// 生图分辨率
const imageSizes = [
  { id: '1K' as const, label: '1K', description: '快速生成' },
  { id: '2K' as const, label: '2K', description: '高清画质' },
  { id: '4K' as const, label: '4K', description: '超高清' },
]

// 文档类型
const docTypes = [
  { id: 'report' as const, label: '报告', description: '专业分析报告' },
  { id: 'proposal' as const, label: '方案', description: '实施方案文档' },
  { id: 'summary' as const, label: '总结', description: '工作总结文档' },
  { id: 'free' as const, label: '自由', description: '自由格式文档' },
]

// 主模式
const mainModes = [
  { id: 'chat', label: '对话', icon: MessageCircle },
  { id: 'image', label: '生图', icon: ImageIcon },
  { id: 'document', label: '文档', icon: FileText },
]

const iconComponents: Record<string, any> = { Sparkles, Code, Pen, Zap, ChartBarBig }

export default function Chat() {
  const { theme } = useThemeStore()
  const { messages, isLoading, addMessage, setLoading } = useChatStore()
  const { currentModel, chatMode, setChatMode } = useModelStore()
  const { skills, fetchSkills } = useSkillsStore()
  
  // 基础状态
  const [inputText, setInputText] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  // 模式状态
  const [currentMainMode, setCurrentMainMode] = useState<'chat' | 'image' | 'document'>('chat')
  const [showChatModePanel, setShowChatModePanel] = useState(false)
  const [showSkillPanel, setShowSkillPanel] = useState(false)
  const [activeSkill, setActiveSkill] = useState<{ id: number; name: string; prompt: string } | null>(null)
  
  // 生图状态
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K')
  
  // 文档状态
  const [docType, setDocType] = useState<'report' | 'proposal' | 'summary' | 'free'>('free')
  const [docDetails, setDocDetails] = useState('')
  const [generatedDoc, setGeneratedDoc] = useState<{ markdown: string; title: string } | null>(null)
  
  // 深度思考
  const [isThinking, setIsThinking] = useState(false)
  const [lastThinking, setLastThinking] = useState('')
  
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
  const recorderManagerRef = useRef<Taro.RecorderManager | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        type: 'text',
        content: `你好！我是${currentModel.name}，有什么可以帮你的？`,
        from: 'ai'
      })
    }
    fetchSkills()
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
        recognition.onerror = () => {
          setIsRecording(false)
          Taro.showToast({ title: '语音识别失败', icon: 'none' })
        }
        recognition.onend = () => setIsRecording(false)
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

  // 发送对话消息
  const handleSendChat = async () => {
    if (!inputText.trim() || isLoading) return
    const userMessage = inputText.trim()
    
    setLastThinking('')
    
    const finalMessage = activeSkill 
      ? `${activeSkill.prompt}\n\n用户输入：${userMessage}` 
      : userMessage
    
    addMessage({ 
      type: 'text', 
      content: activeSkill ? `[${activeSkill.name}] ${userMessage}` : userMessage, 
      from: 'user' 
    })
    
    setInputText('')
    setShowTextInput(false)
    setLoading(true)
    
    if (chatMode === 'thinking' && currentModel.supportsThinking) {
      setIsThinking(true)
      setLastThinking('')
    }

    try {
      const response = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: {
          message: finalMessage,
          model: currentModel.id,
          mode: chatMode,
          context: messages.slice(-10)
        }
      })

      if (activeSkill) {
        await Network.request({ url: `/api/skills/${activeSkill.id}/use`, method: 'POST' })
      }

      if (response.data?.thinking) {
        setLastThinking(response.data.thinking)
      }

      const aiReply = response.data?.answer || '收到，正在为你处理...'
      addMessage({ type: 'text', content: aiReply, from: 'ai' })
    } catch (error) {
      console.error('AI request error:', error)
      addMessage({ type: 'text', content: '抱歉，出现了错误，请稍后重试。', from: 'ai' })
    } finally {
      setLoading(false)
      setIsThinking(false)
    }
  }

  // 生图
  const handleGenerateImage = async () => {
    if (!inputText.trim() || isLoading) return
    
    const prompt = inputText.trim()
    setInputText('')
    setLoading(true)
    
    // 添加用户消息
    addMessage({
      type: 'text',
      content: `🎨 生成图片：${prompt}（${imageSize}）`,
      from: 'user'
    })

    try {
      const response = await Network.request({
        url: '/api/image/generate',
        method: 'POST',
        data: { prompt, size: imageSize }
      })

      const imageUrl = response.data?.data?.url
      if (imageUrl) {
        addMessage({
          type: 'image',
          content: imageUrl,
          from: 'ai'
        })
      } else {
        throw new Error('No image URL returned')
      }
    } catch (error) {
      console.error('Image generation error:', error)
      addMessage({ type: 'text', content: '图片生成失败，请稍后重试。', from: 'ai' })
    } finally {
      setLoading(false)
    }
  }

  // 生成文档
  const handleGenerateDocument = async () => {
    if (!inputText.trim() || isLoading) return
    
    const topic = inputText.trim()
    setInputText('')
    setLoading(true)
    setGeneratedDoc(null)
    
    const docConfig = docTypes.find(d => d.id === docType)
    
    // 添加用户消息
    addMessage({
      type: 'text',
      content: `📄 生成${docConfig?.label || '文档'}：${topic}`,
      from: 'user'
    })

    try {
      const response = await Network.request({
        url: '/api/document/generate',
        method: 'POST',
        data: { topic, type: docType, details: docDetails }
      })

      const result = response.data?.data
      if (result) {
        setGeneratedDoc({ markdown: result.markdown, title: result.title })
        addMessage({
          type: 'text',
          content: result.markdown,
          from: 'ai'
        })
      }
    } catch (error) {
      console.error('Document generation error:', error)
      addMessage({ type: 'text', content: '文档生成失败，请稍后重试。', from: 'ai' })
    } finally {
      setLoading(false)
    }
  }

  // 下载文档
  const handleDownloadDocument = async () => {
    if (!generatedDoc) return
    
    const url = `/api/document/download?markdown=${encodeURIComponent(generatedDoc.markdown)}&title=${encodeURIComponent(generatedDoc.title)}`
    
    if (isWeapp) {
      try {
        const res = await Network.downloadFile({ url })
        await Taro.saveFile({
          tempFilePath: res.tempFilePath,
          success: () => Taro.showToast({ title: '保存成功', icon: 'success' }),
          fail: () => Taro.showToast({ title: '保存失败', icon: 'none' })
        })
      } catch {
        Taro.showToast({ title: '下载失败', icon: 'none' })
      }
    } else {
      window.open(url, '_blank')
    }
  }

  // 点击麦克风
  const handleMicClick = () => {
    if (isRecording) {
      if (isWeapp) {
        recorderManagerRef.current?.stop()
      } else {
        recognitionRef.current?.stop()
      }
      setIsRecording(false)
    } else {
      if (isWeapp) {
        recorderManagerRef.current?.start({ format: 'mp3', sampleRate: 16000, numberOfChannels: 1 })
        setIsRecording(true)
      } else {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start()
            setIsRecording(true)
          } catch {
            Taro.showToast({ title: '语音识别启动失败', icon: 'none' })
          }
        } else {
          Taro.showToast({ title: '浏览器不支持语音识别', icon: 'none' })
        }
      }
    }
  }

  // 上传文件并发送给AI分析
  const handleChooseFile = async () => {
    try {
      if (isWeapp) {
        const res = await Taro.chooseMessageFile({ count: 1, type: 'file' })
        const file = res.tempFiles[0]
        await processFile(file.path, file.name, file.type)
      } else {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*,.txt,.md,.json,.csv,.pdf,.doc,.docx'
        input.onchange = async (e: any) => {
          const file = e.target.files[0]
          if (file) {
            const formData = new FormData()
            formData.append('file', file)
            
            Taro.showLoading({ title: '上传中...' })
            try {
              const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              })
              const uploadData = await uploadRes.json()
              Taro.hideLoading()
              
              if (uploadData?.data) {
                const { key, url, mimetype } = uploadData.data
                await sendFileToAI(file.name, key, url, mimetype)
              }
            } catch {
              Taro.hideLoading()
              Taro.showToast({ title: '上传失败', icon: 'none' })
            }
          }
        }
        input.click()
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('Choose file error:', error)
    }
  }

  // 小程序端处理文件
  const processFile = async (filePath: string, fileName: string, _fileType: string) => {
    Taro.showLoading({ title: '上传中...' })
    try {
      const res = await Network.uploadFile({
        url: '/api/upload',
        filePath,
        name: 'file',
      })
      Taro.hideLoading()
      
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      if (data?.data) {
        const { key, url, mimetype } = data.data
        await sendFileToAI(fileName, key, url, mimetype)
      }
    } catch {
      Taro.hideLoading()
      Taro.showToast({ title: '上传失败', icon: 'none' })
    }
  }

  // 发送文件给AI分析
  const sendFileToAI = async (fileName: string, fileKey: string, fileUrl: string, mimetype: string) => {
    const isImage = mimetype.startsWith('image/')
    const isText = mimetype.startsWith('text/') || 
                   fileName.endsWith('.txt') || 
                   fileName.endsWith('.md') ||
                   fileName.endsWith('.json') ||
                   fileName.endsWith('.csv')
    
    const fileType = isImage ? 'image' : isText ? 'text' : 'other'
    
    addMessage({ 
      type: isImage ? 'image' : 'text', 
      content: isImage ? fileUrl : `📄 ${fileName}`, 
      from: 'user' 
    })
    
    setLoading(true)
    setLastThinking('')
    
    try {
      const response = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: {
          message: isImage ? '请分析这张图片，描述图片内容' : `请分析这个文件：${fileName}`,
          model: currentModel.id,
          mode: chatMode,
          context: messages.slice(-10),
          fileKey,
          fileUrl,
          fileType,
        }
      })

      if (response.data?.thinking) {
        setLastThinking(response.data.thinking)
      }

      const aiReply = response.data?.answer || '分析完成'
      addMessage({ type: 'text', content: aiReply, from: 'ai' })
    } catch (error) {
      console.error('AI file analysis error:', error)
      addMessage({ type: 'text', content: '文件分析失败，请稍后重试。', from: 'ai' })
    } finally {
      setLoading(false)
      setIsThinking(false)
    }
  }

  // 发送处理
  const handleSend = () => {
    if (currentMainMode === 'chat') {
      handleSendChat()
    } else if (currentMainMode === 'image') {
      handleGenerateImage()
    } else if (currentMainMode === 'document') {
      handleGenerateDocument()
    }
  }

  const currentMode = chatModes.find(m => m.id === chatMode) || chatModes[1]
  const iconColor = theme === 'dark' ? '#FFFFFF' : '#1F1F1F'
  const iconColorGray = theme === 'dark' ? '#666666' : '#8C8C8C'

  return (
    <View className={`min-h-screen bg-white dark:bg-black ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 顶部导航 */}
      <View className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <View className="flex items-center justify-end h-14 px-4">
          <View onClick={() => setShowSidebar(true)} className="p-2 cursor-pointer">
            <Menu size={22} color={iconColor} />
          </View>
        </View>
      </View>

      {/* 侧边栏 */}
      {showSidebar && <Sidebar onClose={() => setShowSidebar(false)} />}

      {/* 对话内容 */}
      <ScrollView className="pt-16 pb-48 px-4" scrollY scrollIntoView={messages.length > 0 ? `msg-${messages[messages.length - 1].id}` : ''}>
        {messages.map((msg, index) => {
          const isLastUserMessage = msg.from === 'user' && index === messages.length - 1
          const showThinkingAfterThis = isLastUserMessage && (isThinking || lastThinking)
          const isLastAIMessage = msg.from === 'ai' && index === messages.length - 1
          
          return (
            <View key={msg.id}>
              <View id={`msg-${msg.id}`}>
                <ChatBubble message={msg} autoPlay={isLastAIMessage && !isLoading} />
              </View>
              
              {showThinkingAfterThis && (
                <ThinkingMessage thinking={lastThinking} isThinking={isThinking} />
              )}
            </View>
          )
        })}
        
        {isLoading && !isThinking && (
          <View className="flex justify-start mb-4">
            <Text className="block text-gray-500 text-sm">正在处理...</Text>
          </View>
        )}
      </ScrollView>

      {/* 底部输入区域 */}
      <View className="fixed bottom-0 left-0 right-0 z-40">
        {/* 文档下载按钮 */}
        {currentMainMode === 'document' && generatedDoc && (
          <View className="px-4 mb-2">
            <View 
              onClick={handleDownloadDocument}
              className="flex flex-row items-center justify-center gap-2 py-2 rounded-xl bg-blue-500 cursor-pointer"
            >
              <Download size={16} color="#FFFFFF" />
              <Text className="text-white text-sm">下载Word文档</Text>
            </View>
          </View>
        )}
        
        {/* 主模式切换 */}
        <View className="flex flex-row items-center justify-center gap-2 px-4 mb-2">
          {mainModes.map((mode) => {
            const isActive = currentMainMode === mode.id
            const ModeIcon = mode.icon
            return (
              <View
                key={mode.id}
                onClick={() => {
                  setCurrentMainMode(mode.id as any)
                  setInputText('')
                  setShowTextInput(false)
                  setGeneratedDoc(null)
                  setDocDetails('')
                }}
                className={`flex flex-row items-center gap-1 px-3 py-2 rounded-full cursor-pointer ${isActive ? 'bg-blue-500' : 'bg-gray-100 dark:bg-gray-800'}`}
              >
                <ModeIcon size={14} color={isActive ? '#FFFFFF' : iconColorGray} />
                <Text className={`text-xs ${isActive ? 'text-white' : 'text-black dark:text-white'}`}>{mode.label}</Text>
              </View>
            )
          })}
        </View>
        
        {/* 输入区域 */}
        <View className={`bg-gray-100 dark:bg-gray-900 rounded-3xl mx-3 overflow-hidden ${isRecording ? 'bg-blue-500' : ''}`}>
          {/* 上排：输入区域 */}
          <View className="flex flex-row items-center gap-2 px-3 py-3">
            {/* 麦克风按钮 */}
            <View onClick={handleMicClick} className="p-1 cursor-pointer">
              <Mic size={22} color={isRecording ? '#FFFFFF' : iconColorGray} />
            </View>
            
            {/* 输入框/录音提示 */}
            {isRecording ? (
              <Text className="flex-1 text-white text-sm">正在聆听...</Text>
            ) : showTextInput ? (
              <Input
                value={inputText}
                onInput={(e) => setInputText(e.detail.value)}
                onConfirm={handleSend}
                placeholder={currentMainMode === 'image' ? '描述你想生成的图片...' : currentMainMode === 'document' ? '输入文档主题...' : '输入消息...'}
                placeholderClass="text-gray-400"
                className="flex-1 bg-transparent text-sm text-black dark:text-white"
                confirmType="send"
                autoFocus
                onBlur={() => { if (!inputText.trim()) setShowTextInput(false) }}
              />
            ) : (
              <View className="flex-1" onClick={() => setShowTextInput(true)}>
                <Text className="text-black dark:text-white text-sm">
                  {currentMainMode === 'image' ? '描述你想生成的图片...' : currentMainMode === 'document' ? '输入文档主题...' : '输入消息...'}
                </Text>
              </View>
            )}
            
            {/* 发送按钮 */}
            {showTextInput && inputText.trim() && (
              <View onClick={handleSend} className="p-1 cursor-pointer">
                <Send size={22} color="#1890FF" />
              </View>
            )}
          </View>
          
          {/* 分隔线 */}
          <View className="h-px bg-gray-200 dark:bg-gray-800 mx-4" />
          
          {/* 下排：功能按钮 */}
          <View className="flex flex-row items-center justify-between px-3 py-2">
            {/* 左侧：模式选项 */}
            <View className="flex flex-row items-center gap-3">
              {/* 对话模式：模式选择 + 技能调用 */}
              {currentMainMode === 'chat' && (
                <>
                  <View onClick={() => setShowChatModePanel(true)} className="flex flex-row items-center gap-1 cursor-pointer">
                    <Text className="block text-xs text-black dark:text-white">{currentMode.label}</Text>
                    <ChevronDown size={12} color={iconColorGray} />
                  </View>
                  
                  <View 
                    onClick={() => setShowSkillPanel(true)} 
                    className={`flex flex-row items-center gap-1 px-2 py-1 rounded-full cursor-pointer ${activeSkill ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <Sparkles size={12} color={activeSkill ? '#fff' : iconColorGray} />
                    <Text className={`block text-xs ${activeSkill ? 'text-white' : 'text-black dark:text-white'}`}>
                      {activeSkill ? activeSkill.name : '技能'}
                    </Text>
                    <ChevronDown size={10} color={activeSkill ? '#fff' : iconColorGray} />
                  </View>
                </>
              )}
              
              {/* 生图模式：分辨率选择 */}
              {currentMainMode === 'image' && (
                <View className="flex flex-row items-center gap-2">
                  {imageSizes.map((size) => (
                    <View
                      key={size.id}
                      onClick={() => setImageSize(size.id)}
                      className={`px-2 py-1 rounded-full cursor-pointer ${imageSize === size.id ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                      <Text className={`block text-xs ${imageSize === size.id ? 'text-white' : 'text-black dark:text-white'}`}>{size.label}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* 文档模式：类型选择 */}
              {currentMainMode === 'document' && (
                <View className="flex flex-row items-center gap-2">
                  {docTypes.map((type) => (
                    <View
                      key={type.id}
                      onClick={() => setDocType(type.id)}
                      className={`px-2 py-1 rounded-full cursor-pointer ${docType === type.id ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                      <Text className={`block text-xs ${docType === type.id ? 'text-white' : 'text-black dark:text-white'}`}>{type.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            
            {/* 右侧：功能按钮 */}
            {currentMainMode === 'chat' && (
              <View className="flex flex-row items-center gap-2">
                <View onClick={handleChooseFile} className="p-1 cursor-pointer">
                  <Plus size={16} color={iconColorGray} />
                </View>
              </View>
            )}
          </View>
        </View>
        
        {/* 底部安全区域 */}
        <View className="h-4" />
      </View>

      {/* 对话模式选择面板 */}
      {showChatModePanel && (
        <>
          <View className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }} onClick={() => setShowChatModePanel(false)} />
          <View className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-50 p-4">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="block text-lg font-medium text-black dark:text-white">选择模式</Text>
              <Text className="block text-gray-500 text-sm cursor-pointer" onClick={() => setShowChatModePanel(false)}>关闭</Text>
            </View>
            {chatModes.map((mode) => {
              const isActive = chatMode === mode.id
              const isDisabled = mode.id === 'thinking' && !currentModel.supportsThinking
              return (
                <View
                  key={mode.id}
                  className={`flex flex-row items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer ${isActive ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : 'bg-gray-50 dark:bg-gray-800'} ${isDisabled ? 'opacity-40' : ''}`}
                  onClick={() => { if (!isDisabled) { setChatMode(mode.id); setShowChatModePanel(false) } }}
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

      {/* 技能选择面板 */}
      {showSkillPanel && (
        <>
          <View className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }} onClick={() => setShowSkillPanel(false)} />
          <View className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-50 p-4 max-h-[60vh]">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="block text-lg font-medium text-black dark:text-white">选择技能</Text>
              <View className="flex flex-row items-center gap-2">
                <View 
                  onClick={() => { setShowSkillPanel(false); Taro.navigateTo({ url: '/pages/skills/index' }) }}
                  className="px-2 py-1 rounded bg-blue-500 cursor-pointer"
                >
                  <Text className="text-xs text-white">管理技能</Text>
                </View>
                <Text className="block text-gray-500 text-sm cursor-pointer" onClick={() => setShowSkillPanel(false)}>关闭</Text>
              </View>
            </View>
            
            {skills.length === 0 ? (
              <View className="flex flex-col items-center py-8">
                <Sparkles size={40} color={iconColorGray} />
                <Text className="block text-gray-500 mt-3">暂无技能</Text>
                <View 
                  onClick={() => { setShowSkillPanel(false); Taro.navigateTo({ url: '/pages/skills/index' }) }}
                  className="mt-3 px-4 py-2 rounded-lg bg-blue-500 cursor-pointer"
                >
                  <Text className="text-sm text-white">创建技能</Text>
                </View>
              </View>
            ) : (
              <ScrollView scrollY style={{ maxHeight: '40vh' }}>
                {activeSkill && (
                  <View
                    className="flex flex-row items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer bg-red-50 dark:bg-red-900 dark:bg-opacity-20"
                    onClick={() => { setActiveSkill(null); setShowSkillPanel(false) }}
                  >
                    <Text className="block text-sm text-red-500">取消技能调用</Text>
                  </View>
                )}
                
                {skills.map((skill) => {
                  const IconComponent = iconComponents[skill.icon] || Sparkles
                  const isActive = activeSkill?.id === skill.id
                  return (
                    <View
                      key={skill.id}
                      className={`flex flex-row items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer ${isActive ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : 'bg-gray-50 dark:bg-gray-800'}`}
                      onClick={() => { 
                        setActiveSkill({ id: skill.id, name: skill.name, prompt: skill.prompt })
                        setShowSkillPanel(false)
                        setShowTextInput(true)
                      }}
                    >
                      <View className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 flex items-center justify-center">
                        <IconComponent size={16} color="#1890FF" />
                      </View>
                      <View className="flex-1">
                        <Text className={`block text-sm font-medium ${isActive ? 'text-blue-500' : 'text-black dark:text-white'}`}>{skill.name}</Text>
                        <Text className="block text-xs text-gray-500">{skill.description || '暂无描述'}</Text>
                      </View>
                      {isActive && <View className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><Text className="block text-white text-xs">✓</Text></View>}
                    </View>
                  )
                })}
              </ScrollView>
            )}
          </View>
        </>
      )}
    </View>
  )
}
