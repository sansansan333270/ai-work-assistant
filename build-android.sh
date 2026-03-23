#!/bin/bash

# Android APK 快速构建脚本

echo "🚀 开始构建 Android APK..."
echo ""

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 1. 构建 H5 版本
echo "📦 正在构建 H5 版本..."
pnpm build:web
if [ $? -ne 0 ]; then
    echo "❌ H5 构建失败"
    exit 1
fi
echo "✅ H5 构建完成"
echo ""

# 2. 同步到 Android
echo "📱 正在同步到 Android..."
pnpm cap:sync
if [ $? -ne 0 ]; then
    echo "❌ 同步失败"
    exit 1
fi
echo "✅ 同步完成"
echo ""

# 3. 构建 APK
echo "🔧 正在构建 APK..."
cd android
./gradlew assembleDebug
if [ $? -ne 0 ]; then
    echo "❌ APK 构建失败"
    exit 1
fi
cd ..
echo "✅ APK 构建完成"
echo ""

# 4. 显示 APK 位置
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo "🎉 构建成功！"
    echo ""
    echo "📱 APK 文件位置: $APK_PATH"
    echo "📦 APK 文件大小: $APK_SIZE"
    echo ""
    echo "💡 提示："
    echo "   - 可以将 APK 文件传输到手机安装"
    echo "   - 鸿蒙系统完全兼容 Android 应用"
    echo "   - 首次安装需要开启'允许安装未知来源应用'"
else
    echo "⚠️  APK 文件未找到，请检查构建日志"
fi
