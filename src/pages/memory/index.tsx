import { View, Text, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useThemeStore } from '@/store/theme'
import { Star, Archive, Trash2, Search, X } from 'lucide-react-taro'
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

// 预设分类
const categories = [
  { id: 'all', name: '全部', icon: '📋' },
  { id: 'work', name: '工作', icon: '💼' },
  { id: 'study', name: '学习', icon: '📚' },
  { id: 'life', name: '生活', icon: '🏠' },
  { id: 'creation', name: '创作', icon: '✨' },
  { id: 'default', name: '其他', icon: '📁' },
]

export default function NotebookPage() {
  const { theme } = useThemeStore()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'starred' | 'archived'>('all')
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [allTags, setAllTags] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    loadNotes()
  }, [activeTab, activeCategory, selectedTag])

  // 获取所有标签
  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const res = await Network.request({ url: '/api/notes/tags' })
      setAllTags(res.data?.data || [])
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const loadNotes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab === 'starred') params.append('isStarred', 'true')
      if (activeTab === 'archived') params.append('isArchived', 'true')
      if (activeCategory !== 'all') params.append('category', activeCategory)
      if (searchText) params.append('search', searchText)
      
      const response = await Network.request({
        url: `/api/notes?${params.toString()}`
      })
      let fetchedNotes = response.data?.data || []
      
      // 如果选择了标签，在前端过滤
      if (selectedTag) {
        fetchedNotes = fetchedNotes.filter((note: Note) => 
          note.tags && note.tags.split(',').map(t => t.trim()).includes(selectedTag)
        )
      }
      
      setNotes(fetchedNotes)
    } catch (error) {
      console.error('Failed to load notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadNotes()
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
    const res = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条笔记吗？',
    })
    if (res.confirm) {
      try {
        await Network.request({
          url: `/api/notes/${id}`,
          method: 'DELETE'
        })
        loadNotes()
        fetchTags()
      } catch (error) {
        console.error('Failed to delete note:', error)
      }
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

  const getCategoryIcon = (category: string) => {
    return categories.find(c => c.id === category)?.icon || '📁'
  }

  const iconColorGray = theme === 'dark' ? '#666666' : '#8C8C8C'

  return (
    <View className={`min-h-screen bg-white dark:bg-black ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 标题栏 */}
      <View className="px-4 py-6 border-b border-gray-200 dark:border-gray-800">
        <View className="flex flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-black dark:text-white block mb-2">📔 笔记本</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 block">
              保存AI对话中有价值的内容
            </Text>
          </View>
          <View 
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 cursor-pointer active:opacity-60"
          >
            {showSearch ? (
              <X size={22} color={iconColorGray} />
            ) : (
              <Search size={22} color={iconColorGray} />
            )}
          </View>
        </View>
        
        {/* 搜索框 */}
        {showSearch && (
          <View className="mt-4 flex flex-row gap-2">
            <View className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-xl px-4 py-2">
              <Input
                value={searchText}
                onInput={(e) => setSearchText(e.detail.value)}
                onConfirm={handleSearch}
                placeholder="搜索笔记..."
                placeholderClass="text-gray-400"
                className="w-full bg-transparent text-sm text-black dark:text-white"
                confirmType="search"
              />
            </View>
            <View 
              onClick={handleSearch}
              className="bg-blue-500 px-4 py-2 rounded-xl cursor-pointer active:opacity-80"
            >
              <Text className="text-white text-sm">搜索</Text>
            </View>
          </View>
        )}
      </View>

      {/* 状态标签切换 */}
      <View className="flex flex-row gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <View
          className={`px-4 py-2 rounded-full cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-500'
              : 'bg-gray-100 dark:bg-gray-900'
          }`}
          onClick={() => setActiveTab('all')}
        >
          <Text className={`text-sm ${activeTab === 'all' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
            全部
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

      {/* 分类横向滚动 */}
      <ScrollView scrollX className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <View className="flex flex-row gap-2 whitespace-nowrap inline-flex">
          {categories.map((cat) => (
            <View
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-2 rounded-full cursor-pointer flex-shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-gray-800 dark:bg-gray-200'
                  : 'bg-gray-100 dark:bg-gray-900'
              }`}
            >
              <Text className={`text-sm ${activeCategory === cat.id ? 'text-white dark:text-black' : 'text-gray-600 dark:text-gray-400'}`}>
                {cat.icon} {cat.name}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 标签云 */}
      {allTags.length > 0 && (
        <ScrollView scrollX className="px-4 py-2 border-b border-gray-200 dark:border-gray-800">
          <View className="flex flex-row gap-2 whitespace-nowrap inline-flex">
            <View
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full cursor-pointer flex-shrink-0 ${
                selectedTag === null
                  ? 'bg-blue-500'
                  : 'bg-gray-100 dark:bg-gray-900'
              }`}
            >
              <Text className={`text-xs ${selectedTag === null ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                全部标签
              </Text>
            </View>
            {allTags.map((tag) => (
              <View
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full cursor-pointer flex-shrink-0 ${
                  selectedTag === tag
                    ? 'bg-blue-500'
                    : 'bg-gray-100 dark:bg-gray-900'
                }`}
              >
                <Text className={`text-xs ${selectedTag === tag ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  # {tag}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* 笔记列表 */}
      <ScrollView className="p-4" scrollY style={{ height: 'calc(100vh - 280px)' }}>
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="text-gray-500">加载中...</Text>
          </View>
        ) : notes.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Text className="text-6xl mb-4">📝</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center">
              {searchText || selectedTag ? '没有找到匹配的笔记' : '还没有笔记\n在对话中点击保存按钮添加笔记'}
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
                  <View className="flex flex-row items-center gap-2 flex-1">
                    <Text className="text-sm">{getCategoryIcon(note.category)}</Text>
                    <Text className="text-base font-semibold text-black dark:text-white flex-1">
                      {note.title}
                    </Text>
                  </View>
                  <View className="flex flex-row gap-2">
                    <View
                      className="w-8 h-8 flex items-center justify-center cursor-pointer"
                      onClick={() => toggleStar(note.id)}
                    >
                      <Star
                        size={16}
                        color={note.isStarred ? '#FCD34D' : iconColorGray}
                        filled={note.isStarred}
                      />
                    </View>
                    <View
                      className="w-8 h-8 flex items-center justify-center cursor-pointer"
                      onClick={() => archiveNote(note.id)}
                    >
                      <Archive size={16} color={note.isArchived ? '#3B82F6' : iconColorGray} />
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
                    <View className="flex flex-row gap-1 flex-wrap">
                      {note.tags.split(',').slice(0, 3).map((tag, idx) => (
                        <View 
                          key={idx} 
                          className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded cursor-pointer"
                          onClick={() => setSelectedTag(tag.trim())}
                        >
                          <Text className="text-xs text-blue-600 dark:text-blue-400">
                            #{tag.trim()}
                          </Text>
                        </View>
                      ))}
                      {note.tags.split(',').length > 3 && (
                        <Text className="text-xs text-gray-400">
                          +{note.tags.split(',').length - 3}
                        </Text>
                      )}
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
