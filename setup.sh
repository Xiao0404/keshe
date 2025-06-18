#!/bin/bash

echo "🏠 房屋租赁网站项目设置"
echo "========================"

# 检查当前目录
if [ ! -f "README.md" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "📋 项目结构检查..."

# 检查基本目录结构
if [ -d "client" ] && [ -d "server" ]; then
    echo "✅ 项目目录结构正确"
else
    echo "❌ 项目目录结构不完整"
    exit 1
fi

# 检查Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js已安装: $(node -v)"
else
    echo "❌ 请先安装Node.js 16+"
    exit 1
fi

# 检查包管理器
if command -v pnpm &> /dev/null; then
    echo "✅ pnpm已安装: $(pnpm -v)"
    PACKAGE_MANAGER="pnpm"
elif command -v yarn &> /dev/null; then
    echo "✅ yarn已安装: $(yarn -v)"
    PACKAGE_MANAGER="yarn"
else
    echo "✅ 使用npm: $(npm -v)"
    PACKAGE_MANAGER="npm"
fi

echo ""
echo "📦 安装依赖..."

# 安装后端依赖
echo "🔧 安装后端依赖..."
cd server
if [ -f "package.json" ]; then
    $PACKAGE_MANAGER install
    if [ $? -eq 0 ]; then
        echo "✅ 后端依赖安装完成"
    else
        echo "❌ 后端依赖安装失败"
        exit 1
    fi
else
    echo "❌ server/package.json 不存在"
    exit 1
fi

# 安装前端依赖
echo "🔧 安装前端依赖..."
cd ../client
if [ -f "package.json" ]; then
    $PACKAGE_MANAGER install
    if [ $? -eq 0 ]; then
        echo "✅ 前端依赖安装完成"
    else
        echo "❌ 前端依赖安装失败"
        exit 1
    fi
else
    echo "❌ client/package.json 不存在"
    exit 1
fi

cd ..

# 创建环境配置
echo ""
echo "⚙️ 环境配置..."
if [ ! -f "server/.env" ]; then
    if [ -f "server/env.example" ]; then
        cp server/env.example server/.env
        echo "✅ 已创建 server/.env 文件"
        echo "⚠️  请编辑 server/.env 文件配置数据库连接"
    else
        echo "⚠️  请手动创建 server/.env 文件"
    fi
else
    echo "✅ server/.env 文件已存在"
fi

echo ""
echo "🎉 项目设置完成！"
echo ""
echo "📖 下一步："
echo "1. 安装并启动 MongoDB"
echo "2. 编辑 server/.env 配置数据库连接"
echo "3. 启动项目："
echo ""
echo "   # 启动后端 (终端1)"
echo "   cd server && $PACKAGE_MANAGER run dev"
echo ""
echo "   # 启动前端 (终端2)"  
echo "   cd client && $PACKAGE_MANAGER start"
echo ""
echo "4. 访问 http://localhost:3000"
echo ""
echo "💡 如果没有MongoDB，可以使用Docker快速启动："
echo "   docker run -d -p 27017:27017 --name mongodb mongo:latest" 