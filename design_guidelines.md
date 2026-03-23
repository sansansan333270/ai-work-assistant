# 设计指南 - 我的工作助手

## 品牌定位

**应用定位**：有记忆的AI工作助手，真正懂你的智能伙伴

**设计风格**：简洁现代、功能实用、体验流畅

**目标用户**：追求效率的个人用户，需要AI助手协助工作、学习和日常事务

**设计哲学**：
- 简洁至上，去除一切多余元素
- 豆包风格，现代感与实用性并重
- 深色/浅色双主题，适应不同场景
- 语音优先，开车等场景也能使用

---

## 配色方案

### 浅色模式（默认）

**主色调**
- Primary Blue: `#1890FF` - 主要按钮、用户消息、链接
- Background: `#FFFFFF` - 页面背景
- Surface: `#F7F7F8` - AI消息卡片、输入框背景

**文字颜色**
- Primary Text: `#1F1F1F` - 主要文字
- Secondary Text: `#8C8C8C` - 次要文字、说明文字
- Placeholder: `#BFBFBF` - 占位符文字

**边框与分割**
- Border: `#E5E5E5` - 边框
- Divider: `#F0F0F0` - 分割线

**语义色**
- Success: `#52C41A` - 成功状态
- Warning: `#FAAD14` - 警告状态
- Error: `#FF4D4F` - 错误状态
- Info: `#1890FF` - 信息提示

### 深色模式

**主色调**
- Primary Blue: `#1890FF` - 保持不变
- Background: `#000000` - 纯黑背景
- Surface: `#1A1A1A` - 深灰背景，用于AI消息卡片

**文字颜色**
- Primary Text: `#FFFFFF` - 纯白文字
- Secondary Text: `#A0A0A0` - 浅灰文字
- Placeholder: `#666666` - 灰色占位符

**边框与分割**
- Border: `#2A2A2A` - 深灰边框
- Divider: `#1F1F1F` - 分割线

### Tailwind 类名映射

```css
/* 浅色模式 */
bg-white                    /* 主背景 */
bg-gray-100                 /* 次背景 */
text-black                   /* 主文字 */
text-gray-500                /* 次文字 */
border-gray-200              /* 边框 */

/* 深色模式 */
dark:bg-black               /* 主背景 */
dark:bg-gray-900            /* 次背景 */
dark:text-white             /* 主文字 */
dark:text-gray-400          /* 次文字 */
dark:border-gray-800        /* 边框 */

/* 主题色（不变） */
bg-blue-500                 /* 主要按钮 */
text-blue-500               /* 链接 */
```

---

## 字体规范

**字体层级**
- H1 (页面标题): `text-2xl font-bold` (24px)
- H2 (区域标题): `text-xl font-semibold` (20px)
- H3 (卡片标题): `text-lg font-medium` (18px)
- Body (正文): `text-base font-regular` (16px)
- Caption (辅助): `text-sm font-regular` (14px)

**行高**
- 标题: `leading-tight` (1.25)
- 正文: `leading-normal` (1.5)
- 辅助: `leading-relaxed` (1.625)

---

## 间距系统

**页面边距**
- 移动端: `px-4` (16px)
- 桌面端: `px-6` (24px)

**卡片内边距**
- 标准卡片: `p-4` (16px)
- 紧凑卡片: `p-3` (12px)
- 宽松卡片: `p-6` (24px)

**列表间距**
- 标准间距: `gap-4` (16px)
- 紧凑间距: `gap-2` (8px)
- 宽松间距: `gap-6` (24px)

**组件间距**
- 对话气泡间距: `mb-4` (16px)
- 卡片间距: `mb-6` (24px)
- 区域间距: `mb-8` (32px)

---

## 组件使用原则

### 组件选型约束

**通用UI组件优先使用 `@/components/ui/*`**

- **按钮**: 使用 `@/components/ui/button` 的 `Button` 组件
- **输入框**: 使用 `@/components/ui/input` 的 `Input` 组件
- **对话框**: 使用 `@/components/ui/dialog` 的 `Dialog` 组件
- **卡片**: 使用 `@/components/ui/card` 的 `Card` 组件
- **标签**: 使用 `@/components/ui/tabs` 的 `Tabs` 组件
- **提示**: 使用 `@/components/ui/toast` 的 `Toast` 组件
- **徽章**: 使用 `@/components/ui/badge` 的 `Badge` 组件
- **选择器**: 使用 `@/components/ui/select` 的 `Select` 组件
- **开关**: 使用 `@/components/ui/switch` 的 `Switch` 组件

**仅在以下情况使用 `@tarojs/components` 原生组件：**
- 页面结构容器 (`View`, `ScrollView`)
- 文本显示 (`Text`)
- 图片显示 (`Image`)
- 其他特殊功能组件（如 `Camera`, `Canvas` 等）

**禁止行为：**
- ❌ 使用 `View/Text` 手搓按钮、输入框、对话框等通用UI组件
- ❌ 在页面中重复实现已有组件库的功能

