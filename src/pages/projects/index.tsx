import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useThemeStore } from '@/store/theme'
import { useProjectStore, Project } from '@/store/projects'
import { BookOpen, FileText, Code, Folder, Clock, ChevronRight, Plus } from 'lucide-react-taro'
import './index.css'

const typeIcons: Record<string, any> = {
  novel: BookOpen,
  article: FileText,
  code: Code,
  other: Folder,
}

const typeNames: Record<string, string> = {
  novel: '小说',
  article: '文章',
  code: '代码',
  other: '其他',
}

const statusNames: Record<string, string> = {
  active: '进行中',
  paused: '已暂停',
  completed: '已完成',
}

export default function ProjectsPage() {
  const { theme } = useThemeStore()
  const { projects, loading, fetchProjects, setCurrentProject } = useProjectStore()
  const [activeTab, setActiveTab] = useState<'all' | 'novel' | 'article' | 'code'>('all')

  useEffect(() => {
    fetchProjects()
  }, [])

  const filteredProjects = activeTab === 'all' 
    ? projects 
    : projects.filter(p => p.type === activeTab)

  const handleCreateProject = () => {
    Taro.navigateTo({ url: '/pages/projects/create' })
  }

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project)
    // 跳转到对话页面并带上项目ID
    Taro.redirectTo({ url: `/pages/index/index?projectId=${project.id}` })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const iconColorGray = theme === 'dark' ? '#888888' : '#8C8C8C'

  return (
    <View className={`min-h-screen bg-white dark:bg-black ${theme === 'dark' ? 'dark' : ''}`}>
      {/* 标题栏 */}
      <View className="px-4 py-6 border-b border-gray-200 dark:border-gray-800">
        <View className="flex flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-black dark:text-white block mb-1">📁 项目</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 block">
              管理你的长期创作项目
            </Text>
          </View>
          <View 
            onClick={handleCreateProject}
            className="bg-green-500 px-4 py-2 rounded-full cursor-pointer active:scale-95 transition-transform duration-150"
          >
            <Text className="text-white text-sm font-medium">+ 新建</Text>
          </View>
        </View>
      </View>

      {/* 标签切换 */}
      <View className="flex flex-row gap-2 p-4 border-b border-gray-200 dark:border-gray-800">
        {(['all', 'novel', 'article', 'code'] as const).map(tab => (
          <View
            key={tab}
            className={`px-4 py-2 rounded-full cursor-pointer active:scale-95 transition-transform duration-150 ${
              activeTab === tab
                ? 'bg-green-500'
                : 'bg-gray-100 dark:bg-gray-900'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            <Text className={`text-sm ${activeTab === tab ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
              {tab === 'all' ? '全部' : typeNames[tab]} 
              {tab === 'all' ? ` (${projects.length})` : ` (${projects.filter(p => p.type === tab).length})`}
            </Text>
          </View>
        ))}
      </View>

      {/* 项目列表 */}
      <ScrollView className="p-4" scrollY style={{ height: 'calc(100vh - 200px)' }}>
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="text-gray-500 dark:text-gray-400">加载中...</Text>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Text className="text-6xl mb-4">📋</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mb-4">
              {activeTab === 'all' ? '还没有项目' : `没有${typeNames[activeTab]}项目`}
            </Text>
            <View 
              onClick={handleCreateProject}
              className="bg-green-500 px-6 py-3 rounded-full cursor-pointer active:scale-95 transition-transform duration-150"
            >
              <Text className="text-white font-medium">创建第一个项目</Text>
            </View>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {filteredProjects.map((project) => {
              const IconComponent = typeIcons[project.type] || Folder
              return (
                <View
                  key={project.id}
                  className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 cursor-pointer active:scale-98 transition-transform duration-150"
                  onClick={() => handleOpenProject(project)}
                >
                  <View className="flex flex-row justify-between items-start mb-2">
                    <View className="flex flex-row items-center gap-3 flex-1">
                      <View
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                      >
                        <IconComponent size={20} color="#22C55E" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-black dark:text-white">
                          {project.name}
                        </Text>
                        <View className="flex flex-row items-center gap-2 mt-1">
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            {typeNames[project.type]}
                          </Text>
                          <View
                            className="px-2 py-1 rounded-full"
                            style={{ 
                              backgroundColor: project.status === 'active' 
                                ? 'rgba(34, 197, 94, 0.1)' 
                                : project.status === 'paused'
                                ? 'rgba(250, 173, 20, 0.1)'
                                : 'rgba(107, 114, 128, 0.1)'
                            }}
                          >
                            <Text
                              className="text-xs"
                              style={{ 
                                color: project.status === 'active' 
                                  ? '#22C55E' 
                                  : project.status === 'paused'
                                  ? '#FAAD14'
                                  : '#6B7280'
                              }}
                            >
                              {statusNames[project.status]}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <ChevronRight size={16} color={iconColorGray} />
                  </View>
                  
                  {project.description && (
                    <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {project.description}
                    </Text>
                  )}
                  
                  <View className="flex flex-row justify-between items-center">
                    <View className="flex flex-row items-center gap-1">
                      <Clock size={12} color={iconColorGray} />
                      <Text className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(project.lastActiveAt || project.createdAt)}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-400 dark:text-gray-500">
                      {project.sessionCount || 0} 次对话
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* 浮动新建按钮 */}
      {projects.length > 0 && (
        <View
          onClick={handleCreateProject}
          className="fixed right-4 bottom-20 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer active:scale-90 transition-transform duration-150"
          style={{ zIndex: 100 }}
        >
          <Plus size={24} color="#FFFFFF" />
        </View>
      )}
    </View>
  )
}
