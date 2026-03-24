import { Injectable } from '@nestjs/common'

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

// 可用音色列表（保留用于未来扩展）
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
  // 获取可用音色列表
  getVoices() {
    return AVAILABLE_VOICES
  }

  // 文本转语音 - 暂时返回错误提示
  async synthesize(options: TTSOptions) {
    return {
      success: false,
      error: '语音合成功能暂未配置。如需使用，请配置火山引擎 TTS 服务或使用浏览器内置语音合成。',
    }
  }
}
