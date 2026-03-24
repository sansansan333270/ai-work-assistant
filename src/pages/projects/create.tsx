import { View, Text, ScrollView, Textarea, Input, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { useThemeStore } from '@/store/theme'
import { useProjectStore } from '@/store/projects'
import { BookOpen, FileText, Code, Folder, ArrowLeft, Check } from 'lucide-react-taro'
import './create.css'

const projectTypes = [
  { id: 'novel', name: '小说', description: '长篇小说、短篇故事、连载作品', icon: BookOpen },
  { id: 'article', name: '文章', description: '系列文章、专栏、博客', icon: FileText },
  { id: 'code', name: '代码', description: '代码项目、技术文档', icon: Code },
  { id: 'other', name: '其他', description: '其他类型的项目', icon: Folder },
]

export default function CreateProjectPage() {
  const { theme } = useThemeStore()
  const { createProject } = useProjectStore()
  
  const [name, setName] = useState('')
  const [type, setType] = useState('novel')
  const [description, setDescription] = useState('')
  const [settings, setSettings] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入项目名称', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const project = await createProject({
        name: name.trim(),
        type,
        description: description.trim(),
        settings: settings.trim() ? JSON.parse(settings) : {},
      })

      if (project) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        // 跳转到对话页面
        setTimeout(() => {
          Taro.redirectTo({ url: `/pages/index/index?projectId=${project.id}` })
        }, 500)
      }
    } catch (error) {
      console.error('Create project error:', error)
      Taro.showToast({ title: '创建失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const iconColor = theme === 'dark' ? '#FFFFFF' : '#000000'

  return (
    <View className={`min-h-screen bg-white dark:bg-black ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 顶部导航 */}
      <View className="flex flex-row items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <View onClick={() => Taro.navigateBack()} className="p-2 cursor-pointer active:scale-90 transition-transform duration-150">
          <ArrowLeft size={22} color={iconColor} />
        </View>
        <Text className="text-lg font-semibold text-black dark:text-white">新建项目</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="p-4" scrollY style={{ height: 'calc(100vh - 150px)' }}>
        {/* 项目名称 */}
        <View className="mb-6">
          <Text className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            项目名称 *
          </Text>
          <View className="bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-3">
            <Input
              value={name}
              onInput={(e) => setName(e.detail.value)}
              placeholder="例如：我的科幻小说"
              placeholderClass="text-gray-400"
              className="w-full bg-transparent text-black dark:text-white"
              maxlength={50}
            />
          </View>
        </View>

        {/* 项目类型 */}
        <View className="mb-6">
          <Text className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            项目类型
          </Text>
          <View className="grid grid-cols-2 gap-3">
            {projectTypes.map((t) => {
              const IconComponent = t.icon
              const isSelected = type === t.id
              return (
                <View
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`relative p-4 rounded-xl cursor-pointer active:scale-95 transition-all duration-150 ${
                    isSelected 
                      ? 'bg-gray-100 dark:bg-gray-800 border-2 border-green-500' 
                      : 'bg-gray-50 dark:bg-gray-900 border-2 border-transparent'
                  }`}
                >
                  <View className="flex flex-row items-center gap-2 mb-1">
                    <View 
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                    >
                      <IconComponent size={18} color="#22C55E" />
                    </View>
                    <Text className="text-base font-medium text-black dark:text-white">
                      {t.name}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {t.description}
                  </Text>
                  {isSelected && (
                    <View className="absolute top-2 right-2">
                      <Check size={16} color="#22C55E" />
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        </View>

        {/* 项目简介 */}
        <View className="mb-6">
          <Text className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            项目简介（可选）
          </Text>
          <View className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <Textarea
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
              placeholder="描述你的项目内容、目标..."
              placeholderClass="text-gray-400 dark:text-gray-600"
              className="w-full bg-transparent text-black dark:text-white"
              style={{ minHeight: '80px' }}
              maxlength={500}
            />
          </View>
        </View>

        {/* 核心设定 */}
        <View className="mb-6">
          <Text className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            核心设定（可选）
          </Text>
          <View className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <Textarea
              value={settings}
              onInput={(e) => setSettings(e.detail.value)}
              placeholder="例如：主角姓名、世界观、故事背景等，每行一个设定"
              placeholderClass="text-gray-400 dark:text-gray-600"
              className="w-full bg-transparent text-black dark:text-white"
              style={{ minHeight: '100px' }}
              maxlength={1000}
            />
          </View>
          <Text className="block text-xs text-gray-400 dark:text-gray-500 mt-1">
            设定会在对话时自动注入到AI上下文中
          </Text>
        </View>

        {/* 提示 */}
        <View 
          className="rounded-xl p-4 mb-6"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
        >
          <Text className="block text-sm" style={{ color: '#22C55E' }}>
            💡 创建项目后，AI 会记住你的设定，在后续对话中保持连贯性。你随时可以在对话中更新设定。
          </Text>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800">
        <Button
          onClick={handleCreate}
          disabled={loading || !name.trim()}
          className={`w-full py-3 rounded-xl font-medium ${
            loading || !name.trim()
              ? 'bg-gray-300 text-gray-500'
              : 'bg-green-500 text-white'
          }`}
        >
          {loading ? '创建中...' : '创建项目'}
        </Button>
      </View>
    </View>
  )
}
