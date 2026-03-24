import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Database, Brain, Settings, X, Sparkles, History, SquarePlus } from 'lucide-react-taro'
import { useThemeStore } from '@/store/theme'

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
  const { theme } = useThemeStore()
  
  const handleNavigate = (path: string) => {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const currentPath = '/' + currentPage.route
    
    onClose()
    
    if (currentPath === path) {
      return
    }
    
    // 使用 redirectTo 替换当前页面，避免导航栈累积
    // 这样返回键可以直接回到主页
    Taro.redirectTo({ url: path })
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
      Taro.redirectTo({ url: '/pages/history/index' })
    }
  }

  const iconColor = theme === 'dark' ? '#888888' : '#8C8C8C'

  return (
    <>
      {/* 遮罩 */}
      <View 
        className="fixed inset-0 z-50"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', animation: 'fadeIn 0.2s ease-out' }}
        onClick={onClose}
      />
      
      {/* 侧边栏 */}
      <View 
        className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-black z-50"
        style={{ animation: 'slideRight 0.25s ease-out' }}
      >
        <View className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <Text className="text-lg font-medium text-black dark:text-white">工作助手</Text>
          <View onClick={onClose} className="p-1 cursor-pointer active:scale-90 transition-transform duration-150">
            <X size={20} color={iconColor} />
          </View>
        </View>
        
        {/* 快捷操作 */}
        <View className="p-4 border-b border-gray-200 dark:border-gray-800">
          <View 
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer active:scale-95 transition-transform duration-150 mb-2"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
            onClick={handleNewChat}
          >
            <SquarePlus size={20} color="#22C55E" />
            <Text className="font-medium" style={{ color: '#22C55E' }}>新建对话</Text>
          </View>
          <View 
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 cursor-pointer active:scale-95 transition-transform duration-150"
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
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer active:scale-95 transition-transform duration-150"
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
