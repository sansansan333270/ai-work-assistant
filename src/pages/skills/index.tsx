import { View, Text, ScrollView, Input, Textarea } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useThemeStore } from '@/store/theme'
import { useSkillsStore, Skill } from '@/store/skills'
import { ArrowLeft, Plus, Code, Pen, Sparkles, Zap, ChartBarBig, Trash2, Pencil, X } from 'lucide-react-taro'
import { Network } from '@/network'

const categories = [
  { id: 'all', label: '全部' },
  { id: 'writing', label: '写作' },
  { id: 'coding', label: '编程' },
  { id: 'analysis', label: '分析' },
  { id: 'custom', label: '自定义' },
]

const iconOptions = ['Sparkles', 'Code', 'Pen', 'Zap', 'BarChart3']

const iconComponents: Record<string, any> = { Sparkles, Code, Pen, Zap, ChartBarBig }

export default function SkillsPage() {
  const { theme } = useThemeStore()
  const { skills, loading, fetchSkills, addSkill, updateSkill, removeSkill } = useSkillsStore()
  const [activeCategory, setActiveCategory] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    category: 'custom',
    icon: 'Sparkles'
  })

  useEffect(() => {
    fetchSkills()
  }, [])

  const filteredSkills = activeCategory === 'all' 
    ? skills 
    : skills.filter(s => s.category === activeCategory)

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.prompt.trim()) {
      Taro.showToast({ title: '请填写名称和提示词', icon: 'none' })
      return
    }
    try {
      const res = await Network.request({
        url: '/api/skills',
        method: 'POST',
        data: formData
      })
      const data = res.data as { data: Skill }
      addSkill(data.data)
      setShowCreate(false)
      setFormData({ name: '', description: '', prompt: '', category: 'custom', icon: 'Sparkles' })
      Taro.showToast({ title: '创建成功', icon: 'success' })
    } catch {
      Taro.showToast({ title: '创建失败', icon: 'none' })
    }
  }

  const handleUpdate = async () => {
    if (!editingSkill) return
    try {
      const res = await Network.request({
        url: `/api/skills/${editingSkill.id}`,
        method: 'PUT',
        data: formData
      })
      const data = res.data as { data: Skill }
      updateSkill(editingSkill.id, data.data)
      setEditingSkill(null)
      setFormData({ name: '', description: '', prompt: '', category: 'custom', icon: 'Sparkles' })
      Taro.showToast({ title: '更新成功', icon: 'success' })
    } catch {
      Taro.showToast({ title: '更新失败', icon: 'none' })
    }
  }

  const handleDelete = async (id: number) => {
    const res = await Taro.showModal({ title: '确认删除', content: '删除后无法恢复' })
    if (res.confirm) {
      try {
        await Network.request({ url: `/api/skills/${id}`, method: 'DELETE' })
        removeSkill(id)
        Taro.showToast({ title: '删除成功', icon: 'success' })
      } catch {
        Taro.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  }

  const startEdit = (skill: Skill) => {
    setEditingSkill(skill)
    setFormData({
      name: skill.name,
      description: skill.description,
      prompt: skill.prompt,
      category: skill.category,
      icon: skill.icon
    })
    setShowCreate(false)
  }

  const cancelEdit = () => {
    setEditingSkill(null)
    setFormData({ name: '', description: '', prompt: '', category: 'custom', icon: 'Sparkles' })
  }

  const iconColor = theme === 'dark' ? '#FFFFFF' : '#000000'
  const iconColorGray = theme === 'dark' ? '#888888' : '#8C8C8C'

  return (
    <View className={`min-h-screen bg-white dark:bg-black ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 顶部导航 */}
      <View className="flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-800">
        <View onClick={() => Taro.navigateBack()} className="p-1 cursor-pointer active:scale-90 transition-transform duration-150">
          <ArrowLeft size={24} color={iconColor} />
        </View>
        <Text className="text-lg font-medium text-black dark:text-white">技能库</Text>
        <View onClick={() => { setShowCreate(true); setEditingSkill(null) }} className="p-1 cursor-pointer active:scale-90 transition-transform duration-150">
          <Plus size={24} color="#22C55E" />
        </View>
      </View>

      {/* 分类标签 */}
      <View className="flex gap-2 px-4 py-3 overflow-x-auto">
        {categories.map((cat) => (
          <View
            key={cat.id}
            className={`px-3 py-1 rounded-full cursor-pointer active:scale-95 transition-transform duration-150 ${
              activeCategory === cat.id 
                ? 'bg-green-500' 
                : 'bg-gray-100 dark:bg-gray-900'
            }`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <Text className={`text-sm ${activeCategory === cat.id ? 'text-white' : 'text-black dark:text-white'}`}>
              {cat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* 技能列表 */}
      <ScrollView className="px-4" style={{ height: 'calc(100vh - 120px)' }} scrollY>
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="text-gray-500 dark:text-gray-400">加载中...</Text>
          </View>
        ) : filteredSkills.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Sparkles size={48} color={iconColorGray} />
            <Text className="block text-gray-500 dark:text-gray-400 mt-4">暂无技能</Text>
            <Text className="block text-gray-400 dark:text-gray-500 text-sm mt-1">点击右上角添加新技能</Text>
          </View>
        ) : (
          filteredSkills.map((skill) => {
            const IconComponent = iconComponents[skill.icon] || Sparkles
            return (
              <View key={skill.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-3">
                {editingSkill?.id === skill.id ? (
                  /* 编辑模式 */
                  <View>
                    <View className="bg-white dark:bg-gray-800 rounded-xl px-3 py-2 mb-2">
                      <Input
                        value={formData.name}
                        onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
                        placeholder="技能名称"
                        className="w-full text-sm text-black dark:text-white"
                      />
                    </View>
                    <View className="bg-white dark:bg-gray-800 rounded-xl px-3 py-2 mb-2">
                      <Input
                        value={formData.description}
                        onInput={(e) => setFormData({ ...formData, description: e.detail.value })}
                        placeholder="技能描述"
                        className="w-full text-sm text-black dark:text-white"
                      />
                    </View>
                    <View className="bg-white dark:bg-gray-800 rounded-xl px-3 py-2 mb-2">
                      <Textarea
                        value={formData.prompt}
                        onInput={(e) => setFormData({ ...formData, prompt: e.detail.value })}
                        placeholder="提示词"
                        className="w-full text-sm text-black dark:text-white"
                        style={{ minHeight: '80px' }}
                      />
                    </View>
                    <View className="flex gap-2 mb-2">
                      {iconOptions.map((icon) => {
                        const IconC = iconComponents[icon]
                        return (
                          <View
                            key={icon}
                            className={`p-2 rounded-xl cursor-pointer active:scale-90 transition-all duration-150 ${formData.icon === icon ? 'bg-green-500' : 'bg-white dark:bg-gray-800'}`}
                            onClick={() => setFormData({ ...formData, icon })}
                          >
                            <IconC size={20} color={formData.icon === icon ? '#fff' : iconColorGray} />
                          </View>
                        )
                      })}
                    </View>
                    <View className="flex justify-end gap-2">
                      <View onClick={cancelEdit} className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 cursor-pointer active:scale-95 transition-transform duration-150">
                        <Text className="text-sm text-black dark:text-white">取消</Text>
                      </View>
                      <View onClick={handleUpdate} className="px-4 py-2 rounded-xl bg-green-500 cursor-pointer active:scale-95 transition-transform duration-150">
                        <Text className="text-sm text-white">保存</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  /* 显示模式 */
                  <View>
                    <View className="flex items-start justify-between">
                      <View className="flex items-center gap-3">
                        <View 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                        >
                          <IconComponent size={20} color="#22C55E" />
                        </View>
                        <View className="flex-1">
                          <Text className="block text-base font-medium text-black dark:text-white">{skill.name}</Text>
                          <Text className="block text-xs text-gray-500 dark:text-gray-400 mt-1">{skill.description || '暂无描述'}</Text>
                        </View>
                      </View>
                      <View className="flex gap-2">
                        <View onClick={() => startEdit(skill)} className="p-1 cursor-pointer active:scale-90 transition-transform duration-150">
                          <Pencil size={16} color={iconColorGray} />
                        </View>
                        <View onClick={() => handleDelete(skill.id)} className="p-1 cursor-pointer active:scale-90 transition-transform duration-150">
                          <Trash2 size={16} color="#EF4444" />
                        </View>
                      </View>
                    </View>
                    <View className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-xl">
                      <Text className="block text-xs text-gray-400 dark:text-gray-500">提示词</Text>
                      <Text className="block text-sm text-gray-600 dark:text-gray-300 mt-1">{skill.prompt}</Text>
                    </View>
                    <View className="flex items-center justify-between mt-2">
                      <Text className="text-xs text-gray-400 dark:text-gray-500">使用 {skill.usageCount} 次</Text>
                    </View>
                  </View>
                )}
              </View>
            )
          })
        )}
      </ScrollView>

      {/* 创建技能弹窗 */}
      {showCreate && (
        <>
          <View 
            className="fixed inset-0 z-40" 
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} 
            onClick={() => setShowCreate(false)} 
          />
          <View 
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black rounded-t-2xl z-50 p-4 max-h-[80vh] overflow-y-auto"
            style={{ animation: 'slideUp 0.25s ease-out' }}
          >
            <View className="flex items-center justify-between mb-4">
              <Text className="text-base font-medium text-black dark:text-white">创建技能</Text>
              <View onClick={() => setShowCreate(false)} className="p-1 cursor-pointer active:scale-90 transition-transform duration-150">
                <X size={18} color={iconColorGray} />
              </View>
            </View>
            
            <View className="mb-3">
              <Text className="block text-sm text-gray-500 dark:text-gray-400 mb-1">名称 *</Text>
              <View className="bg-gray-50 dark:bg-gray-900 rounded-xl px-3 py-2">
                <Input
                  value={formData.name}
                  onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
                  placeholder="如：文章润色、代码优化"
                  className="w-full text-sm text-black dark:text-white"
                />
              </View>
            </View>
            
            <View className="mb-3">
              <Text className="block text-sm text-gray-500 dark:text-gray-400 mb-1">描述</Text>
              <View className="bg-gray-50 dark:bg-gray-900 rounded-xl px-3 py-2">
                <Input
                  value={formData.description}
                  onInput={(e) => setFormData({ ...formData, description: e.detail.value })}
                  placeholder="简要描述这个技能的作用"
                  className="w-full text-sm text-black dark:text-white"
                />
              </View>
            </View>
            
            <View className="mb-3">
              <Text className="block text-sm text-gray-500 dark:text-gray-400 mb-1">提示词 *</Text>
              <View className="bg-gray-50 dark:bg-gray-900 rounded-xl px-3 py-2">
                <Textarea
                  value={formData.prompt}
                  onInput={(e) => setFormData({ ...formData, prompt: e.detail.value })}
                  placeholder="输入AI需要遵循的指令..."
                  className="w-full text-sm text-black dark:text-white"
                  style={{ minHeight: '100px' }}
                />
              </View>
            </View>
            
            <View className="mb-3">
              <Text className="block text-sm text-gray-500 dark:text-gray-400 mb-1">分类</Text>
              <View className="flex gap-2 flex-wrap">
                {categories.filter(c => c.id !== 'all').map((cat) => (
                  <View
                    key={cat.id}
                    className={`px-3 py-1 rounded-lg cursor-pointer active:scale-95 transition-transform duration-150 ${
                      formData.category === cat.id 
                        ? 'bg-green-500' 
                        : 'bg-gray-50 dark:bg-gray-900'
                    }`}
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                  >
                    <Text className={`text-sm ${formData.category === cat.id ? 'text-white' : 'text-black dark:text-white'}`}>
                      {cat.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View className="mb-4">
              <Text className="block text-sm text-gray-500 dark:text-gray-400 mb-1">图标</Text>
              <View className="flex gap-2">
                {iconOptions.map((icon) => {
                  const IconC = iconComponents[icon]
                  return (
                    <View
                      key={icon}
                      className={`p-2 rounded-xl cursor-pointer active:scale-90 transition-transform duration-150 ${
                        formData.icon === icon 
                          ? 'bg-green-500' 
                          : 'bg-gray-50 dark:bg-gray-900'
                      }`}
                      onClick={() => setFormData({ ...formData, icon })}
                    >
                      <IconC size={24} color={formData.icon === icon ? '#fff' : iconColorGray} />
                    </View>
                  )
                })}
              </View>
            </View>
            
            <View onClick={handleCreate} className="bg-green-500 rounded-xl py-3 cursor-pointer active:scale-95 transition-transform duration-150">
              <Text className="block text-center text-white font-medium">创建技能</Text>
            </View>
          </View>
        </>
      )}
    </View>
  )
}
