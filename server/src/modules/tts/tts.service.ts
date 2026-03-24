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

// 可用音色列表（仅保留经过验证的音色ID）
const AVAILABLE_VOICES = [
  // 女声系列
  { id: 'zh_female_xiaohe_uranus_bigtts', name: '小荷', description: '温柔自然', gender: 'female' },
  { id: 'zh_female_vv_uranus_bigtts', name: 'Vivi', description: '中英双语', gender: 'female' },
  { id: 'zh_female_xueayi_saturn_bigtts', name: '雪阿姨', description: '亲切温和', gender: 'female' },
  { id: 'zh_female_mizai_saturn_bigtts', name: '米仔', description: '活泼可爱', gender: 'female' },
  { id: 'zh_female_jitangnv_saturn_bigtts', name: '鸡汤女', description: '励志温暖', gender: 'female' },
  
  // 男声系列
  { id: 'zh_male_m191_uranus_bigtts', name: '云舟', description: '标准沉稳', gender: 'male' },
  { id: 'zh_male_taocheng_uranus_bigtts', name: '晓天', description: '年轻阳光', gender: 'male' },
  { id: 'zh_male_dayi_saturn_bigtts', name: '大一', description: '磁性有力', gender: 'male' },
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
