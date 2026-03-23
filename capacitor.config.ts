import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.aiwork.assistant',
  appName: 'AI工作助手',
  webDir: 'dist-web',
  bundledWebRuntime: false,
  server: {
    // 开发环境可以指向本地服务器
    // url: 'http://localhost:5000',
    // cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keyAlias: undefined,
      keyPassword: undefined,
      signingType: 'apksigner'
    }
  },
  plugins: {
    // 可以在这里添加插件配置
  }
}

export default config
