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
            nodes.push({ type: 'list', items: listItems })
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
          nodes.push({ type: 'list', items: listItems })
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
          nodes.push({ type: 'list', items: listItems })
          listItems = []
          inList = false
        }
        continue
      }

      // 普通段落
      if (inList) {
        nodes.push({ type: 'list', items: listItems })
        listItems = []
        inList = false
      }
      nodes.push({ type: 'paragraph', content: line })
    }

    // 处理最后可能剩余的列表
    if (inList && listItems.length > 0) {
      nodes.push({ type: 'list', items: listItems })
    }

    return nodes
  }

  // 渲染行内格式（粗体、斜体、代码）
  const renderInlineFormat = (text: string) => {
    const parts: Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean }> = []
    let remaining = text
    
    while (remaining.length > 0) {
      // 行内代码 `code`
      const codeMatch = remaining.match(/`([^`]+)`/)
      if (codeMatch && codeMatch.index !== undefined) {
        if (codeMatch.index > 0) {
          parts.push({ text: remaining.substring(0, codeMatch.index) })
        }
        parts.push({ text: codeMatch[1], code: true })
        remaining = remaining.substring(codeMatch.index + codeMatch[0].length)
        continue
      }
      
      // 粗体 **text**
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push({ text: remaining.substring(0, boldMatch.index) })
        }
        parts.push({ text: boldMatch[1], bold: true })
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length)
        continue
      }

      // 斜体 *text* 或 _text_
      const italicMatch = remaining.match(/[*_]([^*_]+)[*_]/)
      if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0) {
          parts.push({ text: remaining.substring(0, italicMatch.index) })
        }
        parts.push({ text: italicMatch[1], italic: true })
        remaining = remaining.substring(italicMatch.index + italicMatch[0].length)
        continue
      }

      // 没有匹配，添加剩余文本
      parts.push({ text: remaining })
      break
    }

    return parts.map((part, index) => {
      let className = 'text-sm'
      if (part.bold) className += ' font-semibold'
      if (part.italic) className += ' italic'
      if (part.code) className = 'text-xs bg-gray-100 dark:bg-gray-800 px-1 py-1 rounded font-mono'
      
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
              ? 'text-xl font-bold mb-2' 
              : node.level === 2 
                ? 'text-lg font-bold mb-2' 
                : 'text-base font-semibold mb-1'
            return (
              <Text key={index} className={`block ${headerClass} text-black dark:text-white`}>
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
