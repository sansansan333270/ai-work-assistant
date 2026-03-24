import { View, Text } from '@tarojs/components'

interface Props {
  content: string
}

// 简单的Markdown渲染器，支持常见格式
export function MarkdownRenderer({ content }: Props) {
  // 解析Markdown内容为节点数组
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n')
    const nodes: Array<{ type: string; content?: string; level?: number; items?: string[] }> = []
    let inCodeBlock = false
    let codeContent = ''
    let inList = false
    let listItems: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // 代码块
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          nodes.push({ type: 'code', content: codeContent.trim() })
          codeContent = ''
          inCodeBlock = false
        } else {
          if (inList) {
            nodes.push({ type: 'list', items: [...listItems] })
            listItems = []
            inList = false
          }
          inCodeBlock = true
        }
        continue
      }
      
      if (inCodeBlock) {
        codeContent += line + '\n'
        continue
      }

      // 标题
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
      if (headerMatch) {
        if (inList) {
          nodes.push({ type: 'list', items: [...listItems] })
          listItems = []
          inList = false
        }
        nodes.push({ 
          type: 'header', 
          content: headerMatch[2], 
          level: headerMatch[1].length 
        })
        continue
      }

      // 列表项
      const listMatch = line.match(/^[-*+]\s+(.+)$/)
      if (listMatch) {
        inList = true
        listItems.push(listMatch[1])
        continue
      }

      // 有序列表
      const orderedListMatch = line.match(/^\d+\.\s+(.+)$/)
      if (orderedListMatch) {
        inList = true
        listItems.push(orderedListMatch[1])
        continue
      }

      // 空行
      if (line.trim() === '') {
        if (inList) {
          nodes.push({ type: 'list', items: [...listItems] })
          listItems = []
          inList = false
        }
        continue
      }

      // 普通段落
      if (inList) {
        nodes.push({ type: 'list', items: [...listItems] })
        listItems = []
        inList = false
      }
      nodes.push({ type: 'paragraph', content: line })
    }

    // 处理最后可能剩余的列表
    if (inList && listItems.length > 0) {
      nodes.push({ type: 'list', items: [...listItems] })
    }

    return nodes
  }

  // 渲染行内格式（粗体、斜体、代码）
  const renderInlineFormat = (text: string) => {
    // 使用更健壮的方式处理行内格式
    const result: Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean }> = []
    let i = 0
    let currentText = ''

    while (i < text.length) {
      // 行内代码 `code`
      if (text[i] === '`') {
        const endIndex = text.indexOf('`', i + 1)
        if (endIndex !== -1) {
          if (currentText) {
            result.push({ text: currentText })
            currentText = ''
          }
          result.push({ text: text.slice(i + 1, endIndex), code: true })
          i = endIndex + 1
          continue
        }
      }
      
      // 粗体 **text**
      if (text[i] === '*' && text[i + 1] === '*') {
        const endIndex = text.indexOf('**', i + 2)
        if (endIndex !== -1) {
          if (currentText) {
            result.push({ text: currentText })
            currentText = ''
          }
          result.push({ text: text.slice(i + 2, endIndex), bold: true })
          i = endIndex + 2
          continue
        }
      }

      // 斜体 *text*（单个星号，且不是粗体）
      if (text[i] === '*' && text[i + 1] !== '*') {
        // 找下一个单独的星号
        let j = i + 1
        while (j < text.length) {
          if (text[j] === '*' && text[j + 1] !== '*') {
            // 确保不是粗体的开始
            if (j > 0 && text[j - 1] !== '*') {
              if (currentText) {
                result.push({ text: currentText })
                currentText = ''
              }
              result.push({ text: text.slice(i + 1, j), italic: true })
              i = j + 1
              break
            }
          }
          j++
        }
        if (j < text.length) continue
      }

      // 下划线斜体 _text_
      if (text[i] === '_') {
        const endIndex = text.indexOf('_', i + 1)
        if (endIndex !== -1 && endIndex > i + 1) {
          if (currentText) {
            result.push({ text: currentText })
            currentText = ''
          }
          result.push({ text: text.slice(i + 1, endIndex), italic: true })
          i = endIndex + 1
          continue
        }
      }

      currentText += text[i]
      i++
    }

    if (currentText) {
      result.push({ text: currentText })
    }

    return result.map((part, index) => {
      let className = 'text-sm text-black dark:text-white'
      if (part.bold) className = 'text-sm font-semibold text-black dark:text-white'
      if (part.italic) className = 'text-sm italic text-black dark:text-white'
      if (part.code) className = 'text-xs bg-gray-100 dark:bg-gray-800 px-1 py-1 rounded font-mono text-gray-700 dark:text-gray-300'
      
      return (
        <Text key={index} className={className}>
          {part.text}
        </Text>
      )
    })
  }

  const nodes = parseMarkdown(content)

  return (
    <View>
      {nodes.map((node, index) => {
        switch (node.type) {
          case 'header':
            const headerClass = node.level === 1 
              ? 'text-xl font-bold mb-2 text-black dark:text-white' 
              : node.level === 2 
                ? 'text-lg font-bold mb-2 text-black dark:text-white' 
                : 'text-base font-semibold mb-1 text-black dark:text-white'
            return (
              <Text key={index} className={`block ${headerClass}`}>
                {node.content}
              </Text>
            )
          
          case 'paragraph':
            return (
              <Text key={index} className="block text-sm text-black dark:text-white leading-relaxed mb-2">
                {renderInlineFormat(node.content || '')}
              </Text>
            )
          
          case 'code':
            return (
              <View key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 my-2 overflow-x-auto">
                <Text className="block text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {node.content || ''}
                </Text>
              </View>
            )
          
          case 'list':
            return (
              <View key={index} className="mb-2">
                {node.items?.map((item, i) => (
                  <View key={i} className="flex flex-row items-start mb-1">
                    <Text className="text-sm text-gray-500 mr-2">•</Text>
                    <Text className="flex-1 text-sm text-black dark:text-white leading-relaxed">
                      {renderInlineFormat(item)}
                    </Text>
                  </View>
                ))}
              </View>
            )
          
          default:
            return null
        }
      })}
    </View>
  )
}

// 清理Markdown格式用于语音朗读
export function cleanMarkdownForSpeech(text: string): string {
  let result = text
  
  // 移除代码块
  result = result.replace(/```[\s\S]*?```/g, '，代码块，')
  
  // 移除行内代码
  result = result.replace(/`([^`]+)`/g, '$1')
  
  // 移除粗体标记
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1')
  
  // 移除斜体标记
  result = result.replace(/\*([^*]+)\*/g, '$1')
  result = result.replace(/_([^_]+)_/g, '$1')
  
  // 移除标题标记
  result = result.replace(/^#{1,6}\s+/gm, '')
  
  // 移除列表标记
  result = result.replace(/^[-*+]\s+/gm, '')
  result = result.replace(/^\d+\.\s+/gm, '')
  
  // 处理多余标点
  result = result.replace(/\*\*/g, '')
  result = result.replace(/\*/g, '')
  
  // 处理连续换行
  result = result.replace(/\n{2,}/g, '。')
  result = result.replace(/\n/g, '，')
  
  // 清理多余标点
  result = result.replace(/，+/g, '，')
  result = result.replace(/。+/g, '。')
  result = result.replace(/^，/, '')
  result = result.replace(/^。/, '')
  
  return result.trim()
}
