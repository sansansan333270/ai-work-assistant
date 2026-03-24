# 我的工作助手

一个真正懂你的 AI 工作助手，具有记忆能力、多大模型支持、深度思考、语音对话等功能。

## 🎯 核心功能

### ✅ 已实现功能

1. **智能对话**
   - 主对话界面（豆包风格）
   - 多大模型选择（豆包、Kimi、DeepSeek、ChatGPT）
   - 深度思考模式（展示 AI 推理过程）
   - 语音对话功能（Web Speech API）
   - 主题切换（纯白/纯黑双主题）

2. **多大模型支持**
   - 豆包（字节跳动）- 免费
   - Kimi（Moonshot）- 免费，支持 20 万字长文本
   - DeepSeek（深度求索）- 免费，支持深度思考
   - ChatGPT-4（OpenAI）- 付费

3. **深度思考**
   - 快速模式：快速响应
   - 标准模式：平衡速度和质量
   - 深度思考：展示推理过程（DeepSeek 支持）

4. **语音对话**
   - 按住说话模式
   - 实时语音识别
   - 语音播放回复
   - 开车场景优化

5. **主题切换**
   - 浅色模式（纯白）
   - 深色模式（纯黑）
   - 平滑过渡动画
   - 夜间模式优化

### 🚧 开发中功能

- 知识库（文档上传和智能检索）
- 生图功能（集成你的生图 API）
- 文档工作台（Markdown 编辑器）
- PPT 工作台（AI 生成 PPT）
- AI 记忆系统（长期记忆和工作记忆）

## 🚀 快速开始

### 1. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的 API 密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# AI模型配置
DOUBAO_API_KEY=your_doubao_key_here
KIMI_API_KEY=your_kimi_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here
OPENAI_API_KEY=your_openai_key_here

# 生图API
IMAGE_API_URL=your_image_api_url_here
IMAGE_API_KEY=your_image_api_key_here

# 数据库配置
DATABASE_URL=your_database_url_here

# 应用配置
PROJECT_DOMAIN=http://localhost:5000
```

### 2. 启动开发服务器

```bash
coze dev
```

开发服务器会自动启动：
- 前端：http://localhost:5000
- 后端：http://localhost:3000

### 3. 构建生产版本

```bash
pnpm build
```

## 📱 平台支持

- ✅ H5（Web 应用）
- ✅ 微信小程序
- ✅ 抖音小程序
- ✅ **Android APK（支持鸿蒙系统）** 🆕
- ✅ 服务端（NestJS）

### 🤖 Android APK 构建说明

本项目支持打包为 Android APK，可以在鸿蒙系统和其他 Android 设备上运行。

#### 快速构建

```bash
# 方式一：使用构建脚本
./build-android.sh

# 方式二：手动构建
pnpm build:web      # 构建 H5 版本
pnpm cap:sync       # 同步到 Android
cd android
./gradlew assembleDebug  # 构建 APK
```

构建完成后，APK 文件位于：`android/app/build/outputs/apk/debug/app-debug.apk`

#### 详细文档

完整的构建、签名和发布指南请查看：[ANDROID_BUILD.md](./ANDROID_BUILD.md)

#### 主要特性

- 🎯 **鸿蒙系统兼容**：完美支持鸿蒙系统安装运行
- 🎤 **语音功能**：支持语音输入和播放
- 🌙 **双主题**：浅色/深色模式切换
- 📦 **离线支持**：核心功能可离线使用
- 🔐 **安全加密**：支持应用签名和加固

## 🎨 设计风格

采用豆包风格设计：
- 简洁现代的界面
- 圆角卡片设计
- 双主题支持（浅色/深色）
- 响应式布局（手机+电脑）
- 流畅的动画过渡

## 🛠️ 技术栈

### 前端
- Taro 4 + React
- TypeScript
- Tailwind CSS 4
- Zustand（状态管理）
- Lucide React Taro（图标）

### 后端
- NestJS
- TypeScript
- PostgreSQL（Supabase）
- 向量数据库（pgvector）

### AI 集成
- 多大模型支持（豆包/Kimi/DeepSeek/ChatGPT）
- Web Speech API（语音识别和合成）
- 生图 API（可自定义）

## 📁 项目结构

```
src/
├── app.tsx                      # 应用入口
├── app.config.ts                # 应用配置
├── app.css                      # 全局样式
├── config/                      # 配置文件
│   └── models.ts               # AI模型配置
├── store/                       # 状态管理
│   ├── theme.ts                # 主题状态
│   ├── models.ts               # 模型状态
│   └── chat.ts                 # 对话状态
├── components/                  # 组件
│   ├── ChatBubble.tsx          # 对话气泡
│   ├── ThinkingMessage.tsx     # 思考消息
│   ├── ModelSelector.tsx       # 模型选择器
│   ├── ChatModeSelector.tsx    # 对话模式选择器
│   ├── VoiceButton.tsx         # 语音按钮
│   └── Sidebar.tsx             # 侧边栏
└── pages/                       # 页面
    ├── index/                  # 主对话页
    ├── settings/               # 设置页
    ├── document/               # 文档工作台
    ├── ppt/                    # PPT工作台
    ├── image/                  # 生图工作台
    ├── knowledge/              # 知识库
    └── memory/                 # 我的记忆

