# AI 工作助手 - 火山引擎部署指南

## 服务器信息
- IP: 14.103.105.198
- 系统: Ubuntu 20.04
- 配置: 2核4G

## 一、连接服务器

### Windows 用户
使用 PowerShell 或 CMD：
```bash
ssh root@14.103.105.198
```
输入密码（输入时不会显示，直接输完按回车）

### Mac 用户
打开终端：
```bash
ssh root@14.103.105.198
```

## 二、一键部署脚本

连接成功后，直接复制粘贴以下命令：

```bash
# 创建部署脚本
cat > deploy.sh << 'EOF'
#!/bin/bash

echo "=========================================="
echo "  AI 工作助手 - 一键部署脚本"
echo "=========================================="

# 更新系统
echo "[1/7] 更新系统..."
apt update && apt upgrade -y

# 安装 Node.js 18
echo "[2/7] 安装 Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 安装 pnpm
echo "[3/7] 安装 pnpm..."
npm install -g pnpm

# 安装 pm2（进程管理）
echo "[4/7] 安装 pm2..."
npm install -g pm2

# 安装 Git
echo "[5/7] 安装 Git..."
apt install -y git

# 克隆项目
echo "[6/7] 克隆项目代码..."
cd /root
if [ -d "ai-work-assistant" ]; then
  echo "项目已存在，拉取最新代码..."
  cd ai-work-assistant
  git pull
else
  echo "克隆项目..."
  git clone https://github.com/sansansan333270/ai-work-assistant.git
  cd ai-work-assistant
fi

# 安装依赖
echo "[7/7] 安装依赖并构建..."
pnpm install
pnpm build

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "启动服务："
echo "  cd /root/ai-work-assistant && pm2 start \"pnpm start\" --name ai-assistant"
echo ""
echo "查看状态："
echo "  pm2 status"
echo ""
echo "访问地址："
echo "  http://14.103.105.198:5000"
echo ""
EOF

chmod +x deploy.sh
echo "脚本已创建，开始执行..."
./deploy.sh
```

## 三、启动服务

部署完成后执行：

```bash
cd /root/ai-work-assistant
pm2 start "pnpm start" --name ai-assistant
```

## 四、验证部署

在浏览器访问：
```
http://14.103.105.198:5000
```

## 五、常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs ai-assistant

# 重启服务
pm2 restart ai-assistant

# 停止服务
pm2 stop ai-assistant

# 设置开机自启
pm2 startup
pm2 save
```

## 六、安全组配置

如果访问不了，需要在火山引擎控制台开放端口：

1. 进入实例详情
2. 点击「安全组」
3. 添加入站规则：
   - 端口：5000
   - 协议：TCP
   - 来源：0.0.0.0/0

## 七、配置域名（可选）

如果有域名，可以：
1. 域名解析 A 记录指向 14.103.105.198
2. 安装 Nginx 反向代理
3. 配置 HTTPS 证书

---

## 问题排查

### 访问不了？
1. 检查服务是否启动：`pm2 status`
2. 检查端口是否监听：`netstat -tlnp | grep 5000`
3. 检查安全组是否开放 5000 端口

### 服务启动失败？
1. 查看日志：`pm2 logs ai-assistant`
2. 检查依赖：`pnpm install`
3. 重新构建：`pnpm build`
