import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { useThemeStore } from '@/store/theme'
import { Star, Archive, Trash2 } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface Note {
  id: number
  title: string
  content: string
  category: string
  tags: string
  isStarred: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export default function NotebookPage() {
  const { theme } = useThemeStore()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'starred' | 'archived'>('all')

  useEffect(() => {
    loadNotes()
  }, [activeTab])

  const loadNotes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab === 'starred') params.append('isStarred', 'true')
      if (activeTab === 'archived') params.append('isArchived', 'true')
      
      const response = await Network.request({
        url: `/api/notes?${params.toString()}`
      })
      setNotes(response.data || [])
    } catch (error) {
      console.error('Failed to load notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleStar = async (id: number) => {
    try {
      await Network.request({
        url: `/api/notes/${id}/star`,
        method: 'PUT'
      })
      loadNotes()
    } catch (error) {
      console.error('Failed to toggle star:', error)
    }
  }

  const archiveNote = async (id: number) => {
    try {
      await Network.request({
        url: `/api/notes/${id}/archive`,
        method: 'PUT'
      })
      loadNotes()
    } catch (error) {
      console.error('Failed to archive note:', error)
    }
  }

  const deleteNote = async (id: number) => {
    try {
      await Network.request({
        url: `/api/notes/${id}`,
        method: 'DELETE'
      })
      loadNotes()
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <View className={`min-h-screen bg-white dark:bg-black ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 标题栏 */}
      <View className="px-4 py-6 border-b border-gray-200 dark:border-gray-800">
        <Text className="text-2xl font-bold text-black dark:text-white block mb-2">📔 笔记本</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 block">
          保存AI对话中有价值的内容
        </Text>
      </View>

      {/* 标签切换 */}
      <View className="flex flex-row gap-2 p-4 border-b border-gray-200 dark:border-gray-800">
        <View
          className={`px-4 py-2 rounded-full cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-500'
              : 'bg-gray-100 dark:bg-gray-900'
          }`}
          onClick={() => setActiveTab('all')}
        >
          <Text className={`text-sm ${activeTab === 'all' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
            全部 ({notes.length})
          </Text>
        </View>
        <View
          className={`px-4 py-2 rounded-full cursor-pointer ${
            activeTab === 'starred'
              ? 'bg-blue-500'
              : 'bg-gray-100 dark:bg-gray-900'
          }`}
          onClick={() => setActiveTab('starred')}
        >
          <Text className={`text-sm ${activeTab === 'starred' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
            ⭐ 收藏
          </Text>
        </View>
        <View
          className={`px-4 py-2 rounded-full cursor-pointer ${
            activeTab === 'archived'
              ? 'bg-blue-500'
              : 'bg-gray-100 dark:bg-gray-900'
          }`}
          onClick={() => setActiveTab('archived')}
        >
          <Text className={`text-sm ${activeTab === 'archived' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
            📦 归档
          </Text>
        </View>
      </View>

      {/* 笔记列表 */}
      <ScrollView className="p-4" scrollY style={{ height: 'calc(100vh - 200px)' }}>
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="text-gray-500">加载中...</Text>
          </View>
        ) : notes.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Text className="text-6xl mb-4">📝</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center">
              还没有笔记{'\n'}在对话中点击保存按钮添加笔记
            </Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {notes.map((note) => (
              <View
                key={note.id}
                className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4"
              >
                <View className="flex flex-row justify-between items-start mb-2">
                  <Text className="text-base font-semibold text-black dark:text-white flex-1">
                    {note.title}
                  </Text>
                  <View className="flex flex-row gap-2">
                    <View
                      className="w-8 h-8 flex items-center justify-center cursor-pointer"
                      onClick={() => toggleStar(note.id)}
                    >
                      <Star
                        size={16}
                        color={note.isStarred ? '#FCD34D' : '#9CA3AF'}
                      />
                    </View>
                    <View
                      className="w-8 h-8 flex items-center justify-center cursor-pointer"
                      onClick={() => archiveNote(note.id)}
                    >
                      <Archive size={16} color="#9CA3AF" />
                    </View>
                    <View
                      className="w-8 h-8 flex items-center justify-center cursor-pointer"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </View>
                  </View>
                </View>
                <Text className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                  {note.content}
                </Text>
                <View className="flex flex-row justify-between items-center">
                  <Text className="text-xs text-gray-400">
                    {formatDate(note.createdAt)}
                  </Text>
                  {note.tags && (
                    <View className="flex flex-row gap-1">
                      {note.tags.split(',').map((tag, idx) => (
                        <View key={idx} className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                          <Text className="text-xs text-blue-600 dark:text-blue-400">
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
