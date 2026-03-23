import { View, Text } from '@tarojs/components'
import { useThemeStore } from '@/store/theme'
import './index.css'

export default function MemoryPage() {
  const { theme } = useThemeStore()

  return (
    <View className={`min-h-screen bg-white dark:bg-black p-4 ${theme === 'dark' ? 'dark' : ''}`}>
      <View className="flex flex-col items-center justify-center py-20">
        <Text className="text-2xl font-bold text-black dark:text-white mb-4">💾 我的记忆</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center">
          功能开发中...{'\n'}
          敬请期待
        </Text>
      </View>
    </View>
  )
}
