import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../server/.env') });

// 用户模型定义
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'landlord', 'tenant'], 
    default: 'tenant' 
  },
  avatar: String,
  phone: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rental-house');
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
};

// 创建默认用户
const createDefaultUsers = async () => {
  try {
    // 检查是否已有用户
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('⚠️  用户数据已存在，跳过创建');
      return;
    }

    // 创建默认用户
    const defaultUsers = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        phone: '13800138000'
      },
      {
        username: 'landlord',
        email: 'landlord@example.com', 
        password: await bcrypt.hash('landlord123', 10),
        role: 'landlord',
        phone: '13800138001'
      },
      {
        username: 'tenant',
        email: 'tenant@example.com',
        password: await bcrypt.hash('tenant123', 10),
        role: 'tenant',
        phone: '13800138002'
      }
    ];

    await User.insertMany(defaultUsers);
    console.log('✅ 默认用户创建成功');
    console.log('📋 默认账号信息:');
    console.log('   管理员: admin@example.com / admin123');
    console.log('   房东: landlord@example.com / landlord123');
    console.log('   租客: tenant@example.com / tenant123');

  } catch (error) {
    console.error('❌ 创建默认用户失败:', error.message);
  }
};

// 初始化数据库
const initDatabase = async () => {
  console.log('🏠 房屋租赁系统 - 数据库初始化');
  console.log('================================');
  
  await connectDB();
  await createDefaultUsers();
  
  console.log('🎉 数据库初始化完成!');
  process.exit(0);
};

// 运行初始化
initDatabase().catch(error => {
  console.error('❌ 数据库初始化失败:', error);
  process.exit(1);
}); 