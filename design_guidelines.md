# 设计指南 - 我的工作助手

## 品牌定位

**应用定位**：有记忆的AI工作助手，真正懂你的智能伙伴

**设计风格**：极简纯粹、黑白灰绿、现代高级

**目标用户**：追求效率的个人用户，需要AI助手协助工作、学习和日常事务

**设计哲学**：
- 极简至上，只保留黑、白、灰、浅绿四色
- 高级感设计，去除一切多余装饰
- 深色/浅色双主题，完美适配
- 动效流畅自然，提升交互体验

---

## 配色方案

### 核心原则：只使用四种颜色

- **黑色** `#000000` - 深色模式背景、浅色模式文字
- **白色** `#FFFFFF` - 浅色模式背景、深色模式文字
- **灰色** - 边框、分割线、次要文字
- **浅绿** `#22C55E` - 唯一的强调色，用于按钮、链接、选中状态

### 浅色模式（默认）

```css
/* 主色调 */
--background: #FFFFFF;        /* 页面背景 */
--foreground: #000000;        /* 主文字 */
--primary: #22C55E;           /* 浅绿 - 强调色 */

/* 灰度 */
--surface: #F5F5F5;           /* 次背景 */
--border: #E5E5E5;            /* 边框 */
--muted: #8C8C8C;             /* 次要文字 */
--placeholder: #BFBFBF;       /* 占位符 */
```

### 深色模式

```css
/* 主色调 */
--background: #000000;        /* 纯黑背景 */
--foreground: #FFFFFF;        /* 纯白文字 */
--primary: #22C55E;           /* 浅绿 - 强调色 */

/* 灰度 */
--surface: #1A1A1A;           /* 次背景 */
--border: #2A2A2A;            /* 边框 */
--muted: #888888;             /* 次要文字 */
--placeholder: #555555;       /* 占位符 */
```

### Tailwind 类名映射

```css
/* 浅色模式 */
bg-white text-black           /* 主背景/主文字 */
bg-gray-100                   /* 次背景 */
text-gray-500                 /* 次文字 */
border-gray-200               /* 边框 */
bg-green-500 text-white       /* 强调按钮 */
text-green-500                /* 强调链接 */

/* 深色模式 */
dark:bg-black dark:text-white /* 主背景/主文字 */
dark:bg-gray-900              /* 次背景 */
dark:text-gray-400            /* 次文字 */
dark:border-gray-800          /* 边框 */
dark:bg-green-500             /* 强调按钮 */
```

### 颜色使用规则

