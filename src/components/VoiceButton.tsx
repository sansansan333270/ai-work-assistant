import { View } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react-taro'
import Taro from '@tarojs/taro'

interface Props {
  onResult: (text: string) => void
}

export function VoiceButton({ onResult }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

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
          onResult(transcript)
          setIsRecording(false)
        }
        
        recognitionInstance.onerror = () => {
          setIsRecording(false)
          Taro.showToast({ title: '语音识别失败', icon: 'none' })
        }
        
        recognitionInstance.onend = () => {
          setIsRecording(false)
        }
        
        setRecognition(recognitionInstance)
      }
    }
  }, [])

  const toggleRecording = () => {
    if (!recognition) {
      Taro.showToast({ title: '浏览器不支持语音识别', icon: 'none' })
      return
    }

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
    } else {
      try {
        recognition.start()
        setIsRecording(true)
      } catch (error) {
        Taro.showToast({ title: '语音识别启动失败', icon: 'none' })
      }
    }
  }

  return (
    <View 
      className={`
        w-12 h-12 rounded-full flex items-center justify-center cursor-pointer
        ${isRecording 
          ? 'bg-red-500' 
          : 'bg-gray-100 dark:bg-gray-900'
        }
      `}
      onClick={toggleRecording}
    >
      {isRecording ? (
        <MicOff size={24} color="#FFFFFF" className="animate-pulse" />
      ) : (
        <Mic size={24} color="#8C8C8C" />
      )}
    </View>
  )
}
