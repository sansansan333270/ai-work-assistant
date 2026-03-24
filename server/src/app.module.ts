import { Module } from '@nestjs/common'
import { AppController } from '@/app.controller'
import { AppService } from '@/app.service'
import { AiModule } from './modules/ai/ai.module'
import { NotesModule } from './modules/notes/notes.module'
import { MemoriesModule } from './modules/memories/memories.module'

@Module({
  imports: [AiModule, NotesModule, MemoriesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
