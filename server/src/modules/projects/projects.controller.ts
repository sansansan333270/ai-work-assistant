import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { ProjectsService } from './projects.service'
import type { NewProject } from '@/database/schema'

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // 创建项目
  @Post()
  async create(@Body() body: {
    name: string
    type: string
    description?: string
    settings?: Record<string, any>
    outline?: Record<string, any>
    writingStyle?: Record<string, any>
  }) {
    return this.projectsService.createProject({
      userId: 'default-user',
      name: body.name,
      type: body.type || 'other',
      description: body.description || '',
      settings: body.settings ? JSON.stringify(body.settings) : '{}',
      outline: body.outline ? JSON.stringify(body.outline) : '{}',
      writingStyle: body.writingStyle ? JSON.stringify(body.writingStyle) : '{}',
      status: 'active',
    })
  }

  // 获取项目列表
  @Get()
  async findAll(@Query() query: {
    type?: string
    status?: string
    search?: string
    limit?: string
    offset?: string
  }) {
    return this.projectsService.getProjects({
      type: query.type,
      status: query.status,
      search: query.search,
      limit: query.limit ? parseInt(query.limit) : 50,
      offset: query.offset ? parseInt(query.offset) : 0,
    })
  }

  // 获取项目统计
  @Get('stats')
  async getStats() {
    return this.projectsService.getStats()
  }

  // 获取单个项目
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectsService.getProjectById(parseInt(id))
  }

  // 获取项目上下文（用于 AI）
  @Get(':id/context')
  async getContext(@Param('id') id: string) {
    return this.projectsService.getProjectContext(parseInt(id))
  }

  // 更新项目
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<NewProject>) {
    return this.projectsService.updateProject(parseInt(id), body)
  }

  // 更新项目进度
  @Put(':id/progress')
  async updateProgress(@Param('id') id: string, @Body() body: { progress: string }) {
    return this.projectsService.updateProgress(parseInt(id), body.progress)
  }

  // 更新项目设定
  @Put(':id/settings')
  async updateSettings(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.projectsService.updateSettings(parseInt(id), body)
  }

  // 更新项目大纲
  @Put(':id/outline')
  async updateOutline(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.projectsService.updateOutline(parseInt(id), body)
  }

  // 更新写作风格
  @Put(':id/style')
  async updateStyle(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.projectsService.updateWritingStyle(parseInt(id), body)
  }

  // 更新项目状态
  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.projectsService.updateProject(parseInt(id), { status: body.status })
  }

  // 删除项目
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.projectsService.deleteProject(parseInt(id))
    return { success: true }
  }
}
