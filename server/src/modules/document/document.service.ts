import { Injectable } from '@nestjs/common'
import { AiService } from '../ai/ai.service'

export type DocType = 'report' | 'proposal' | 'summary' | 'free'

export interface GenerateDocumentRequest {
  topic: string
  type: DocType
  details?: string
}

export interface GenerateDocumentResponse {
  markdown: string
  type: DocType
  title: string
}

// 文档类型对应的提示词模板
const DOC_TYPE_PROMPTS: Record<DocType, { name: string; template: string }> = {
  report: {
    name: '报告',
    template: `请撰写一份专业报告，主题如下：
{topic}

补充说明：{details}

请按照以下结构撰写：
# {标题}

## 概述
（简要说明报告背景和目的）

## 现状分析
（详细分析当前情况）

## 主要发现
（列出关键发现和问题）

## 建议/结论
（提出建议或总结）

请使用Markdown格式，内容专业、详实、有深度。`,
  },
  proposal: {
    name: '方案',
    template: `请撰写一份详细的方案文档，主题如下：
{topic}

补充说明：{details}

请按照以下结构撰写：
# {标题}方案

## 背景
（说明方案背景和目标）

## 方案概述
（简要描述方案核心内容）

## 实施步骤
（详细的实施步骤）

### 步骤一
### 步骤二
### 步骤三

## 资源需求
（人力、物力、时间等资源需求）

## 风险评估
（可能的风险和应对措施）

## 预期效果
（预期的成果和效果）

请使用Markdown格式，内容具体可行、逻辑清晰。`,
  },
  summary: {
    name: '总结',
    template: `请撰写一份工作总结，主题如下：
{topic}

补充说明：{details}

请按照以下结构撰写：
# {标题}总结

## 工作概述
（简要说明工作内容和范围）

## 主要成果
（列出主要工作成果）

### 成果一
### 成果二

## 经验教训
（总结经验和教训）

## 下一步计划
（后续工作计划）

请使用Markdown格式，内容简洁有力、重点突出。`,
  },
  free: {
    name: '自由',
    template: `{topic}

补充说明：{details}

请根据以上内容撰写一份结构清晰、内容详实的文档。使用Markdown格式。`,
  },
}

@Injectable()
export class DocumentService {
  constructor(private readonly aiService: AiService) {}

  async generateDocument(request: GenerateDocumentRequest): Promise<GenerateDocumentResponse> {
    const { topic, type, details = '' } = request

    const docConfig = DOC_TYPE_PROMPTS[type]
    const prompt = docConfig.template
      .replace('{topic}', topic)
      .replace('{details}', details || '无')

    // 调用AI服务生成内容
    const result = await this.aiService.chat({
      message: prompt,
      model: 'doubao',
      mode: 'standard',
    })

    const fullContent = result.answer

    // 提取标题
    const titleMatch = fullContent.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : topic

    return {
      markdown: fullContent,
      type,
      title,
    }
  }

  /**
   * 将Markdown转换为Word文档的HTML格式
   * 用于前端下载
   */
  markdownToWordHtml(markdown: string, title: string): string {
    // 简单的Markdown转HTML
    let html = markdown
      // 标题
      .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
      .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
      .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
      // 粗体和斜体
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // 列表
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // 代码块
      .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code>$2</code></pre>')
      // 行内代码
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // 段落
      .replace(/\n\n/g, '</p><p>')
      // 换行
      .replace(/\n/g, '<br/>')

    // 包裹在Word文档结构中
    return `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
body { font-family: "微软雅黑", sans-serif; line-height: 1.6; padding: 20px; }
h1 { font-size: 24px; margin: 20px 0 10px; }
h2 { font-size: 20px; margin: 18px 0 8px; }
h3 { font-size: 16px; margin: 15px 0 6px; }
p { margin: 10px 0; }
li { margin: 5px 0 5px 20px; }
pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
code { background: #f5f5f5; padding: 2px 6px; }
</style>
</head>
<body>
${html}
</body>
</html>`
  }
}
