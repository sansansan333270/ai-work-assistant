import { View, Text, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useThemeStore } from '@/store/theme'
import { Brain, Trash2, Search, X, Zap, User, Briefcase, Settings, Star, Pencil, Plus } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface Memory {
  id: number
  type: string
  key: string
  value: string
  importance: number | null
  confidence: number | null
  source: string | null
  isActive: boolean
  accessCount: number | null
  createdAt: string
  updatedAt: string
}

// 记忆类型
const memoryTypes = [
  { id: 'all', name: '全部', icon: Brain },
  { id: 'preference', name: '偏好', icon: Star },
  { id: 'identity', name: '身份', icon: User },
  { id: 'fact', name: '事实', icon: Zap },
  { id: 'instruction', name: '指令', icon: Settings },
  { id: 'context', name: '上下文', icon: Briefcase },
]

export default function MemoryPage() {
  const { theme } = useThemeStore()
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)
  const [formData, setFormData] = useState({
    type: 'preference',
    key: '',
    value: '',
    importance: 5
  })

  useEffect(() => {
    loadMemories()
  }, [activeType])

  const loadMemories = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeType !== 'all') params.append('type', activeType)
      if (searchText) params.append('search', searchText)
      
      const response = await Network.request({
        url: `/api/memories?${params.toString()}`
      })
      // 后端直接返回数组或 { data: [...] }
      const data = response.data
      setMemories(Array.isArray(data) ? data : (data?.data || []))
    } catch (error) {
      console.error('Failed to load memories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadMemories()
  }

  const handleAddMemory = async () => {
    if (!formData.key.trim() || !formData.value.trim()) {
      Taro.showToast({ title: '请填写完整', icon: 'none' })
      return
    }

    try {
      await Network.request({
        url: '/api/memories',
        method: 'POST',
        data: formData
      })
      setShowAddPanel(false)
      setFormData({ type: 'preference', key: '', value: '', importance: 5 })
      loadMemories()
      Taro.showToast({ title: '添加成功', icon: 'success' })
    } catch (error) {
      console.error('Failed to add memory:', error)
      Taro.showToast({ title: '添加失败', icon: 'none' })
    }
  }

  const handleUpdateMemory = async () => {
    if (!editingMemory || !formData.key.trim() || !formData.value.trim()) {
      return
    }

    try {
      await Network.request({
        url: `/api/memories/${editingMemory.id}`,
        method: 'PUT',
        data: {
          key: formData.key,
          value: formData.value,
          importance: formData.importance
        }
      })
      setEditingMemory(null)
      setFormData({ type: 'preference', key: '', value: '', importance: 5 })
      loadMemories()
      Taro.showToast({ title: '更新成功', icon: 'success' })
    } catch (error) {
      console.error('Failed to update memory:', error)
      Taro.showToast({ title: '更新失败', icon: 'none' })
    }
  }

  const handleToggleActive = async (memory: Memory) => {
    try {
      await Network.request({
        url: `/api/memories/${memory.id}/toggle`,
        method: 'PUT'
      })
      loadMemories()
      Taro.showToast({ title: memory.isActive ? '已停用' : '已激活', icon: 'success' })
    } catch (error) {
      console.error('Failed to toggle memory:', error)
    }
  }

  const handleDeleteMemory = async (id: number) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条记忆吗？',
    })
    if (res.confirm) {
      try {
        await Network.request({
          url: `/api/memories/${id}`,
          method: 'DELETE'
        })
        loadMemories()
        Taro.showToast({ title: '已删除', icon: 'success' })
      } catch (error) {
        console.error('Failed to delete memory:', error)
      }
    }
  }

  const openEditPanel = (memory: Memory) => {
    setEditingMemory(memory)
    setFormData({
      type: memory.type,
      key: memory.key,
      value: memory.value,
      importance: memory.importance || 5
    })
    setShowAddPanel(false)
  }

  const openAddPanel = () => {
    setEditingMemory(null)
    setFormData({ type: 'preference', key: '', value: '', importance: 5 })
    setShowAddPanel(true)
  }

  const closePanel = () => {
    setShowAddPanel(false)
    setEditingMemory(null)
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

  const getTypeIcon = (type: string) => {
    const t = memoryTypes.find(m => m.id === type)
    return t?.icon || Brain
  }

  const getTypeName = (type: string) => {
    const t = memoryTypes.find(m => m.id === type)
    return t?.name || type
  }

  const getImportanceColor = (importance: number | null) => {
    if (!importance) return '#888'
    if (importance >= 8) return '#EF4444'
    if (importance >= 6) return '#F59E0B'
    return '#22C55E'
  }

  const iconColorGray = theme === 'dark' ? '#666666' : '#8C8C8C'

  return (
    <View className={`min-h-screen bg-white dark:bg-black ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 标题栏 */}
      <View className="px-4 py-6 border-b border-gray-200 dark:border-gray-800">
        <View className="flex flex-row justify-between items-center">
          <View className="flex flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
              <Brain size={20} color="#22C55E" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-black dark:text-white block">我的记忆</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 block">
                AI记住的关于你的一切
              </Text>
            </View>
          </View>
          <View className="flex flex-row gap-2">
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
            <View 
              onClick={openAddPanel}
              className="p-2 cursor-pointer active:opacity-60"
            >
              <Plus size={22} color="#22C55E" />
            </View>
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
                placeholder="搜索记忆..."
                placeholderClass="text-gray-400"
                className="w-full bg-transparent text-sm text-black dark:text-white"
                confirmType="search"
              />
            </View>
            <View 
              onClick={handleSearch}
              className="bg-green-500 px-4 py-2 rounded-xl cursor-pointer active:scale-95 transition-transform duration-150"
            >
              <Text className="text-white text-sm">搜索</Text>
            </View>
          </View>
        )}
      </View>

      {/* 类型横向滚动 */}
      <ScrollView scrollX className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <View className="flex flex-row gap-2 whitespace-nowrap inline-flex">
          {memoryTypes.map((type) => {
            const IconComponent = type.icon
            return (
              <View
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`flex flex-row items-center gap-2 px-3 py-2 rounded-lg cursor-pointer flex-shrink-0 ${
                  activeType === type.id
                    ? 'bg-gray-800 dark:bg-gray-200'
                    : 'bg-gray-100 dark:bg-gray-900'
                }`}
              >
                <IconComponent size={14} color={activeType === type.id ? (theme === 'dark' ? '#000' : '#fff') : iconColorGray} />
                <Text className={`text-sm ${activeType === type.id ? 'text-white dark:text-black' : 'text-gray-600 dark:text-gray-400'}`}>
                  {type.name}
                </Text>
              </View>
            )
          })}
        </View>
      </ScrollView>

      {/* 记忆列表 */}
      <ScrollView className="p-4" scrollY style={{ height: 'calc(100vh - 200px)' }}>
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="text-gray-500">加载中...</Text>
          </View>
        ) : memories.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Text className="text-6xl mb-4">🧠</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center">
              {searchText ? '没有找到匹配的记忆' : '还没有记忆\nAI会在对话中自动学习并记住重要信息'}
            </Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {memories.map((memory) => {
              const TypeIcon = getTypeIcon(memory.type)
              return (
                <View
                  key={memory.id}
                  className={`bg-gray-50 dark:bg-gray-900 rounded-xl p-4 ${!memory.isActive ? 'opacity-50' : ''}`}
                >
                  <View className="flex flex-row justify-between items-start mb-2">
                    <View className="flex flex-row items-center gap-2 flex-1">
                      <View className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                        <TypeIcon size={12} color="#22C55E" />
                      </View>
                      <Text className="text-base font-semibold text-black dark:text-white flex-1">
                        {memory.key}
                      </Text>
                      {memory.importance && (
                        <View 
                          className="px-2 py-1 rounded-full"
                          style={{ backgroundColor: `${getImportanceColor(memory.importance)}20` }}
                        >
                          <Text className="text-xs" style={{ color: getImportanceColor(memory.importance) }}>
                            重要度 {memory.importance}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {memory.value}
                  </Text>
                  <View className="flex flex-row justify-between items-center">
                    <View className="flex flex-row items-center gap-2">
                      <View className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-800">
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          {getTypeName(memory.type)}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-400">
                        {formatDate(memory.createdAt)}
                      </Text>
                    </View>
                    <View className="flex flex-row gap-2">
                      <View
                        className={`px-3 py-1 rounded-full cursor-pointer ${memory.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                        onClick={() => handleToggleActive(memory)}
                      >
                        <Text className="text-xs text-white">{memory.isActive ? '启用' : '停用'}</Text>
                      </View>
                      <View
                        className="w-8 h-8 flex items-center justify-center cursor-pointer"
                        onClick={() => openEditPanel(memory)}
                      >
                        <Pencil size={16} color={iconColorGray} />
                      </View>
                      <View
                        className="w-8 h-8 flex items-center justify-center cursor-pointer"
                        onClick={() => handleDeleteMemory(memory.id)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </View>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* 添加/编辑记忆面板 */}
      {(showAddPanel || editingMemory) && (
        <>
          <View 
            className="fixed inset-0 z-40" 
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }} 
            onClick={closePanel} 
          />
          <View 
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black rounded-t-2xl z-50"
            style={{ animation: 'slideUp 0.25s ease-out' }}
          >
            <View className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <Text className="text-base font-medium text-black dark:text-white">
                {editingMemory ? '编辑记忆' : '添加新记忆'}
              </Text>
              <Text 
                className="text-gray-500 dark:text-gray-400 text-sm cursor-pointer active:opacity-60" 
                onClick={closePanel}
              >
                取消
              </Text>
            </View>
            <View className="p-4">
              {/* 类型选择 */}
              <View className="mb-4">
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">记忆类型</Text>
                <ScrollView scrollX>
                  <View className="flex flex-row gap-2">
                    {memoryTypes.filter(t => t.id !== 'all').map((type) => {
                      const IconComponent = type.icon
                      return (
                        <View
                          key={type.id}
                          onClick={() => setFormData({ ...formData, type: type.id })}
                          className={`flex flex-row items-center gap-2 px-3 py-2 rounded-lg cursor-pointer flex-shrink-0 ${
                            formData.type === type.id
                              ? 'bg-green-500'
                              : 'bg-gray-100 dark:bg-gray-900'
                          }`}
                        >
                          <IconComponent size={14} color={formData.type === type.id ? '#fff' : iconColorGray} />
                          <Text className={`text-sm ${formData.type === type.id ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                            {type.name}
                          </Text>
                        </View>
                      )
                    })}
                  </View>
                </ScrollView>
              </View>
              
              {/* 记忆键 */}
              <View className="mb-4">
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">记忆标题</Text>
                <View className="bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-3">
                  <Input
                    value={formData.key}
                    onInput={(e) => setFormData({ ...formData, key: e.detail.value })}
                    placeholder="例如：用户偏好、工作项目..."
                    placeholderClass="text-gray-400"
                    className="w-full bg-transparent text-black dark:text-white"
                  />
                </View>
              </View>
              
              {/* 记忆值 */}
              <View className="mb-4">
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">记忆内容</Text>
                <View className="bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-3">
                  <Input
                    value={formData.value}
                    onInput={(e) => setFormData({ ...formData, value: e.detail.value })}
                    placeholder="详细描述..."
                    placeholderClass="text-gray-400"
                    className="w-full bg-transparent text-black dark:text-white"
                  />
                </View>
              </View>
              
              {/* 重要程度 */}
              <View className="mb-6">
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                  重要程度: {formData.importance}
                </Text>
                <View className="flex flex-row items-center gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <View
                      key={num}
                      onClick={() => setFormData({ ...formData, importance: num })}
                      className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer ${
                        formData.importance >= num ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-800'
                      }`}
                    >
                      <Text className={`text-xs ${formData.importance >= num ? 'text-white' : 'text-gray-400'}`}>
                        {num}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              
              {/* 提交按钮 */}
              <View 
                onClick={editingMemory ? handleUpdateMemory : handleAddMemory}
                className="bg-green-500 rounded-xl py-4 cursor-pointer active:scale-95 transition-transform duration-150"
              >
                <Text className="text-white text-center font-medium">
                  {editingMemory ? '更新记忆' : '添加记忆'}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  )
}
