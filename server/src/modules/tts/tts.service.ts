import { Injectable } from '@nestjs/common'
import { TTSClient, Config, APIError } from 'coze-coding-dev-sdk'

type AudioFormat = 'mp3' | 'pcm' | 'ogg_opus'
type SampleRate = 8000 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000

interface TTSOptions {
  text: string
  speaker?: string
  audioFormat?: AudioFormat
  sampleRate?: SampleRate
  speechRate?: number
  loudnessRate?: number
}

// 可用音色列表（按类型分组）
const AVAILABLE_VOICES = [
  // 女声系列
  { id: 'zh_female_xiaohe_uranus_bigtts', name: '小荷', description: '温柔自然', gender: 'female', category: 'standard' },
  { id: 'zh_female_vv_uranus_bigtts', name: 'Vivi', description: '中英双语', gender: 'female', category: 'standard' },
  { id: 'zh_female_xueayi_saturn_bigtts', name: '雪阿姨', description: '亲切温和', gender: 'female', category: 'story' },
  { id: 'zh_female_mizai_saturn_bigtts', name: '米仔', description: '活泼可爱', gender: 'female', category: 'video' },
  { id: 'zh_female_jitangnv_saturn_bigtts', name: '鸡汤女', description: '励志温暖', gender: 'female', category: 'video' },
  { id: 'saturn_zh_female_keainvsheng_tob', name: '可爱女生', description: '甜美活泼', gender: 'female', category: 'character' },
  { id: 'zh_female_qingxinwenrou_tob', name: '清新温柔', description: '轻柔舒缓', gender: 'female', category: 'character' },
  { id: 'zh_female_chenshuwenrou_tob', name: '沉稳温柔', description: '知性优雅', gender: 'female', category: 'character' },
  { id: 'zh_female_reqinghuopo_tob', name: '热情活泼', description: '活力四射', gender: 'female', category: 'character' },
  { id: 'zh_female_gaoguifengya_tob', name: '高贵风雅', description: '端庄大气', gender: 'female', category: 'character' },
  
  // 男声系列
  { id: 'zh_male_m191_uranus_bigtts', name: '云舟', description: '标准沉稳', gender: 'male', category: 'standard' },
  { id: 'zh_male_taocheng_uranus_bigtts', name: '晓天', description: '年轻阳光', gender: 'male', category: 'standard' },
  { id: 'zh_male_dayi_saturn_bigtts', name: '大一', description: '磁性有力', gender: 'male', category: 'video' },
  { id: 'saturn_zh_male_shuanglangshaonian_tob', name: '爽朗少年', description: '朝气蓬勃', gender: 'male', category: 'character' },
  { id: 'zh_male_chengshuwenrou_tob', name: '成熟温柔', description: '温暖可靠', gender: 'male', category: 'character' },
  { id: 'zh_male_chenwenzhiding_tob', name: '沉稳智慧', description: '从容淡定', gender: 'male', category: 'character' },
  { id: 'zh_male_reqingyangguang_tob', name: '热情阳光', description: '开朗自信', gender: 'male', category: 'character' },
  { id: 'zh_male_junlangqiaocui_tob', name: '俊朗帅气', description: '阳光帅气', gender: 'male', category: 'character' },
  
  // 特色音色
  { id: 'zh_male_dongyangzhen_tob', name: '东阳臻', description: '新闻播音', gender: 'male', category: 'professional' },
  { id: 'zh_female_yangguang_tob', name: '阳光', description: '活力满满', gender: 'female', category: 'character' },
]

@Injectable()
export class TtsService {
  private client: TTSClient

  constructor() {
    const config = new Config()
    this.client = new TTSClient(config)
  }

  // 获取可用音色列表
  getVoices() {
    return AVAILABLE_VOICES
  }

  // 文本转语音
  async synthesize(options: TTSOptions) {
    const {
      text,
      speaker = 'zh_female_xiaohe_uranus_bigtts',
      audioFormat = 'mp3',
      sampleRate = 24000,
      speechRate = 0,
      loudnessRate = 0,
    } = options

    try {
      const response = await this.client.synthesize({
        uid: `tts-${Date.now()}`,
        text,
        speaker,
        audioFormat,
        sampleRate,
        speechRate,
        loudnessRate,
      })

      return {
        success: true,
        audioUrl: response.audioUri,
      }
    } catch (error) {
      if (error instanceof APIError) {
        console.error('TTS API Error:', error.message, error.statusCode)
        return {
          success: false,
          error: error.message,
        }
      }
      throw error
    }
  }
}