### 页面开发流程

1. **UI拆分**：先判断页面需要哪些UI单元（按钮、输入框、卡片等）
2. **组件映射**：每个UI单元优先映射到 `@/components/ui/*`
3. **组合实现**：使用组件库搭建页面结构
4. **样式调整**：通过 Tailwind 类名微调样式

---

## 圆角规范

**大圆角**
- 卡片: `rounded-2xl` (16px)
- 对话气泡: `rounded-2xl` (16px)

**中圆角**
- 按钮: `rounded-xl` (12px)
- 输入框: `rounded-xl` (12px)

**小圆角**
- 标签: `rounded-lg` (8px)
- 徽章: `rounded-full` (9999px)

---

## 阴影规范

**卡片阴影**
- 浅色模式: `shadow-sm`
- 深色模式: 无阴影（使用边框替代）

**悬浮阴影**
- 弹窗: `shadow-xl`
- 下拉菜单: `shadow-2xl`

---

## 导航结构

### 页面路由

```
/ (首页)              - 主对话页面
/document             - 文档工作台
/ppt                  - PPT工作台
/image                - 生图工作台
/knowledge            - 知识库
/memory               - 我的记忆
/settings             - 设置
```

### 侧边栏菜单

```
🗣️ 智能对话           - 主对话页面
📄 文档工作台         - 文档编辑
📊 PPT工作台          - PPT编辑
🖼️ 生图工作台         - AI生图
📚 知识库             - 文档管理
💾 我的记忆           - 记忆管理
⚙️ 设置              - 系统设置
```

---

## 状态展示原则

### 空状态

**设计要点**：
- 居中显示图标和提示文字
- 提供明确的操作指引
- 使用 `@/components/ui/skeleton` 展示加载态

**示例**：
```tsx
<View className="flex flex-col items-center justify-center py-12">
  <Icon size={48} className="text-gray-300 mb-4" />
  <Text className="text-gray-500 mb-4">暂无内容</Text>
  <Button variant="outline">添加内容</Button>
</View>
```

### 加载状态

**使用骨架屏**：
```tsx
import { Skeleton } from '@/components/ui/skeleton'

<View className="space-y-4">
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
</View>
```

### 对话加载

**显示思考中...**：
```tsx
<View className="flex items-center gap-2 text-gray-500">
  <Loader2 size={16} className="animate-spin" />
  <Text>正在思考...</Text>
</View>
```

---

## 小程序约束

### 包体积限制

**优化策略**：
- 使用 Taro 按需加载
- 图片使用 CDN 或对象存储
- 避免引入大型第三方库

### 图片策略

**图片处理**：
- 用户上传的图片存对象存储
- 使用缩略图显示
- 懒加载优化性能

### 性能优化

**关键点**：
- 避免频繁 `setState`
- 使用虚拟列表处理长列表
- 图片懒加载
- 防抖节流处理输入

---

## 特殊功能设计

### 语音对话

**界面设计**：
- 超大语音按钮（56px）
- 实时语音识别反馈
- 音波动画展示
- 免提模式切换

**安全考虑**：
- 开车场景优化
- 蓝牙设备适配
- 夜间模式自动切换

### 深度思考

**展示方式**：
- 紫色主题区分
- 可折叠卡片
- 思考过程逐步展示
- 推理逻辑清晰呈现

### 多模型选择

**界面设计**：
- 顶部模型切换器
- 模型特性标签（免费/付费、深度思考等）
- 下拉菜单快速切换
- 当前模型高亮显示

---

## 响应式设计

### 断点设置

- 移动端: `< 768px`
- 桌面端: `>= 768px`

### 布局差异

**移动端**：
- 单列布局
- 底部固定输入框
- 侧滑菜单

**桌面端**：
- 左右分栏布局
- 固定侧边栏
- 更宽松的间距

---

## 动效设计

**页面切换**：
- 右滑进入/左滑退出 (300ms)

**对话气泡**：
- 渐入动画 (200ms)

**主题切换**：
- 平滑过渡 (300ms)

**语音按钮**：
- 按下缩放效果 (100ms)

**音波动画**：
- 循环动画

---

## 无障碍设计

- 按钮和链接有明确的可点击区域
- 文字对比度符合 WCAG 标准
- 支持键盘导航（桌面端）
- 图标配有文字说明

---

## 总结

**设计原则**：
1. 简洁至上，去除冗余
2. 功能优先，体验流畅
3. 组件复用，保持一致
4. 双主题适配，场景优化
5. 性能优先，体验流畅

**禁止行为**：
- ❌ 过度装饰和花哨效果
- ❌ 重复造轮子，不使用组件库
- ❌ 忽视性能优化
- ❌ 硬编码 px 值，不使用 Tailwind

**必须遵守**：
- ✅ 优先使用 `@/components/ui/*`
- ✅ 使用 Tailwind 类名
- ✅ 双主题适配
- ✅ 响应式设计
