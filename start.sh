#!/bin/bash

# 房屋租赁网站项目启动脚本

echo "🏠 房屋租赁网站项目启动脚本"
echo "================================"

# 检查Node.js版本
echo "📋 检查环境..."
node_version=$(node -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js版本: $node_version"
else
    echo "❌ 未安装Node.js，请先安装Node.js 16+"
    exit 1
fi

# 检查pnpm
pnpm_version=$(pnpm -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ pnpm版本: $pnpm_version"
else
    echo "❌ 未安装pnpm，正在安装..."
    npm install -g pnpm
fi

# 检查MongoDB
echo "📋 检查MongoDB连接..."
if command -v mongosh &> /dev/null; then
    echo "✅ MongoDB已安装"
else
    echo "⚠️  未检测到MongoDB，请确保MongoDB已启动"
fi

echo ""
echo "🔧 安装依赖..."

# 安装后端依赖
echo "📦 安装后端依赖..."
cd server
if [ ! -f "package.json" ]; then
    echo "❌ 后端package.json不存在"
    exit 1
fi

pnpm install
if [ $? -ne 0 ]; then
    echo "❌ 后端依赖安装失败"
    exit 1
fi
echo "✅ 后端依赖安装完成"

# 安装前端依赖
echo "📦 安装前端依赖..."
cd ../client
if [ ! -f "package.json" ]; then
    echo "❌ 前端package.json不存在"
    exit 1
fi

pnpm install
if [ $? -ne 0 ]; then
    echo "❌ 前端依赖安装失败"
    exit 1
fi
echo "✅ 前端依赖安装完成"

cd ..

# 创建环境配置文件
echo "⚙️  配置环境变量..."
if [ ! -f "server/.env" ]; then
    echo "📝 创建后端环境配置文件..."
    cp server/env.example server/.env
    echo "✅ 请编辑 server/.env 文件配置数据库连接等信息"
fi

echo ""
echo "🎉 项目设置完成！"
echo ""
echo "📖 使用说明："
echo "1. 确保MongoDB已启动"
echo "2. 编辑 server/.env 配置文件"
echo "3. 运行以下命令启动项目："
echo ""
echo "   # 启动后端服务"
echo "   cd server && pnpm dev"
echo ""
echo "   # 启动前端应用（新终端窗口）"
echo "   cd client && pnpm start"
echo ""
echo "4. 访问 http://localhost:3000 查看应用"
echo "5. 后端API地址: http://localhost:3001/api"
echo ""
echo "🔑 默认测试账号："
echo "   管理员: admin@example.com / admin123"
echo "   房东: landlord@example.com / landlord123"
echo "   租客: tenant@example.com / tenant123"
echo ""
echo "💡 提示: 首次运行可执行数据库初始化："
echo "   cd database && node init.js" 