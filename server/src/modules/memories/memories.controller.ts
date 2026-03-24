import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { MemoriesService } from './memories.service'

@Controller('memories')
export class MemoriesController {
  constructor(private readonly memoriesService: MemoriesService) {}

  // 创建记忆
  @Post()
  async createMemory(@Body() body: {
    type: string
    key: string
    value: string
    importance?: number
    source?: string
  }) {
    return this.memoriesService.createMemory({
      userId: 'default-user',
      ...body,
    })
  }

  // 批量创建记忆
  @Post('batch')
  async createMemories(@Body() body: Array<{
    type: string
    key: string
    value: string
    importance?: number
    source?: string
  }>) {
    return this.memoriesService.createMemories(
      body.map(m => ({ userId: 'default-user', ...m }))
    )
  }

  // 提取并保存记忆
  @Post('extract')
  async extractMemory(@Body() body: {
    type: string
    key: string
    value: string
    source?: string
    importance?: number
  }) {
    return this.memoriesService.extractAndSaveMemory(body)
  }

  // 获取记忆列表
  @Get()
  async getMemories(@Query() query: {
    type?: string
    isActive?: string
    search?: string
    limit?: string
    offset?: string
  }) {
    return this.memoriesService.getMemories({
      type: query.type,
      isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
      search: query.search,
      limit: query.limit ? parseInt(query.limit) : 100,
      offset: query.offset ? parseInt(query.offset) : 0,
    })
  }

  // 获取相关记忆
  @Get('relevant')
  async getRelevantMemories(@Query('context') context: string, @Query('limit') limit?: string) {
    return this.memoriesService.getRelevantMemories(
      context,
      limit ? parseInt(limit) : 10
    )
  }

  // 获取记忆统计
  @Get('stats')
  async getStats() {
    return this.memoriesService.getStats()
  }

  // 获取单个记忆
  @Get(':id')
  async getMemory(@Param('id') id: string) {
    return this.memoriesService.getMemoryById(parseInt(id))
  }

  // 更新记忆
  @Put(':id')
  async updateMemory(@Param('id') id: string, @Body() body: {
    key?: string
    value?: string
    importance?: number
  }) {
    return this.memoriesService.updateMemory(parseInt(id), body)
  }

  // 激活/停用记忆
  @Put(':id/toggle')
  async toggleActive(@Param('id') id: string) {
    return this.memoriesService.toggleActive(parseInt(id))
  }

  // 记录访问
  @Put(':id/access')
  async recordAccess(@Param('id') id: string) {
    await this.memoriesService.recordAccess(parseInt(id))
    return { success: true }
  }

  // 删除记忆
  @Delete(':id')
  async deleteMemory(@Param('id') id: string) {
    await this.memoriesService.deleteMemory(parseInt(id))
    return { success: true }
  }
}
