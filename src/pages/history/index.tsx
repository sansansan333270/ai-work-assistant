import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useThemeStore } from '@/store/theme'
import { MessageCircle, Trash2, Clock } from 'lucide-react-taro'
import { Network } from '@/network'

interface Session {
  id: number
  title: string
  model: string
  mode: string
  messageCount: number
  lastMessageAt: number | null
  createdAt: number
  updatedAt: number
}

export default function History() {
  const { theme } = useThemeStore()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await Network.request({ url: '/api/sessions' })
      setSessions(res.data?.data || [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSession = (sessionId: number) => {
    // 跳转到首页并传递会话ID
    Taro.redirectTo({
      url: `/pages/index/index?sessionId=${sessionId}`
    })
  }

  const handleDeleteSession = async (sessionId: number, e: any) => {
    e.stopPropagation()
    
    const result = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个对话吗？'
    })
    
    if (result.confirm) {
      try {
        await Network.request({
          url: `/api/sessions/${sessionId}`,
          method: 'DELETE'
        })
        setSessions(sessions.filter(s => s.id !== sessionId))
        Taro.showToast({ title: '已删除', icon: 'success' })
      } catch (error) {
        Taro.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  }

  const handleClearAll = async () => {
    const result = await Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有历史对话吗？此操作不可恢复。'
    })
    
    if (result.confirm) {
      try {
        await Network.request({
          url: '/api/sessions',
          method: 'DELETE'
        })
        setSessions([])
        Taro.showToast({ title: '已清空', icon: 'success' })
      } catch (error) {
        Taro.showToast({ title: '清空失败', icon: 'none' })
      }
    }
  }

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return ''
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
    
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const iconColorGray = theme === 'dark' ? '#666666' : '#8C8C8C'

  return (
    <View className={`min-h-screen bg-gray-50 dark:bg-black ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 顶部操作栏 */}
      <View className="bg-white dark:bg-gray-900 px-4 py-3 flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <Text className="text-sm text-gray-500">{sessions.length} 个对话</Text>
        {sessions.length > 0 && (
          <View onClick={handleClearAll} className="cursor-pointer active:opacity-60">
            <Text className="text-sm text-red-500">清空全部</Text>
          </View>
        )}
      </View>

      {/* 会话列表 */}
      <ScrollView scrollY className="h-[calc(100vh-60px)]">
        {loading ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Text className="text-gray-400">加载中...</Text>
          </View>
        ) : sessions.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <MessageCircle size={48} color={iconColorGray} />
            <Text className="block text-gray-400 mt-4">暂无历史对话</Text>
            <Text className="block text-gray-300 text-sm mt-2">开始新对话后会自动保存</Text>
          </View>
        ) : (
          <View className="p-4">
            {sessions.map((session, index) => (
              <View
                key={session.id}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-3 cursor-pointer active:opacity-80"
                style={{ animation: `slideUp 0.3s ease-out ${index * 0.03}s both` }}
                onClick={() => handleSelectSession(session.id)}
              >
                <View className="flex flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="block text-base font-medium text-black dark:text-white mb-1">
                      {session.title || '新对话'}
                    </Text>
                    <View className="flex flex-row items-center gap-2">
                      <Clock size={12} color={iconColorGray} />
                      <Text className="text-xs text-gray-400">
                        {formatTime(session.lastMessageAt || session.updatedAt)}
                      </Text>
                      <Text className="text-xs text-gray-400">·</Text>
                      <Text className="text-xs text-gray-400">{session.messageCount} 条消息</Text>
                    </View>
                  </View>
                  <View 
                    className="p-2 cursor-pointer active:opacity-60"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                  >
                    <Trash2 size={18} color={iconColorGray} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 底部新建对话按钮 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <View
          className="flex flex-row items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 cursor-pointer active:opacity-80"
          onClick={() => Taro.redirectTo({ url: '/pages/index/index' })}
        >
          <MessageCircle size={18} color="#FFFFFF" />
          <Text className="text-white font-medium">开始新对话</Text>
        </View>
      </View>
    </View>
  )
}
