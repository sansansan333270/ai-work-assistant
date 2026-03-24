import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('download')
export class DownloadController {
  @Get('android')
  downloadAndroid(@Res() res: Response) {
    const filePath = path.join(__dirname, '../../ai-work-assistant-android.tar.gz');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', 'attachment; filename="ai-work-assistant-android.tar.gz"');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
