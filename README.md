<<<<<<< HEAD
# keshe
=======
# 房屋租赁网站系统

一个基于 React + Node.js + MongoDB 的现代化房屋租赁管理平台。

## 项目概述

本系统支持三种用户角色：
- **系统管理员**: 用户管理、房屋信息审核、系统数据统计
- **房东**: 发布房屋信息、管理租赁申请
- **租客**: 浏览房屋、搜索筛选、提交租赁申请

## 技术栈

### 前端
- React 18+
- TypeScript
- Ant Design
- React Router
- Axios
- Zustand (状态管理)

### 后端
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT 身份验证
- Multer (文件上传)
- bcryptjs (密码加密)

## 项目结构

```
rental-house-system/
├── client/          # React前端应用
│   ├── src/
│   │   ├── components/  # 公共组件
│   │   ├── pages/      # 页面组件
│   │   ├── hooks/      # 自定义hooks
│   │   ├── store/      # 状态管理
│   │   ├── services/   # API服务
│   │   ├── types/      # TypeScript类型定义
│   │   └── utils/      # 工具函数
│   ├── public/
│   └── package.json
├── server/          # Node.js后端
│   ├── src/
│   │   ├── controllers/ # 控制器
│   │   ├── models/     # 数据模型
│   │   ├── routes/     # 路由
│   │   ├── middleware/ # 中间件
│   │   └── utils/      # 工具函数
│   └── package.json
├── database/        # 数据库脚本
└── README.md
```

## 快速开始

### 环境要求
- Node.js 16+
- MongoDB 4.4+
- pnpm (推荐)

### 安装依赖

```bash
# 安装前端依赖
cd client
pnpm install

# 安装后端依赖
cd ../server
pnpm install
```

### 环境配置

在 `server` 目录下创建 `.env` 文件：

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rental-house
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=7d
```

### 启动项目

```bash
# 启动后端服务
cd server
pnpm dev

# 启动前端应用
cd client
pnpm start
```

## 功能特性

### 用户管理
- [x] 用户注册/登录
- [x] JWT身份验证
- [x] 角色权限控制
- [x] 用户信息管理

### 房屋管理
- [x] 房屋信息发布
- [x] 图片上传
- [x] 多条件搜索筛选
- [x] 房屋收藏功能

### 租赁管理
- [x] 租赁申请提交
- [x] 申请状态管理
- [x] 房东审核功能

### 系统管理
- [x] 用户管理
- [x] 房屋信息审核
- [x] 数据统计

## API 文档

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息

### 房屋相关
- `GET /api/houses` - 获取房屋列表
- `GET /api/houses/:id` - 获取房屋详情
- `POST /api/houses` - 发布房屋
- `PUT /api/houses/:id` - 更新房屋信息

### 申请相关
- `POST /api/applications` - 提交租赁申请
- `GET /api/applications` - 获取申请列表
- `PUT /api/applications/:id` - 处理申请

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License 
>>>>>>> master
