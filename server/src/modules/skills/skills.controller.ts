import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { SkillsService } from './skills.service'
import { CreateSkillDto, UpdateSkillDto } from './skills.dto'

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  async findAll(@Query('userId') userId?: string) {
    const skills = await this.skillsService.findAll(userId)
    return { code: 200, data: skills }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('userId') userId?: string) {
    const skill = await this.skillsService.findOne(Number(id), userId)
    if (!skill) {
      return { code: 404, msg: '技能不存在' }
    }
    return { code: 200, data: skill }
  }

  @Post()
  async create(@Body() createSkillDto: CreateSkillDto) {
    const skill = await this.skillsService.create({
      ...createSkillDto,
      userId: createSkillDto.userId || 'default-user',
    })
    return { code: 200, data: skill, msg: '技能创建成功' }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto, @Query('userId') userId?: string) {
    const skill = await this.skillsService.update(Number(id), updateSkillDto, userId)
    if (!skill) {
      return { code: 404, msg: '技能不存在或无权限' }
    }
    return { code: 200, data: skill, msg: '技能更新成功' }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Query('userId') userId?: string) {
    const success = await this.skillsService.remove(Number(id), userId)
    if (!success) {
      return { code: 404, msg: '技能不存在或无权限' }
    }
    return { code: 200, msg: '技能删除成功' }
  }

  @Post(':id/use')
  async useSkill(@Param('id') id: string, @Query('userId') userId?: string) {
    const skill = await this.skillsService.incrementUsage(Number(id), userId)
    if (!skill) {
      return { code: 404, msg: '技能不存在' }
    }
    return { code: 200, data: skill }
  }
}
