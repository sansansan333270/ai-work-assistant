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
import { Menu, Volume2, VolumeX, Mic, ChevronDown, Plus, Send, Sparkles, Code, Pen, Zap, ChartBarBig } from 'lucide-react-taro'
import { Network } from '@/network'

const modes = [
  { id: 'fast' as const, label: '快速', description: '快速响应' },
  { id: 'standard' as const, label: '标准', description: '标准回答' },
  { id: 'thinking' as const, label: '深度', description: '深度思考' },
]

const iconComponents: Record<string, any> = { Sparkles, Code, Pen, Zap, ChartBarBig }

export default function Chat() {
  const { theme } = useThemeStore()
  const { messages, isLoading, addMessage, setLoading } = useChatStore()
  const { currentModel, chatMode, setChatMode } = useModelStore()
  const { skills, fetchSkills } = useSkillsStore()
  const [inputText, setInputText] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [showModePanel, setShowModePanel] = useState(false)
  const [showSkillPanel, setShowSkillPanel] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [activeSkill, setActiveSkill] = useState<{ id: number; name: string; prompt: string } | null>(null)
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

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return
    const userMessage = inputText.trim()
    
    // 清空上一次的思考内容
    setLastThinking('')
    
    // 如果有激活的技能，组合提示词
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
    
    // 深度模式下显示思考状态
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

      // 更新技能使用次数
      if (activeSkill) {
        await Network.request({ url: `/api/skills/${activeSkill.id}/use`, method: 'POST' })
      }

      // 保存思考内容
      if (response.data?.thinking) {
        setLastThinking(response.data.thinking)
      }

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
      setIsThinking(false)
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
          if (file) addMessage({ type: 'text', content: `已选择：${file.name}`, from: 'user' })
        }
        input.click()
      }
    } catch (error) {
      Taro.hideLoading()
    }
  }

  // 切换语音回复，同时中断正在朗读的声音
  const handleToggleVoice = () => {
    // 中断正在朗读的声音
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setVoiceReplyEnabled(!voiceReplyEnabled)
  }

  const currentMode = modes.find(m => m.id === chatMode) || modes[1]
  const iconColor = theme === 'dark' ? '#FFFFFF' : '#1F1F1F'
  const iconColorGray = theme === 'dark' ? '#666666' : '#8C8C8C'

  return (
    <View className={`min-h-screen bg-white dark:bg-black ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 顶部导航 - 透明背景，无中间文字 */}
      <View className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <View className="flex items-center justify-between h-14 px-4">
          <View onClick={() => setShowSidebar(true)} className="p-2 cursor-pointer">
            <Menu size={22} color={iconColor} />
          </View>
          <View className="flex items-center gap-1">
            <View onClick={handleToggleVoice} className="p-2 cursor-pointer">
              {voiceReplyEnabled ? <Volume2 size={22} color="#1890FF" /> : <VolumeX size={22} color={iconColorGray} />}
            </View>
          </View>
        </View>
      </View>

      {/* 侧边栏 */}
      {showSidebar && <Sidebar onClose={() => setShowSidebar(false)} />}

      {/* 对话内容 */}
      <ScrollView className="pt-16 pb-40 px-4" scrollY scrollIntoView={messages.length > 0 ? `msg-${messages[messages.length - 1].id}` : ''}>
        {messages.map((msg, index) => {
          const isLastUserMessage = msg.from === 'user' && index === messages.length - 1
          const showThinkingAfterThis = isLastUserMessage && (isThinking || lastThinking)
          
          return (
            <View key={msg.id}>
              <View id={`msg-${msg.id}`}>
                <ChatBubble message={msg} />
              </View>
              
              {/* 思考过程 - 跟在最后一条用户消息后面 */}
              {showThinkingAfterThis && (
                <ThinkingMessage thinking={lastThinking} isThinking={isThinking} />
              )}
            </View>
          )
        })}
        
        {/* 加载中提示（非深度模式） */}
        {isLoading && !isThinking && (
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

      {/* 技能选择面板 */}
      {showSkillPanel && (
        <>
          <View className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }} onClick={() => setShowSkillPanel(false)} />
          <View className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-50 p-4 max-h-[60vh]">
            <View className="flex items-center justify-between mb-4">
              <Text className="block text-lg font-medium text-black dark:text-white">选择技能</Text>
              <View className="flex items-center gap-2">
                <View 
                  onClick={() => { setShowSkillPanel(false); Taro.navigateTo({ url: '/pages/skills/index' }) }}
                  className="px-2 py-1 rounded bg-blue-500 cursor-pointer"
                >
                  <Text className="text-xs text-white">管理技能</Text>
                </View>
                <Text className="block text-gray-500 text-sm cursor-pointer" onClick={() => setShowSkillPanel(false)}>关闭</Text>
              </View>
            </View>
            
            {/* 无技能状态 */}
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
                {/* 清除技能选项 */}
                {activeSkill && (
                  <View
                    className="flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer bg-red-50 dark:bg-red-900 dark:bg-opacity-20"
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
                      className={`flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer ${isActive ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : 'bg-gray-50 dark:bg-gray-800'}`}
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

      {/* 底部输入区域 - 两排布局 */}
      <View className="fixed bottom-0 left-0 right-0 p-3">
        <View className={`bg-gray-100 dark:bg-gray-900 rounded-3xl overflow-hidden ${isRecording ? 'bg-blue-500' : ''}`}>
          {/* 上排：输入区域 */}
          <View className="flex items-center gap-2 px-3 py-3">
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
                placeholder="输入消息..."
                placeholderClass="text-gray-400"
                className="flex-1 bg-transparent text-sm text-black dark:text-white"
                confirmType="send"
                autoFocus
                onBlur={() => { if (!inputText.trim()) setShowTextInput(false) }}
              />
            ) : (
              <View className="flex-1" onClick={() => setShowTextInput(true)}>
                <Text className="text-black dark:text-white text-sm">输入消息...</Text>
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
          <View className="flex items-center justify-between px-3 py-2">
            {/* 左侧：模式选择 + 技能调用 */}
            <View className="flex items-center gap-3">
              <View onClick={() => setShowModePanel(true)} className="flex items-center gap-1 cursor-pointer">
                <Text className="block text-xs text-black dark:text-white">{currentMode.label}</Text>
                <ChevronDown size={12} color={iconColorGray} />
              </View>
              
              {/* 技能调用按钮 */}
              <View 
                onClick={() => setShowSkillPanel(true)} 
                className={`flex items-center gap-1 px-2 py-1 rounded-full cursor-pointer ${activeSkill ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <Sparkles size={12} color={activeSkill ? '#fff' : iconColorGray} />
                <Text className={`block text-xs ${activeSkill ? 'text-white' : 'text-black dark:text-white'}`}>
                  {activeSkill ? activeSkill.name : '技能'}
                </Text>
                <ChevronDown size={10} color={activeSkill ? '#fff' : iconColorGray} />
              </View>
            </View>
            
            {/* 右侧：功能按钮 */}
            <View className="flex items-center gap-2">
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
