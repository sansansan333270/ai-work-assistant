import { Injectable } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'

type AudioFormat = 'mp3' | 'pcm' | 'ogg_opus' | 'wav'
type SampleRate = 8000 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000

interface TTSOptions {
  text: string
  speaker?: string
  audioFormat?: AudioFormat
  sampleRate?: SampleRate
  speechRate?: number
  loudnessRate?: number
}

// 可用音色列表（火山引擎大模型音色）
const AVAILABLE_VOICES = [
  // 女声系列
  { id: 'zh_female_tianmeixiaoyuan_moon_bigtts', name: '天美小媛', description: '甜美温柔', gender: 'female' },
  { id: 'zh_female_wanwanxiaohe_moon_bigtts', name: '晚晚小荷', description: '温柔自然', gender: 'female' },
  { id: 'zh_female_chunhou_moon_bigtts', name: '淳厚', description: '沉稳大气', gender: 'female' },
  { id: 'zh_female_qingxinwenrou_moon_bigtts', name: '清新温柔', description: '清新自然', gender: 'female' },
  { id: 'zh_female_huoli_moon_bigtts', name: '活力', description: '活泼开朗', gender: 'female' },
  
  // 男声系列
  { id: 'zh_male_chunhou_moon_bigtts', name: '淳厚', description: '沉稳大气', gender: 'male' },
  { id: 'zh_male_qingxinwenrou_moon_bigtts', name: '清新温柔', description: '温柔自然', gender: 'male' },
  { id: 'zh_male_huoli_moon_bigtts', name: '活力', description: '阳光开朗', gender: 'male' },
  { id: 'zh_male_chenwen_moon_bigtts', name: '沉稳', description: '成熟稳重', gender: 'male' },
]

@Injectable()
export class TtsService {
  private readonly apiUrl = 'https://openspeech.bytedance.com/api/v1/tts'
  private readonly appId = process.env.VOLCENGINE_TTS_APPID || 'BigTTS2000000675148139330'
  private readonly token = process.env.VOLCENGINE_TTS_TOKEN || 'default-token'

  // 获取可用音色列表
  getVoices() {
    return AVAILABLE_VOICES
  }

  // 文本转语音
  async synthesize(options: TTSOptions) {
    const {
      text,
      speaker = 'zh_female_tianmeixiaoyuan_moon_bigtts',
      audioFormat = 'mp3',
      sampleRate = 24000,
      speechRate = 1.0,
      loudnessRate = 1.0,
    } = options

    try {
      const requestId = uuidv4()
      
      // 构建请求体
      const requestBody = {
        app: {
          appid: this.appId,
          token: this.token,
          cluster: 'volcano_tts',
        },
        user: {
          uid: 'default-user',
        },
        audio: {
          voice_type: speaker,
          encoding: audioFormat,
          speed_ratio: speechRate,
          loudness_ratio: loudnessRate,
          rate: sampleRate,
        },
        request: {
          reqid: requestId,
          text: text,
          operation: 'query',
        },
      }

      console.log('TTS Request:', JSON.stringify(requestBody, null, 2))

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer;${this.token}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('TTS API error:', errorText)
        return {
          success: false,
          error: `TTS API error: ${response.status}`,
        }
      }

      const data = await response.json()
      
      // 检查响应状态
      if (data.code !== 3000) {
        console.error('TTS synthesis failed:', data)
        return {
          success: false,
          error: data.message || '语音合成失败',
        }
      }

      // 返回 base64 编码的音频数据
      return {
        success: true,
        audioData: data.data, // base64 编码的音频
        audioUrl: `data:audio/${audioFormat};base64,${data.data}`,
      }
    } catch (error) {
      console.error('TTS synthesis error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '语音合成失败',
      }
    }
  }
}
