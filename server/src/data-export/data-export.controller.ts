import { Controller, Get, Res } from '@nestjs/common'
import { Response } from 'express'
import { DataExportService } from './data-export.service'

@Controller('data-export')
export class DataExportController {
  constructor(private readonly dataExportService: DataExportService) {}

  /**
   * 导出所有用户数据为 JSON 文件
   */
  @Get('json')
  async exportToJson(@Res() res: Response) {
    const data = await this.dataExportService.exportAllData()
    
    // 设置响应头，触发浏览器下载
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `ai-assistant-data-${timestamp}.json`
    
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(JSON.stringify(data, null, 2))
  }

  /**
   * 获取数据统计信息
   */
  @Get('stats')
  async getStats() {
    return this.dataExportService.getDataStats()
  }
}
