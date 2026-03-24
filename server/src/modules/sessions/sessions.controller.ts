import { Controller, Get, Post, Put, Delete, Body, Query, Param } from '@nestjs/common'
import { SessionsService, Message } from './sessions.service'

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  // 获取会话列表
  @Get()
  async getSessionList() {
    const sessions = await this.sessionsService.getSessionList()
    return {
      code: 200,
      msg: 'success',
      data: sessions,
    }
  }

  // 获取单个会话
  @Get(':id')
  async getSession(@Param('id') id: string) {
    const session = await this.sessionsService.getSession(Number(id))
    if (!session) {
      return {
        code: 404,
        msg: 'Session not found',
        data: null,
      }
    }
    return {
      code: 200,
      msg: 'success',
      data: session,
    }
  }

  // 创建新会话
  @Post()
  async createSession(@Body() body: {
    title?: string
    model?: string
    mode?: string
    messages?: Message[]
  }) {
    const session = await this.sessionsService.createSession(body)
    return {
      code: 200,
      msg: 'success',
      data: session,
    }
  }

  // 更新会话
  @Put(':id')
  async updateSession(
    @Param('id') id: string,
    @Body() body: {
      title?: string
      messages?: Message[]
      model?: string
      mode?: string
    }
  ) {
    const session = await this.sessionsService.updateSession(Number(id), body)
    return {
      code: 200,
      msg: 'success',
      data: session,
    }
  }

  // 删除会话
  @Delete(':id')
  async deleteSession(@Param('id') id: string) {
    await this.sessionsService.deleteSession(Number(id))
    return {
      code: 200,
      msg: 'success',
    }
  }

  // 清空所有会话
  @Delete()
  async clearAllSessions() {
    await this.sessionsService.clearAllSessions()
    return {
      code: 200,
      msg: 'success',
    }
  }
}
