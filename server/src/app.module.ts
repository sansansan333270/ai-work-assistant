import { Module } from '@nestjs/common'
import { AppController } from '@/app.controller'
import { AppService } from '@/app.service'
import { DownloadController } from './download.controller'
import { AiModule } from './modules/ai/ai.module'
import { NotesModule } from './modules/notes/notes.module'
import { MemoriesModule } from './modules/memories/memories.module'
import { SkillsModule } from './modules/skills/skills.module'
import { TtsModule } from './modules/tts/tts.module'
import { UploadModule } from './modules/upload/upload.module'
import { ImageModule } from './modules/image/image.module'
import { DocumentModule } from './modules/document/document.module'
import { SessionsModule } from './modules/sessions/sessions.module'
import { ProjectsModule } from './modules/projects/projects.module'

@Module({
  imports: [AiModule, NotesModule, MemoriesModule, SkillsModule, TtsModule, UploadModule, ImageModule, DocumentModule, SessionsModule, ProjectsModule],
  controllers: [AppController, DownloadController],
  providers: [AppService],
})
export class AppModule {}