server/
├── src/
│   ├── main.ts                 # 后端入口
│   ├── app.module.ts           # 应用模块
│   └── modules/
│       └── ai/
│           ├── ai.module.ts    # AI模块
│           ├── ai.controller.ts # AI控制器
│           └── ai.service.ts   # AI服务
└── package.json
```

## 🔧 配置说明

## 🔧 配置说明

### 🤖 AI 模型配置

**当前模式：Demo 模式（无需配置）**

项目已内置 Demo 模式，无需配置 API 密钥即可体验基础功能。

**配置真实AI模型（推荐）：**

```bash
# 方式一：使用配置助手
./setup-ai.sh

# 方式二：手动配置
# 在项目根目录创建 .env.local 文件
DEEPSEEK_API_KEY=sk-xxxxxxxx  # 推荐，性价比最高
KIMI_API_KEY=sk-xxxxxxxx      # 支持20万字长文本
DOUBAO_API_KEY=xxxxxxxx       # 字节跳动
OPENAI_API_KEY=sk-xxxxxxxx    # OpenAI
```

**支持的模型：**

| 模型 | 价格 | 特点 | 推荐指数 |
|------|------|------|----------|
| **DeepSeek** | 0.001元/千token | 支持深度思考、性价比高 | ⭐⭐⭐⭐⭐ |
| **Kimi** | 免费额度 | 支持20万字长文本 | ⭐⭐⭐⭐ |
| **豆包** | 部分免费 | 中文优化、响应快速 | ⭐⭐⭐⭐ |
| **ChatGPT-4** | $0.03/千token | 最强模型 | ⭐⭐⭐ |

详细配置指南：[AI_CONFIG.md](./AI_CONFIG.md)

### AI 模型配置

支持以下模型：

| 模型 | 提供商 | 价格 | 特点 |
|------|--------|------|------|
| 豆包 | 字节跳动 | 免费 | 支持长文本 |
| Kimi | Moonshot | 免费 | 支持20万字长文本 |
| DeepSeek | 深度求索 | 免费 | 支持深度思考 |
| ChatGPT-4 | OpenAI | 付费 | 最强模型 |

### 主题配置

支持两种主题：
- **浅色模式**：纯白背景，适合白天使用
- **深色模式**：纯黑背景，适合夜间使用

## 📖 使用指南

### 1. 选择模型
点击顶部模型名称，选择合适的模型：
- 简单问题：选择"快速"模式
- 复杂问题：选择"深度思考"模式（DeepSeek）

### 2. 语音对话
点击底部麦克风按钮：
- 按住说话
- 松开发送
- AI 自动语音回复

### 3. 切换主题
进入设置页面，切换浅色/深色模式

## 🔐 安全说明

- 所有 API 密钥存储在环境变量中
- 数据库使用 Supabase 托管
- 支持本地化部署
- 数据完全由用户控制

## 📝 开发计划

- [ ] 知识库功能
- [ ] 生图功能集成
- [ ] 文档工作台
- [ ] PPT 工作台
- [ ] AI 记忆系统
- [ ] 蓝牙设备优化
- [ ] 离线模式支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Taro](https://taro.zone/) - 多端统一框架
- [NestJS](https://nestjs.com/) - 后端框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Lucide](https://lucide.dev/) - 图标库
- [Zustand](https://github.com/pmndrs/zustand) - 状态管理
