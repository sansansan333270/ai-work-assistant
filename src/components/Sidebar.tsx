import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { MessageSquare, FileText, Presentation, Image, Database, Brain, Settings, X, Sparkles } from 'lucide-react-taro'

interface Props {
  onClose: () => void
}

const menuItems = [
  { icon: MessageSquare, label: '智能对话', path: '/pages/index/index' },
  { icon: Sparkles, label: '技能库', path: '/pages/skills/index' },
  { icon: FileText, label: '文档工作台', path: '/pages/document/index' },
  { icon: Presentation, label: 'PPT工作台', path: '/pages/ppt/index' },
  { icon: Image, label: '生图工作台', path: '/pages/image/index' },
  { icon: Database, label: '知识库', path: '/pages/knowledge/index' },
  { icon: Brain, label: '我的记忆', path: '/pages/memory/index' },
  { icon: Settings, label: '设置', path: '/pages/settings/index' },
]

export function Sidebar({ onClose }: Props) {
  const handleNavigate = (path: string) => {
    // 获取当前页面路由
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const currentPath = '/' + currentPage.route
    
    // 关闭侧边栏
    onClose()
    
    // 如果当前已经在目标页面，不跳转
    if (currentPath === path) {
      return
    }
    
    // 如果目标页面是主页，使用 reLaunch 清空页面栈
    if (path === '/pages/index/index') {
      Taro.reLaunch({ url: path })
    } else {
      // 其他页面使用 navigateTo
      Taro.navigateTo({ url: path })
    }
  }

  return (
    <>
      {/* 遮罩 */}
      <View 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* 侧边栏 */}
      <View className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-black z-50 shadow-xl">
        <View className="flex items-center justify-between p-4 border-b dark:border-gray-800">
          <Text className="text-lg font-medium text-black dark:text-white">菜单</Text>
          <View onClick={onClose} className="cursor-pointer">
            <X size={24} color="#8C8C8C" />
          </View>
        </View>
        
        <View className="p-4">
          {menuItems.map((item, index) => (
            <View 
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer"
              onClick={() => handleNavigate(item.path)}
            >
              <item.icon size={20} color="#8C8C8C" />
              <Text className="text-black dark:text-white">{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  )
}
