# AI 大模型接入配置指南

本项目支持多个大模型，你可以根据需要选择接入。

## 🤖 支持的模型

| 模型 | 提供商 | 特点 | 价格 | 推荐指数 |
|------|--------|------|------|----------|
| **DeepSeek** | 深度求索 | 支持深度思考、性价比高 | 0.001元/千token | ⭐⭐⭐⭐⭐ |
| **Kimi** | Moonshot | 支持20万字长文本、免费额度 | 免费额度用完付费 | ⭐⭐⭐⭐ |
| **豆包** | 字节跳动 | 响应快速、中文优化 | 部分免费 | ⭐⭐⭐⭐ |
| **ChatGPT-4** | OpenAI | 最强模型、多语言支持 | $0.03/千token | ⭐⭐⭐ |

## 📝 配置步骤

### 方式一：配置单个模型（推荐新手）

#### 1. DeepSeek（推荐）

**获取API密钥：**
1. 访问 https://platform.deepseek.com/
2. 注册账号并登录
3. 点击右上角「API Keys」
4. 点击「创建新的API Key」
5. 复制生成的API密钥

**配置：**
在项目根目录创建 `.env.local` 文件，添加：

```bash
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```

**特点：**
- ✅ 支持深度思考模式
- ✅ 性价比极高（0.001元/千token）
- ✅ 新用户送免费额度
- ✅ 中文能力强

#### 2. Kimi

**获取API密钥：**
1. 访问 https://platform.moonshot.cn/
2. 注册账号并登录
3. 点击左侧「API Key管理」
4. 点击「创建新的API Key」
5. 复制生成的API密钥

**配置：**
```bash
KIMI_API_KEY=sk-xxxxxxxxxxxxxxxx
```

**特点：**
- ✅ 支持20万字长文本
- ✅ 新用户免费额度
- ✅ 文档处理能力强

#### 3. 豆包

**获取API密钥：**
1. 访问 https://console.volcengine.com/ark
2. 注册火山引擎账号
3. 创建推理接入点
4. 获取API密钥

**配置：**
```bash
DOUBAO_API_KEY=xxxxxxxxxxxxxxxx
```

**特点：**
- ✅ 字节跳动出品
- ✅ 中文优化
- ✅ 响应快速

#### 4. ChatGPT-4

**获取API密钥：**
1. 访问 https://platform.openai.com/
2. 注册OpenAI账号
3. 点击「API Keys」
4. 创建新的API密钥

**配置：**
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
```

**注意：** 需要海外信用卡或虚拟卡

### 方式二：配置多个模型

在 `.env.local` 中配置多个API密钥：

```bash
# DeepSeek（推荐）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

# Kimi
KIMI_API_KEY=sk-xxxxxxxxxxxxxxxx

# 豆包
DOUBAO_API_KEY=xxxxxxxxxxxxxxxx

# ChatGPT（可选）
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# 生图API（可选）
IMAGE_API_URL=https://api.example.com/generate
IMAGE_API_KEY=xxxxxxxxxxxxxxxx
```

## 🧪 测试配置

配置完成后，重启开发服务器：

```bash
cd /workspace/projects && coze dev
```

然后在前端界面：
1. 点击顶部模型名称
2. 选择已配置的模型
3. 发送消息测试

## 💡 推荐方案

### 方案一：个人使用（最省钱）
- **DeepSeek** 作为主力模型
- 成本：约1元/月（日常使用）

### 方案二：体验多个模型
- **DeepSeek** - 深度思考
- **Kimi** - 长文本处理
- **豆包** - 快速对话

### 方案三：企业使用
- **ChatGPT-4** - 最强模型
- **DeepSeek** - 性价比备选

## 🎯 使用建议

1. **首次使用**：推荐先配置 DeepSeek，体验深度思考功能
2. **长文本处理**：使用 Kimi，支持20万字上下文
3. **日常对话**：使用豆包，响应快速
4. **专业任务**：使用 ChatGPT-4

## 🔒 安全提示

1. ⚠️ **不要**将 `.env.local` 文件提交到 Git
2. ⚠️ **不要**在代码中硬编码API密钥
3. ⚠️ 定期更换API密钥
4. ⚠️ 监控API使用量，避免超额

## ❓ 常见问题

### Q: 配置后不生效？
A: 重启开发服务器：`coze dev`

### Q: 如何查看API使用量？
A: 登录对应平台的控制台查看

### Q: 没有海外信用卡怎么用ChatGPT？
A: 推荐使用 DeepSeek 或 Kimi，性价比更高

### Q: API调用失败？
A: 检查：
1. API密钥是否正确
2. 账户余额是否充足
3. 网络是否通畅

## 📚 相关文档

- [DeepSeek API文档](https://platform.deepseek.com/api-docs/)
- [Kimi API文档](https://platform.moonshot.cn/docs)
- [豆包 API文档](https://www.volcengine.com/docs/82379)
- [OpenAI API文档](https://platform.openai.com/docs)

---

**推荐**：如果不确定选哪个，建议先配置 **DeepSeek**，性价比最高且支持深度思考模式！
