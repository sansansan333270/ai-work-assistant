import { Module } from '@nestjs/common'
import { AppController } from '@/app.controller'
import { AppService } from '@/app.service'
import { AiModule } from './modules/ai/ai.module'
import { NotesModule } from './modules/notes/notes.module'
import { MemoriesModule } from './modules/memories/memories.module'
import { SkillsModule } from './modules/skills/skills.module'
import { TtsModule } from './modules/tts/tts.module'

@Module({
  imports: [AiModule, NotesModule, MemoriesModule, SkillsModule, TtsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
