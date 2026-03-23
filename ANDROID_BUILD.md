# Android APK 构建指南

本项目已集成 Capacitor，可以打包为 Android APK，支持在鸿蒙系统和其他 Android 设备上运行。

## 📱 应用信息

- **应用名称**：AI工作助手
- **包名**：com.aiwork.assistant
- **支持系统**：Android 5.0+ / 鸿蒙系统

## 🚀 快速开始

### 方式一：使用 Android Studio 构建（推荐）

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **构建 H5 版本**
   ```bash
   pnpm build:web
   ```

3. **同步到 Android**
   ```bash
   pnpm cap:sync
   ```

4. **打开 Android Studio**
   ```bash
   pnpm cap:open:android
   ```

5. **在 Android Studio 中构建 APK**
   - 选择 `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - APK 文件位于：`android/app/build/outputs/apk/debug/app-debug.apk`

### 方式二：使用命令行构建

```bash
# 完整构建流程
pnpm android:build

# 进入 android 目录
cd android

# 构建 Debug APK
./gradlew assembleDebug

# 构建 Release APK（需要签名）
./gradlew assembleRelease
```

构建完成后：
- Debug APK：`android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK：`android/app/build/outputs/apk/release/app-release.apk`

## 🔐 应用签名（上架必需）

### 生成签名密钥

```bash
keytool -genkey -v -keystore aiwork-assistant.keystore \
  -alias aiwork-assistant \
  -keyalg RSA -keysize 2048 -validity 10000
```

### 配置签名

在 `android/app/build.gradle` 中添加：

```gradle
android {
    signingConfigs {
        release {
            storeFile file('../../aiwork-assistant.keystore')
            storePassword 'your-password'
            keyAlias 'aiwork-assistant'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## 🎨 自定义应用图标

1. 准备一张 1024x1024 的 PNG 图片
2. 使用在线工具生成图标：
   - [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)
   - [App Icon Generator](https://appicon.co/)
3. 将生成的图标文件放到 `android/app/src/main/res/` 目录下的相应文件夹：
   - `mipmap-mdpi` (48x48)
   - `mipmap-hdpi` (72x72)
   - `mipmap-xhdpi` (96x96)
   - `mipmap-xxhdpi` (144x144)
   - `mipmap-xxxhdpi` (192x192)

## 🔧 开发调试

### 热更新开发模式

```bash
# 启动前端开发服务器
pnpm dev:web

# 在另一个终端，启动 Android 模拟器或连接真机
cd android
./gradlew installDebug

# 在设备上打开应用
```

### 查看日志

```bash
# 查看 Android 日志
adb logcap | grep -i "AI工作助手"
```

## 📦 发布到应用市场

### 华为应用市场（鸿蒙）

1. 注册华为开发者账号
2. 创建应用并填写信息
3. 上传签名的 Release APK
4. 等待审核通过

### 其他应用市场

- **小米应用商店**：https://dev.mi.com/console/
- **OPPO 应用商店**：https://open.oppomobile.com/
- **vivo 应用商店**：https://dev.vivo.com.cn/
- **腾讯应用宝**：https://open.tencent.com/

## 🛠️ 常用命令

```bash
# 构建 H5 并同步到 Android
pnpm android:build

# 同步 Web 资源到 Android
pnpm cap:sync

# 打开 Android Studio
pnpm cap:open:android

# 仅构建 H5
pnpm build:web

# 完整构建（包含 lint、tsc、所有平台）
pnpm build
```

## 📋 权限说明

应用已申请以下权限：

- `INTERNET` - 网络访问
- `RECORD_AUDIO` - 录音（语音输入功能）
- `MODIFY_AUDIO_SETTINGS` - 修改音频设置
- `ACCESS_NETWORK_STATE` - 网络状态检测
- `VIBRATE` - 振动反馈

## 🐛 常见问题

### 1. Gradle 构建失败

```bash
# 清理构建缓存
cd android
./gradlew clean
./gradlew assembleDebug
```

### 2. 找不到 Android SDK

确保已安装 Android Studio 并配置环境变量：

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 3. 应用图标不显示

检查图标文件是否正确放置在 `mipmap-*` 文件夹中，并且文件名为 `ic_launcher.png`。

## 📚 相关文档

- [Capacitor 官方文档](https://capacitorjs.com/)
- [Taro 文档](https://taro-docs.jd.com/)
- [Android 应用签名](https://developer.android.com/studio/publish/app-signing)
- [华为开发者联盟](https://developer.huawei.com/)

## 🔄 更新应用

当你修改了前端代码后：

```bash
# 1. 重新构建 H5
pnpm build:web

# 2. 同步到 Android
pnpm cap:sync

# 3. 重新构建 APK
cd android && ./gradlew assembleDebug
```

---

**提示**：如果遇到问题，请检查 `android/` 目录下的 Gradle 配置和 AndroidManifest.xml 文件。