1. **禁止使用**：蓝色、红色、紫色、橙色等非指定颜色
2. **唯一例外**：错误状态可使用 `#EF4444`（红色）
3. **选中/激活状态**：统一使用浅绿 `#22C55E`
4. **图标颜色**：主色(#000/#FFF)或灰色(#8C8C8C/#888888)

---

## 字体规范

**字体层级**
- H1 (页面标题): `text-2xl font-bold`
- H2 (区域标题): `text-xl font-semibold`
- H3 (卡片标题): `text-lg font-medium`
- Body (正文): `text-base`
- Caption (辅助): `text-sm`

---

## 间距系统

**页面边距**: `px-4` (16px)
**卡片内边距**: `p-4` (16px)
**列表间距**: `gap-3` (12px)
**组件间距**: `mb-4` (16px)

---

## 组件使用原则

### 组件选型约束

**通用UI组件优先使用 `@/components/ui/*`**

- **按钮**: `@/components/ui/button`
- **输入框**: `@/components/ui/input`
- **对话框**: `@/components/ui/dialog`
- **卡片**: `@/components/ui/card`
- **标签**: `@/components/ui/tabs`
- **提示**: `@/components/ui/toast`

**禁止行为**：
- ❌ 使用 `View/Text` 手搓按钮、输入框等通用UI组件
- ❌ 使用蓝色、紫色等非指定颜色

---

## 圆角规范

- 卡片: `rounded-2xl` (16px)
- 按钮: `rounded-xl` (12px)
- 标签: `rounded-full` (9999px)

---

## 动效设计

### 动画原则

- **自然流畅**：使用 ease-out 曲线，避免生硬
- **快速响应**：动画时长 200-300ms
- **有意义**：每个动画都要服务于交互反馈

### 标准动画

```css
/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 从下滑入 */
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* 缩放弹入 */
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* 脉冲 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### 交互反馈

- **点击**: `active:opacity-60` 或 `active:scale-95`
- **悬停**: `hover:opacity-80`（桌面端）
- **过渡**: `transition-all duration-200`

---

## 底部输入区域规范

### 布局结构

```
┌─────────────────────────────┐
│ 🎤 [输入框/提示文字]    发送 │  ← 上排：输入区
├─────────────────────────────┤
│ 快速 ▼ │ 技能 生图 文档  +  │  ← 下排：功能按钮（更扁）
└─────────────────────────────┘
```

### 尺寸规范

- 上排高度: `py-3` (12px上下)
- 下排高度: `py-1.5` (6px上下) - **更扁**
- 按钮间距: `gap-2` (8px) - **留空更少**
- 按钮内边距: `px-2 py-1` - **紧凑**

---

## 模式/标签描述规范

### 对话模式

| 模式 | 标签 | 描述 |
|------|------|------|
| 快速 | 快速响应 | 适合日常对话，秒级响应，简洁高效 |
| 标准 | 标准回答 | 平衡速度与质量，适合大多数场景 |
| 深度 | 深度思考 | 展示完整推理过程，适合复杂问题 |

### 生图分辨率

| 分辨率 | 标签 | 描述 |
|--------|------|------|
| 1K | 快速生成 | 1024×1024，适合快速预览和测试 |
| 2K | 高清画质 | 2048×2048，适合社交媒体分享 |
| 4K | 超高清 | 4096×4096，适合打印和大屏展示 |

### 文档类型

| 类型 | 标签 | 描述 |
|------|------|------|
| 报告 | 专业报告 | 数据分析、项目汇报、调研报告 |
| 方案 | 实施方案 | 项目规划、活动策划、解决方案 |
| 总结 | 工作总结 | 周报月报、项目总结、学习笔记 |
| 自由 | 自由格式 | 不限格式，自由发挥 |

---

## 状态展示

### 空状态

```tsx
<View className="flex flex-col items-center justify-center py-12">
  <Icon size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
  <Text className="text-gray-500 dark:text-gray-500 mb-4">暂无内容</Text>
</View>
```

### 加载状态

```tsx
<View className="flex items-center gap-2 text-gray-500">
  <Loader2 size={16} className="animate-spin" />
  <Text>正在处理...</Text>
</View>
```

---

## 深色模式检查清单

每个页面必须检查以下元素：

- [ ] 页面背景: `bg-white dark:bg-black`
- [ ] 主文字: `text-black dark:text-white`
- [ ] 次文字: `text-gray-500 dark:text-gray-400`
- [ ] 次背景: `bg-gray-100 dark:bg-gray-900`
- [ ] 边框: `border-gray-200 dark:border-gray-800`
- [ ] 卡片背景: `bg-white dark:bg-gray-900`
- [ ] 输入框背景: `bg-gray-50 dark:bg-gray-800`
- [ ] 分割线: `bg-gray-200 dark:bg-gray-800`

---

## 总结

**设计原则**：
1. 四色原则：黑、白、灰、浅绿
2. 极简至上，去除多余装饰
3. 动效流畅，提升交互体验
4. 深浅双主题，完美适配

**禁止行为**：
- ❌ 使用蓝色、紫色等非指定颜色
- ❌ 过度装饰和花哨效果
- ❌ 动画生硬、缺乏过渡
- ❌ 深色模式露白

**必须遵守**：
- ✅ 深浅模式双适配
- ✅ 浅绿作为唯一强调色
- ✅ 流畅自然的动画效果
- ✅ 丰富的标签描述文案
