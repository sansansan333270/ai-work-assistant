#!/bin/bash

# AI 模型配置助手

echo "🤖 AI 模型配置助手"
echo "=================="
echo ""

# 检查 .env.local 是否存在
if [ -f ".env.local" ]; then
  echo "✅ 发现现有配置文件 .env.local"
  echo ""
  echo "当前配置："
  grep "_API_KEY" .env.local 2>/dev/null | sed 's/=.*/=***/' || echo "  无API密钥配置"
  echo ""
  read -p "是否要更新配置？(y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消配置"
    exit 0
  fi
fi

echo ""
echo "请选择要配置的模型："
echo "1) DeepSeek (推荐，性价比最高)"
echo "2) Kimi (支持20万字长文本)"
echo "3) 豆包 (字节跳动)"
echo "4) ChatGPT-4 (OpenAI)"
echo "5) 配置多个模型"
echo "0) 跳过配置"
echo ""
read -p "请输入选项 (0-5): " choice

case $choice in
  1)
    echo ""
    echo "📚 DeepSeek 配置指南："
    echo "1. 访问 https://platform.deepseek.com/"
    echo "2. 注册并登录"
    echo "3. 点击右上角「API Keys」"
    echo "4. 创建新的API Key"
    echo ""
    read -p "请输入 DeepSeek API Key: " api_key
    if [ -n "$api_key" ]; then
      echo "DEEPSEEK_API_KEY=$api_key" >> .env.local
      echo "✅ DeepSeek 配置成功！"
    fi
    ;;
  2)
    echo ""
    echo "📚 Kimi 配置指南："
    echo "1. 访问 https://platform.moonshot.cn/"
    echo "2. 注册并登录"
    echo "3. 点击左侧「API Key管理」"
    echo "4. 创建新的API Key"
    echo ""
    read -p "请输入 Kimi API Key: " api_key
    if [ -n "$api_key" ]; then
      echo "KIMI_API_KEY=$api_key" >> .env.local
      echo "✅ Kimi 配置成功！"
    fi
    ;;
  3)
    echo ""
    echo "📚 豆包 配置指南："
    echo "1. 访问 https://console.volcengine.com/ark"
    echo "2. 注册火山引擎账号"
    echo "3. 创建推理接入点"
    echo "4. 获取API密钥"
    echo ""
    read -p "请输入 豆包 API Key: " api_key
    if [ -n "$api_key" ]; then
      echo "DOUBAO_API_KEY=$api_key" >> .env.local
      echo "✅ 豆包 配置成功！"
    fi
    ;;
  4)
    echo ""
    echo "📚 ChatGPT-4 配置指南："
    echo "1. 访问 https://platform.openai.com/"
    echo "2. 注册OpenAI账号"
    echo "3. 点击「API Keys」"
    echo "4. 创建新的API密钥"
    echo ""
    echo "⚠️  注意：需要海外信用卡"
    read -p "请输入 OpenAI API Key: " api_key
    if [ -n "$api_key" ]; then
      echo "OPENAI_API_KEY=$api_key" >> .env.local
      echo "✅ ChatGPT-4 配置成功！"
    fi
    ;;
  5)
    echo ""
    echo "📚 配置多个模型"
    echo ""
    read -p "DeepSeek API Key (回车跳过): " key1
    [ -n "$key1" ] && echo "DEEPSEEK_API_KEY=$key1" >> .env.local
    
    read -p "Kimi API Key (回车跳过): " key2
    [ -n "$key2" ] && echo "KIMI_API_KEY=$key2" >> .env.local
    
    read -p "豆包 API Key (回车跳过): " key3
    [ -n "$key3" ] && echo "DOUBAO_API_KEY=$key3" >> .env.local
    
    read -p "OpenAI API Key (回车跳过): " key4
    [ -n "$key4" ] && echo "OPENAI_API_KEY=$key4" >> .env.local
    
    echo "✅ 多模型配置完成！"
    ;;
  0)
    echo ""
    echo "💡 提示："
    echo "  - 当前运行在Demo模式下"
    echo "  - 可以随时运行此脚本配置API密钥"
    echo "  - 配置文件位置：.env.local"
    exit 0
    ;;
  *)
    echo "❌ 无效选项"
    exit 1
    ;;
esac

echo ""
echo "🎉 配置完成！"
echo ""
echo "下一步："
echo "  1. 重启开发服务器: coze dev"
echo "  2. 在前端选择已配置的模型"
echo "  3. 开始对话测试"
echo ""
echo "📚 查看完整文档: AI_CONFIG.md"
