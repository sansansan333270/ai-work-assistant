import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { NotesService } from './notes.service'

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  // 创建笔记
  @Post()
  async createNote(@Body() body: {
    title: string
    content: string
    category?: string
    tags?: string
    sourceType: string
    sourceId?: string
    conversationContext?: string
  }) {
    return this.notesService.createNote({
      userId: 'default-user',
      ...body,
    })
  }

  // 从AI对话创建笔记
  @Post('from-chat')
  async createFromChat(@Body() body: {
    title: string
    content: string
    conversationContext?: string
    sourceId?: string
  }) {
    return this.notesService.createFromChat(body)
  }

  // 获取笔记列表
  @Get()
  async getNotes(@Query() query: {
    category?: string
    isStarred?: string
    isArchived?: string
    search?: string
    limit?: string
    offset?: string
  }) {
    return this.notesService.getNotes({
      category: query.category,
      isStarred: query.isStarred === 'true' ? true : query.isStarred === 'false' ? false : undefined,
      isArchived: query.isArchived === 'true' ? true : query.isArchived === 'false' ? false : undefined,
      search: query.search,
      limit: query.limit ? parseInt(query.limit) : 50,
      offset: query.offset ? parseInt(query.offset) : 0,
    })
  }

  // 获取笔记统计
  @Get('stats')
  async getStats() {
    return this.notesService.getStats()
  }

  // 获取单个笔记
  @Get(':id')
  async getNote(@Param('id') id: string) {
    return this.notesService.getNoteById(parseInt(id))
  }

  // 更新笔记
  @Put(':id')
  async updateNote(@Param('id') id: string, @Body() body: {
    title?: string
    content?: string
    category?: string
    tags?: string
  }) {
    return this.notesService.updateNote(parseInt(id), body)
  }

  // 切换收藏状态
  @Put(':id/star')
  async toggleStar(@Param('id') id: string) {
    return this.notesService.toggleStar(parseInt(id))
  }

  // 归档笔记
  @Put(':id/archive')
  async archiveNote(@Param('id') id: string) {
    return this.notesService.archiveNote(parseInt(id))
  }

  // 取消归档
  @Put(':id/unarchive')
  async unarchiveNote(@Param('id') id: string) {
    return this.notesService.unarchiveNote(parseInt(id))
  }

  // 删除笔记
  @Delete(':id')
  async deleteNote(@Param('id') id: string) {
    await this.notesService.deleteNote(parseInt(id))
    return { success: true }
  }
}
