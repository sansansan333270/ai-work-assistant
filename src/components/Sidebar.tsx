import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Database, Brain, Settings, X, Sparkles, History, SquarePlus } from 'lucide-react-taro'

interface Props {
  onClose: () => void
  onNewChat?: () => void
  onOpenHistory?: () => void
}

const menuItems = [
  { icon: Sparkles, label: '技能库', path: '/pages/skills/index' },
  { icon: Database, label: '知识库', path: '/pages/knowledge/index' },
  { icon: Brain, label: '我的记忆', path: '/pages/memory/index' },
  { icon: Settings, label: '设置', path: '/pages/settings/index' },
]

export function Sidebar({ onClose, onNewChat, onOpenHistory }: Props) {
  const handleNavigate = (path: string) => {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const currentPath = '/' + currentPage.route
    
    onClose()
    
    if (currentPath === path) {
      return
    }
    
    Taro.navigateTo({ url: path })
  }

  const handleNewChat = () => {
    onClose()
    if (onNewChat) {
      onNewChat()
    } else {
      Taro.reLaunch({ url: '/pages/index/index' })
    }
  }

  const handleOpenHistory = () => {
    onClose()
    if (onOpenHistory) {
      onOpenHistory()
    } else {
      Taro.navigateTo({ url: '/pages/history/index' })
    }
  }

  const iconColor = '#8C8C8C'

  return (
    <>
      {/* 遮罩 */}
      <View 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* 侧边栏 */}
      <View className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 z-50 shadow-xl">
        <View className="flex items-center justify-between p-4 border-b dark:border-gray-800">
          <Text className="text-lg font-medium text-black dark:text-white">工作助手</Text>
          <View onClick={onClose} className="cursor-pointer active:opacity-60">
            <X size={24} color={iconColor} />
          </View>
        </View>
        
        {/* 快捷操作 */}
        <View className="p-4 border-b dark:border-gray-800">
          <View 
            className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 cursor-pointer active:opacity-80 mb-2"
            onClick={handleNewChat}
          >
            <SquarePlus size={20} color="#1890FF" />
            <Text className="text-blue-500 font-medium">新建对话</Text>
          </View>
          <View 
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer active:opacity-80"
            onClick={handleOpenHistory}
          >
            <History size={20} color={iconColor} />
            <Text className="text-black dark:text-white">历史对话</Text>
          </View>
        </View>
        
        {/* 菜单项 */}
        <View className="p-4">
          {menuItems.map((item, index) => (
            <View 
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer active:opacity-60"
              onClick={() => handleNavigate(item.path)}
            >
              <item.icon size={20} color={iconColor} />
              <Text className="text-black dark:text-white">{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  )
}
