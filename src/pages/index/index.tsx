import { View, Text, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect, useRef, useCallback } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { ChatBubble } from '@/components/ChatBubble'
import { ThinkingMessage } from '@/components/ThinkingMessage'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStore } from '@/store/theme'
import { useChatStore } from '@/store/chat'
import { useModelStore } from '@/store/models'
import { useSkillsStore } from '@/store/skills'
import { useProjectStore } from '@/store/projects'
import { Menu, Mic, ChevronDown, Plus, Send, Sparkles, Code, Pen, Zap, ChartBarBig, Image as ImageIcon, FileText, Download, X, FolderOpen } from 'lucide-react-taro'
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

const iconComponents: Record<string, any> = { Sparkles, Code, Pen, Zap, ChartBarBig }

// 动画样式
const slideUpAnimation = `
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
`

export default function Chat() {
  const { theme } = useThemeStore()
  const { messages, isLoading, addMessage, setLoading, setMessages, clearMessages } = useChatStore()
  const { currentModel, chatMode, setChatMode } = useModelStore()
  const { skills, fetchSkills } = useSkillsStore()
  const { currentProject, setCurrentProject, fetchProjects, projects } = useProjectStore()
  const router = useRouter()
  
  // 基础状态
  const [inputText, setInputText] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  // 会话状态
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const isInitializedRef = useRef(false)
  
  // 面板状态
  const [showChatModePanel, setShowChatModePanel] = useState(false)
  const [showSkillPanel, setShowSkillPanel] = useState(false)
  const [showImagePanel, setShowImagePanel] = useState(false)
  const [showDocPanel, setShowDocPanel] = useState(false)
  const [showProjectPanel, setShowProjectPanel] = useState(false)
  const [activeSkill, setActiveSkill] = useState<{ id: number; name: string; prompt: string } | null>(null)
  
  // 当前功能模式
  const [currentTool, setCurrentTool] = useState<'chat' | 'image' | 'document'>('chat')
  
  // 生图状态
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K')
  
  // 文档状态
  const [docType, setDocType] = useState<'report' | 'proposal' | 'summary' | 'free'>('free')
  const [generatedDoc, setGeneratedDoc] = useState<{ markdown: string; title: string } | null>(null)
  
  // 深度思考
  const [isThinking, setIsThinking] = useState(false)
  const [lastThinking, setLastThinking] = useState('')
  
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
  const recorderManagerRef = useRef<Taro.RecorderManager | null>(null)

  // 初始化或恢复会话
  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true
    
    fetchSkills()
    fetchProjects()
    
    // 检查是否有传入的项目ID
    const projectId = router.params.projectId
    if (projectId) {
      // 加载项目
      loadProject(Number(projectId))
    }
    
    // 检查是否有传入的会话ID
    const sessionId = router.params.sessionId
    if (sessionId) {
      loadSession(Number(sessionId))
    } else {
      // 创建新会话
      createNewSession(projectId ? Number(projectId) : undefined)
    }
  }, [router.params])

  // 保存会话（消息变化时自动保存）
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      saveSession()
    }
  }, [messages, currentSessionId])

  // 加载项目
  const loadProject = async (projectId: number) => {
    try {
      const res = await Network.request({ url: `/api/projects/${projectId}` })
      const project = res.data?.data
      if (project) {
        setCurrentProject({
          ...project,
          settings: project.settings ? JSON.parse(project.settings) : {},
          outline: project.outline ? JSON.parse(project.outline) : {},
          writingStyle: project.writingStyle ? JSON.parse(project.writingStyle) : {},
        })
      }
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }

  // 创建新会话
  const createNewSession = async (projectId?: number) => {
    try {
      const res = await Network.request({
        url: '/api/sessions',
        method: 'POST',
        data: { 
          model: currentModel.id, 
          mode: chatMode,
          projectId: projectId || currentProject?.id || null
        }
      })
      if (res.data?.data?.id) {
        setCurrentSessionId(res.data.data.id)
        clearMessages()
        // 添加欢迎消息
        const projectName = currentProject?.name || (projectId ? '' : null)
        const greeting = projectName 
          ? `你好！我是${currentModel.name}，正在协助你完成「${projectName}」项目。有什么需要帮助的吗？`
          : `你好！我是${currentModel.name}，有什么可以帮你的？`
        addMessage({
          type: 'text',
          content: greeting,
          from: 'ai'
        })
      }
    } catch (error) {
      console.error('Failed to create session:', error)
      // 创建失败时也显示欢迎消息
      if (messages.length === 0) {
        addMessage({
          type: 'text',
          content: `你好！我是${currentModel.name}，有什么可以帮你的？`,
          from: 'ai'
        })
      }
    }
  }

  // 加载会话
  const loadSession = async (sessionId: number) => {
    try {
      const res = await Network.request({ url: `/api/sessions/${sessionId}` })
      const session = res.data?.data
      if (session && session.messages) {
        setCurrentSessionId(sessionId)
        setMessages(session.messages)
      } else {
        createNewSession()
      }
    } catch (error) {
      console.error('Failed to load session:', error)
      createNewSession()
    }
  }

  // 保存会话
  const saveSession = useCallback(async () => {
    if (!currentSessionId) return
    
    try {
      await Network.request({
        url: `/api/sessions/${currentSessionId}`,
        method: 'PUT',
        data: {
          messages: messages.map(m => ({
            ...m,
            timestamp: m.timestamp || Date.now()
          })),
          model: currentModel.id,
          mode: chatMode
        }
      })
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }, [currentSessionId, messages, currentModel.id, chatMode])

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

  // H5端 MediaRecorder 录音
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

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
          projectId: currentProject?.id,
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
    
    addMessage({
      type: 'text',
      content: `📄 生成${docConfig?.label || '文档'}：${topic}`,
      from: 'user'
    })

    try {
      const response = await Network.request({
        url: '/api/document/generate',
        method: 'POST',
        data: { topic, type: docType, details: '' }
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
  const handleMicClick = async () => {
    if (isRecording) {
      // 停止录音
      if (isWeapp) {
        recorderManagerRef.current?.stop()
      } else {
        mediaRecorderRef.current?.stop()
      }
      setIsRecording(false)
      return
    }

    if (isWeapp) {
      // 小程序端
      recorderManagerRef.current?.start({ format: 'mp3', sampleRate: 16000, numberOfChannels: 1 })
      setIsRecording(true)
    } else {
      // H5端 - 使用 MediaRecorder 录音
      try {
        // 请求麦克风权限
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
          } 
        })
        
        // 创建 MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
        })
        
        audioChunksRef.current = []
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data)
          }
        }
        
        mediaRecorder.onstop = async () => {
          // 停止所有音轨
          stream.getTracks().forEach(track => track.stop())
          
          // 合并音频数据
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          
          // 上传并识别
          await uploadH5Audio(audioBlob)
        }
        
        mediaRecorder.onerror = (e) => {
          console.error('MediaRecorder error:', e)
          stream.getTracks().forEach(track => track.stop())
          setIsRecording(false)
          Taro.showToast({ title: '录音出错', icon: 'none' })
        }
        
        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.start()
        setIsRecording(true)
        
      } catch (error: any) {
        console.error('Mic error:', error)
        setIsRecording(false)
        
        if (error.name === 'NotAllowedError') {
          Taro.showToast({ title: '请允许麦克风权限', icon: 'none', duration: 2000 })
        } else if (error.name === 'NotFoundError') {
          Taro.showToast({ title: '未检测到麦克风', icon: 'none', duration: 2000 })
        } else {
          Taro.showToast({ title: '录音启动失败', icon: 'none', duration: 2000 })
        }
      }
    }
  }

  // H5端上传音频并识别
  const uploadH5Audio = async (audioBlob: Blob) => {
    try {
      Taro.showLoading({ title: '识别中...' })
      
      // 先上传音频文件
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()
      
      if (!uploadData?.data?.url) {
        throw new Error('上传失败')
      }
      
      const audioUrl = uploadData.data.url
      
      // 调用 ASR 接口识别
      const asrRes = await Network.request({
        url: '/api/ai/asr',
        method: 'POST',
        data: { audioUrl }
      })
      
      Taro.hideLoading()
      
      const text = asrRes.data?.text
      if (text) {
        setInputText(text)
        setShowTextInput(true)
      } else {
        Taro.showToast({ title: '未识别到语音', icon: 'none' })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('Audio recognition error:', error)
      Taro.showToast({ title: '识别失败', icon: 'none' })
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
    if (currentTool === 'image') {
      handleGenerateImage()
    } else if (currentTool === 'document') {
      handleGenerateDocument()
    } else {
      handleSendChat()
    }
  }

  // 获取输入框占位符
  const getPlaceholder = () => {
    if (currentTool === 'image') return '描述你想生成的图片...'
    if (currentTool === 'document') return '输入文档主题...'
    if (activeSkill) return `${activeSkill.name}...`
    return '输入消息...'
  }

  // 新建对话
  const handleNewChat = () => {
    setShowSidebar(false)
    setCurrentProject(null)
    createNewSession()
  }

  // 打开历史
  const handleOpenHistory = () => {
    setShowSidebar(false)
    Taro.navigateTo({ url: '/pages/history/index' })
  }

  // 选择项目
  const handleSelectProject = (project: any) => {
    setCurrentProject(project)
    setShowProjectPanel(false)
    createNewSession(project.id)
  }

  // 清除项目
  const handleClearProject = () => {
    setCurrentProject(null)
    setShowProjectPanel(false)
    createNewSession()
  }

  const currentMode = chatModes.find(m => m.id === chatMode) || chatModes[1]
  const currentImageSize = imageSizes.find(s => s.id === imageSize) || imageSizes[0]
  const currentDocType = docTypes.find(d => d.id === docType) || docTypes[3]
  const iconColor = theme === 'dark' ? '#FFFFFF' : '#1F1F1F'
  const iconColorGray = theme === 'dark' ? '#666666' : '#8C8C8C'

  return (
    <View className={`min-h-screen bg-white dark:bg-black ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 动画样式 */}
      <View style={{ display: 'none' }}>
        <Text>{slideUpAnimation}</Text>
      </View>
      
      {/* 顶部导航 */}
      <View className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <View className="flex items-center justify-between h-14 px-4">
          <View onClick={() => setShowSidebar(true)} className="p-2 cursor-pointer active:opacity-60">
            <Menu size={22} color={iconColor} />
          </View>
          
          {/* 当前项目显示 */}
          {currentProject && (
            <View 
              onClick={() => setShowProjectPanel(true)}
              className="flex flex-row items-center gap-1 px-3 py-2 rounded-full bg-blue-100 dark:bg-blue-900 cursor-pointer active:opacity-60"
            >
              <FolderOpen size={14} color="#3B82F6" />
              <Text className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {currentProject.name}
              </Text>
              <ChevronDown size={12} color="#3B82F6" />
            </View>
          )}
          
          {/* 项目选择按钮（无项目时显示） */}
          {!currentProject && (
            <View 
              onClick={() => setShowProjectPanel(true)}
              className="flex flex-row items-center gap-1 px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-900 cursor-pointer active:opacity-60"
            >
              <FolderOpen size={14} color={iconColorGray} />
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                选择项目
              </Text>
            </View>
          )}
          
          <View className="w-8" />
        </View>
      </View>

      {/* 侧边栏 */}
      {showSidebar && (
        <Sidebar 
          onClose={() => setShowSidebar(false)} 
          onNewChat={handleNewChat}
          onOpenHistory={handleOpenHistory}
        />
      )}

      {/* 对话内容 */}
      <ScrollView className="pt-16 pb-44 px-4" scrollY scrollIntoView={messages.length > 0 ? `msg-${messages[messages.length - 1].id}` : ''}>
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
        {currentTool === 'document' && generatedDoc && (
          <View 
            className="px-4 mb-2"
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            <View 
              onClick={handleDownloadDocument}
              className="flex flex-row items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 cursor-pointer active:opacity-80"
              style={{ animation: 'pulse 2s infinite' }}
            >
              <Download size={18} color="#FFFFFF" />
              <Text className="text-white text-sm font-medium">下载Word文档</Text>
            </View>
          </View>
        )}
        
        {/* 输入区域 */}
        <View 
          className={`bg-gray-100 dark:bg-gray-900 rounded-3xl mx-3 overflow-hidden transition-all duration-300 ${isRecording ? 'bg-blue-500' : ''}`}
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          {/* 上排：输入区域 */}
          <View className="flex flex-row items-center gap-2 px-3 py-3">
            {/* 麦克风按钮 */}
            <View 
              onClick={handleMicClick} 
              className={`p-1 cursor-pointer active:opacity-60 transition-transform duration-200 ${isRecording ? 'animate-bounce' : ''}`}
              style={isRecording ? { animation: 'bounce 0.6s infinite' } : {}}
            >
              <Mic size={22} color={isRecording ? '#FFFFFF' : iconColorGray} />
            </View>
            
            {/* 输入框/录音提示 */}
            {isRecording ? (
              <View className="flex-1 flex flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <Text className="text-white text-sm">正在聆听...</Text>
              </View>
            ) : showTextInput ? (
              <Input
                value={inputText}
                onInput={(e) => setInputText(e.detail.value)}
                onConfirm={handleSend}
                placeholder={getPlaceholder()}
                placeholderClass="text-gray-400"
                className="flex-1 bg-transparent text-sm text-black dark:text-white"
                confirmType="send"
                autoFocus
                onBlur={() => { if (!inputText.trim()) setShowTextInput(false) }}
              />
            ) : (
              <View className="flex-1 cursor-pointer" onClick={() => setShowTextInput(true)}>
                <Text className="text-black dark:text-white text-sm">{getPlaceholder()}</Text>
              </View>
            )}
            
            {/* 发送按钮 */}
            {showTextInput && inputText.trim() && (
              <View 
                onClick={handleSend} 
                className="p-1 cursor-pointer active:opacity-60 transition-transform duration-150"
                style={{ animation: 'fadeIn 0.2s ease-out' }}
              >
                <Send size={22} color="#1890FF" />
              </View>
            )}
          </View>
          
          {/* 分隔线 */}
          <View className="h-px bg-gray-200 dark:bg-gray-800 mx-4" />
          
          {/* 下排：功能按钮 */}
          <View className="flex flex-row items-center justify-between px-3 py-2">
            {/* 左侧：模式选择 */}
            <View 
              onClick={() => setShowChatModePanel(true)} 
              className="flex flex-row items-center gap-1 cursor-pointer active:opacity-60 flex-shrink-0"
            >
              <Text className="block text-xs text-black dark:text-white">{currentMode.label}</Text>
              <ChevronDown size={12} color={iconColorGray} />
            </View>
            
            {/* 右侧：工具按钮 - 横向滚动 */}
            <ScrollView scrollX className="flex-1 ml-3 whitespace-nowrap" style={{ width: 'auto' }}>
              <View className="flex flex-row items-center gap-2 inline-flex">
                {/* 技能 */}
                <View 
                  onClick={() => setShowSkillPanel(true)} 
                  className={`flex flex-row items-center gap-1 px-2 py-1 rounded-full cursor-pointer active:opacity-60 transition-all duration-200 flex-shrink-0 ${activeSkill ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  <Sparkles size={12} color={activeSkill ? '#fff' : iconColorGray} />
                  <Text className={`block text-xs ${activeSkill ? 'text-white' : 'text-black dark:text-white'}`}>
                    {activeSkill ? activeSkill.name : '技能'}
                  </Text>
                  {activeSkill && (
                    <View 
                      onClick={(e) => { e.stopPropagation(); setActiveSkill(null); setCurrentTool('chat') }}
                      className="ml-1"
                    >
                      <X size={12} color="#fff" />
                    </View>
                  )}
                  {!activeSkill && <ChevronDown size={10} color={iconColorGray} />}
                </View>
                
                {/* 生图 */}
                <View 
                  onClick={() => setShowImagePanel(true)} 
                  className={`flex flex-row items-center gap-1 px-2 py-1 rounded-full cursor-pointer active:opacity-60 transition-all duration-200 flex-shrink-0 ${currentTool === 'image' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  <ImageIcon size={12} color={currentTool === 'image' ? '#fff' : iconColorGray} />
                  <Text className={`block text-xs ${currentTool === 'image' ? 'text-white' : 'text-black dark:text-white'}`}>
                    {currentTool === 'image' ? currentImageSize.label : '生图'}
                  </Text>
                  {currentTool === 'image' && (
                    <View 
                      onClick={(e) => { e.stopPropagation(); setCurrentTool('chat') }}
                      className="ml-1"
                    >
                      <X size={12} color="#fff" />
                    </View>
                  )}
                  {currentTool !== 'image' && <ChevronDown size={10} color={iconColorGray} />}
                </View>
                
                {/* 文档 */}
                <View 
                  onClick={() => setShowDocPanel(true)} 
                  className={`flex flex-row items-center gap-1 px-2 py-1 rounded-full cursor-pointer active:opacity-60 transition-all duration-200 flex-shrink-0 ${currentTool === 'document' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  <FileText size={12} color={currentTool === 'document' ? '#fff' : iconColorGray} />
                  <Text className={`block text-xs ${currentTool === 'document' ? 'text-white' : 'text-black dark:text-white'}`}>
                    {currentTool === 'document' ? currentDocType.label : '文档'}
                  </Text>
                  {currentTool === 'document' && (
                    <View 
                      onClick={(e) => { e.stopPropagation(); setCurrentTool('chat') }}
                      className="ml-1"
                    >
                      <X size={12} color="#fff" />
                    </View>
                  )}
                  {currentTool !== 'document' && <ChevronDown size={10} color={iconColorGray} />}
                </View>
                
                {/* 上传文件（仅对话模式） */}
                {currentTool === 'chat' && (
                  <View onClick={handleChooseFile} className="p-1 cursor-pointer active:opacity-60 flex-shrink-0">
                    <Plus size={16} color={iconColorGray} />
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
        
        {/* 底部安全区域 */}
        <View className="h-4" />
      </View>

      {/* 通用面板组件 */}
      {(showChatModePanel || showSkillPanel || showImagePanel || showDocPanel || showProjectPanel) && (
        <View 
          className="fixed inset-0 z-40" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', animation: 'fadeIn 0.2s ease-out' }}
          onClick={() => {
            setShowChatModePanel(false)
            setShowSkillPanel(false)
            setShowImagePanel(false)
            setShowDocPanel(false)
            setShowProjectPanel(false)
          }}
        />
      )}

      {/* 对话模式选择面板 */}
      {showChatModePanel && (
        <View 
          className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-50 p-4"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          <View className="flex flex-row items-center justify-between mb-4">
            <Text className="block text-lg font-medium text-black dark:text-white">选择模式</Text>
            <View onClick={() => setShowChatModePanel(false)} className="p-1 cursor-pointer active:opacity-60">
              <X size={20} color={iconColorGray} />
            </View>
          </View>
          {chatModes.map((mode, index) => {
            const isActive = chatMode === mode.id
            const isDisabled = mode.id === 'thinking' && !currentModel.supportsThinking
            return (
              <View
                key={mode.id}
                className={`flex flex-row items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer active:opacity-60 ${isActive ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : ''} ${isDisabled ? 'opacity-40' : ''}`}
                style={{ animation: `slideUp 0.3s ease-out ${index * 0.05}s both` }}
                onClick={() => { if (!isDisabled) { setChatMode(mode.id); setShowChatModePanel(false) } }}
              >
                <View className="flex-1">
                  <Text className={`block text-sm font-medium ${isActive ? 'text-blue-500' : 'text-black dark:text-white'}`}>{mode.label}</Text>
                  <Text className="block text-xs text-gray-500">{mode.description}</Text>
                </View>
                {isActive && (
                  <View 
                    className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
                    style={{ animation: 'fadeIn 0.2s ease-out' }}
                  >
                    <Text className="block text-white text-xs">✓</Text>
                  </View>
                )}
              </View>
            )
          })}
        </View>
      )}

      {/* 生图分辨率选择面板 */}
      {showImagePanel && (
        <View 
          className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-50 p-4"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          <View className="flex flex-row items-center justify-between mb-4">
            <Text className="block text-lg font-medium text-black dark:text-white">选择分辨率</Text>
            <View onClick={() => setShowImagePanel(false)} className="p-1 cursor-pointer active:opacity-60">
              <X size={20} color={iconColorGray} />
            </View>
          </View>
          {imageSizes.map((size, index) => {
            const isActive = imageSize === size.id
            return (
              <View
                key={size.id}
                className={`flex flex-row items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer active:opacity-60 ${isActive ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : ''}`}
                style={{ animation: `slideUp 0.3s ease-out ${index * 0.05}s both` }}
                onClick={() => { 
                  setImageSize(size.id)
                  setCurrentTool('image')
                  setShowImagePanel(false)
                  setShowTextInput(true)
                }}
              >
                <View className="flex-1">
                  <Text className={`block text-sm font-medium ${isActive ? 'text-blue-500' : 'text-black dark:text-white'}`}>{size.label}</Text>
                  <Text className="block text-xs text-gray-500">{size.description}</Text>
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
      )}

      {/* 文档类型选择面板 */}
      {showDocPanel && (
        <View 
          className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-50 p-4"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          <View className="flex flex-row items-center justify-between mb-4">
            <Text className="block text-lg font-medium text-black dark:text-white">选择文档类型</Text>
            <View onClick={() => setShowDocPanel(false)} className="p-1 cursor-pointer active:opacity-60">
              <X size={20} color={iconColorGray} />
            </View>
          </View>
          {docTypes.map((type, index) => {
            const isActive = docType === type.id
            return (
              <View
                key={type.id}
                className={`flex flex-row items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer active:opacity-60 ${isActive ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : ''}`}
                style={{ animation: `slideUp 0.3s ease-out ${index * 0.05}s both` }}
                onClick={() => { 
                  setDocType(type.id)
                  setCurrentTool('document')
                  setShowDocPanel(false)
                  setShowTextInput(true)
                }}
              >
                <View className="flex-1">
                  <Text className={`block text-sm font-medium ${isActive ? 'text-blue-500' : 'text-black dark:text-white'}`}>{type.label}</Text>
                  <Text className="block text-xs text-gray-500">{type.description}</Text>
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
      )}

      {/* 技能选择面板 */}
      {showSkillPanel && (
        <View 
          className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-50 p-4 max-h-[60vh]"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          <View className="flex flex-row items-center justify-between mb-4">
            <Text className="block text-lg font-medium text-black dark:text-white">选择技能</Text>
            <View className="flex flex-row items-center gap-2">
              <View 
                onClick={() => { setShowSkillPanel(false); Taro.navigateTo({ url: '/pages/skills/index' }) }}
                className="px-3 py-1 rounded-lg bg-blue-500 cursor-pointer active:opacity-60"
              >
                <Text className="text-xs text-white">管理</Text>
              </View>
              <View onClick={() => setShowSkillPanel(false)} className="p-1 cursor-pointer active:opacity-60">
                <X size={20} color={iconColorGray} />
              </View>
            </View>
          </View>
          
          {skills.length === 0 ? (
            <View className="flex flex-col items-center py-8">
              <Sparkles size={40} color={iconColorGray} />
              <Text className="block text-gray-500 mt-3">暂无技能</Text>
              <View 
                onClick={() => { setShowSkillPanel(false); Taro.navigateTo({ url: '/pages/skills/index' }) }}
                className="mt-3 px-4 py-2 rounded-lg bg-blue-500 cursor-pointer active:opacity-60"
              >
                <Text className="text-sm text-white">创建技能</Text>
              </View>
            </View>
          ) : (
            <ScrollView scrollY style={{ maxHeight: '40vh' }}>
              {activeSkill && (
                <View
                  className="flex flex-row items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer active:opacity-60 bg-red-50 dark:bg-red-900 dark:bg-opacity-20"
                  onClick={() => { 
                    setActiveSkill(null)
                    setCurrentTool('chat')
                    setShowSkillPanel(false)
                  }}
                >
                  <Text className="block text-sm text-red-500">取消技能调用</Text>
                </View>
              )}
              
              {skills.map((skill, index) => {
                const IconComponent = iconComponents[skill.icon] || Sparkles
                const isActive = activeSkill?.id === skill.id
                return (
                  <View
                    key={skill.id}
                    className={`flex flex-row items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer active:opacity-60 ${isActive ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : ''}`}
                    style={{ animation: `slideUp 0.3s ease-out ${index * 0.03}s both` }}
                    onClick={() => { 
                      setActiveSkill({ id: skill.id, name: skill.name, prompt: skill.prompt })
                      setCurrentTool('chat')
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
                    {isActive && (
                      <View className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Text className="block text-white text-xs">✓</Text>
                      </View>
                    )}
                  </View>
                )
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* 项目选择面板 */}
      {showProjectPanel && (
        <View 
          className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-50 p-4 max-h-[70vh]"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          <View className="flex flex-row items-center justify-between mb-4">
            <Text className="block text-lg font-medium text-black dark:text-white">选择项目</Text>
            <View className="flex flex-row items-center gap-2">
              <View 
                onClick={() => { setShowProjectPanel(false); Taro.navigateTo({ url: '/pages/projects/create' }) }}
                className="px-3 py-1 rounded-lg bg-blue-500 cursor-pointer active:opacity-60"
              >
                <Text className="text-xs text-white">新建</Text>
              </View>
              <View onClick={() => setShowProjectPanel(false)} className="p-1 cursor-pointer active:opacity-60">
                <X size={20} color={iconColorGray} />
              </View>
            </View>
          </View>
          
          {/* 无项目选项 */}
          <View
            className={`flex flex-row items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer active:opacity-60 ${!currentProject ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : ''}`}
            onClick={() => handleClearProject()}
          >
            <View className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <X size={16} color={iconColorGray} />
            </View>
            <View className="flex-1">
              <Text className="block text-sm font-medium text-black dark:text-white">普通对话</Text>
              <Text className="block text-xs text-gray-500">不关联任何项目</Text>
            </View>
            {!currentProject && (
              <View className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <Text className="block text-white text-xs">✓</Text>
              </View>
            )}
          </View>
          
          {projects.length === 0 ? (
            <View className="flex flex-col items-center py-8">
              <FolderOpen size={40} color={iconColorGray} />
              <Text className="block text-gray-500 mt-3">暂无项目</Text>
              <View 
                onClick={() => { setShowProjectPanel(false); Taro.navigateTo({ url: '/pages/projects/create' }) }}
                className="mt-3 px-4 py-2 rounded-lg bg-blue-500 cursor-pointer active:opacity-60"
              >
                <Text className="text-sm text-white">创建项目</Text>
              </View>
            </View>
          ) : (
            <ScrollView scrollY style={{ maxHeight: '50vh' }}>
              {projects.map((project, index) => {
                const isActive = currentProject?.id === project.id
                return (
                  <View
                    key={project.id}
                    className={`flex flex-row items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer active:opacity-60 ${isActive ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : ''}`}
                    style={{ animation: `slideUp 0.3s ease-out ${index * 0.03}s both` }}
                    onClick={() => handleSelectProject(project)}
                  >
                    <View className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 flex items-center justify-center">
                      <FolderOpen size={16} color="#1890FF" />
                    </View>
                    <View className="flex-1">
                      <Text className={`block text-sm font-medium ${isActive ? 'text-blue-500' : 'text-black dark:text-white'}`}>{project.name}</Text>
                      <Text className="block text-xs text-gray-500">{project.description || '暂无描述'}</Text>
                    </View>
                    {isActive && (
                      <View className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Text className="block text-white text-xs">✓</Text>
                      </View>
                    )}
                  </View>
                )
              })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  )
}
