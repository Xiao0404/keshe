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
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 房屋模型定义
const houseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '房屋标题不能为空'],
    trim: true,
    maxlength: [100, '标题不能超过100个字符']
  },
  description: {
    type: String,
    required: [true, '房屋描述不能为空'],
    maxlength: [1000, '描述不能超过1000个字符']
  },
  price: {
    type: Number,
    required: [true, '租金不能为空'],
    min: [0, '租金不能为负数']
  },
  area: {
    type: Number,
    required: [true, '面积不能为空'],
    min: [0, '面积不能为负数']
  },
  location: {
    type: String,
    required: [true, '详细地址不能为空'],
    trim: true
  },
  district: {
    type: String,
    required: [true, '所在区域不能为空'],
    trim: true
  },
  orientation: {
    type: String,
    required: [true, '朝向不能为空'],
    enum: ['东', '南', '西', '北', '东南', '东北', '西南', '西北', '南北通透']
  },
  decoration: {
    type: String,
    required: [true, '装修情况不能为空'],
    enum: ['毛坯', '简装', '精装', '豪装']
  },
  houseType: {
    type: String,
    required: [true, '房型不能为空'],
    enum: ['一室一厅', '两室一厅', '两室两厅', '三室一厅', '三室两厅', '四室两厅', '其他']
  },
  floor: {
    type: String,
    required: [true, '楼层不能为空']
  },
  images: [{
    type: String,
    required: true
  }],
  facilities: [{
    type: String,
    enum: ['空调', '洗衣机', '冰箱', '热水器', '电视', '宽带', '燃气', '暖气', '电梯', '停车位']
  }],
  landlordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'rented', 'pending', 'offline'],
    default: 'available'
  },
  viewCount: {
    type: Number,
    default: 0
  },
  isRecommended: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const House = mongoose.model('House', houseSchema);

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
      return await User.find({ role: { $in: ['admin', 'landlord'] } });
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
        username: 'landlord2',
        email: 'landlord2@example.com',
        password: await bcrypt.hash('landlord123', 10),
        role: 'landlord',
        phone: '13800138003'
      },
      {
        username: 'tenant',
        email: 'tenant@example.com',
        password: await bcrypt.hash('tenant123', 10),
        role: 'tenant',
        phone: '13800138002'
      }
    ];

    const createdUsers = await User.insertMany(defaultUsers);
    console.log('✅ 默认用户创建成功');
    console.log('📋 默认账号信息:');
    console.log('   管理员: admin@example.com / admin123');
    console.log('   房东1: landlord@example.com / landlord123');
    console.log('   房东2: landlord2@example.com / landlord123');
    console.log('   租客: tenant@example.com / tenant123');

    return createdUsers.filter(user => ['admin', 'landlord'].includes(user.role));
  } catch (error) {
    console.error('❌ 创建默认用户失败:', error.message);
    return [];
  }
};

// 创建示例房屋数据
const createSampleHouses = async () => {
  try {
    // 检查是否已有房屋数据
    const existingHouses = await House.countDocuments();


    // 获取房东用户
    const landlords = await User.find({ role: 'landlord' });
    if (landlords.length === 0) {
      console.log('⚠️  没有找到房东用户，跳过房屋数据创建');
      return;
    }

    const landlord1 = landlords[0];
    const landlord2 = landlords[1] || landlords[0]; // 如果只有一个房东，就用同一个

    // 示例房屋数据
    const sampleHouses = [
      {
        title: '朝阳区三里屯精装两室一厅',
        description: '位于朝阳区三里屯核心地段，交通便利，周边配套设施齐全。房屋采光良好，装修精美，家具家电齐全，拎包入住。附近有地铁站，购物中心，餐厅等，生活便利。',
        price: 6800,
        area: 85,
        location: '朝阳区三里屯SOHO附近',
        district: '朝阳区',
        orientation: '南',
        decoration: '精装',
        houseType: '两室一厅',
        floor: '15/25层',
        images: [
          'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'
        ],
        facilities: ['空调', '洗衣机', '冰箱', '热水器', '电视', '宽带', '电梯'],
        landlordId: landlord1._id,
        status: 'available',
        viewCount: 156,
        isRecommended: true
      },
      {
        title: '海淀区中关村一室一厅温馨小屋',
        description: '海淀区中关村地段，适合单身白领或学生居住。房屋虽小但五脏俱全，装修温馨，家具齐全。楼下就是地铁站，到各大互联网公司都很方便。',
        price: 4200,
        area: 45,
        location: '海淀区中关村大街',
        district: '海淀区',
        orientation: '东南',
        decoration: '简装',
        houseType: '一室一厅',
        floor: '8/18层',
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
        ],
        facilities: ['空调', '洗衣机', '冰箱', '热水器', '宽带', '电梯'],
        landlordId: landlord1._id,
        status: 'available',
        viewCount: 89,
        isRecommended: false
      },
      {
        title: '西城区金融街豪华三室两厅',
        description: '西城区金融街核心位置，高端住宅小区，安保严格。房屋面积大，装修豪华，适合家庭居住。小区环境优美，配套设施完善，有健身房、游泳池等。',
        price: 12000,
        area: 120,
        location: '西城区金融街购物中心附近',
        district: '西城区',
        orientation: '南北通透',
        decoration: '豪装',
        houseType: '三室两厅',
        floor: '20/30层',
        images: [
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop'
        ],
        facilities: ['空调', '洗衣机', '冰箱', '热水器', '电视', '宽带', '电梯', '停车位', ],
        landlordId: landlord2._id,
        status: 'available',
        viewCount: 234,
        isRecommended: true
      },
      {
        title: '东城区王府井两室两厅商务公寓',
        description: '东城区王府井商业区，交通便利，周边商业配套齐全。房屋装修现代简约，适合商务人士居住。楼下有便利店、餐厅，生活便利。',
        price: 8500,
        area: 95,
        location: '东城区王府井大街',
        district: '东城区',
        orientation: '东南',
        decoration: '精装',
        houseType: '两室两厅',
        floor: '12/20层',
        images: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop'
        ],
        facilities: ['空调', '洗衣机', '冰箱', '热水器', '电视', '宽带', '电梯', '停车位'],
        landlordId: landlord2._id,
        status: 'available',
        viewCount: 178,
        isRecommended: false
      },
      {
        title: '丰台区科技园区四室两厅大户型',
        description: '丰台区科技园区，适合多人合租或大家庭居住。房屋空间大，房间多，每个房间都有独立卫生间。小区环境好，有花园和儿童游乐设施。',
        price: 9800,
        area: 140,
        location: '丰台区科技园南区',
        district: '丰台区',
        orientation: '南',
        decoration: '精装',
        houseType: '四室两厅',
        floor: '6/11层',
        images: [
          'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop'
        ],
        facilities: ['空调', '洗衣机', '冰箱', '热水器', '电视', '宽带', '电梯', '停车位'],
        landlordId: landlord1._id,
        status: 'available',
        viewCount: 145,
        isRecommended: true
      },
      {
        title: '石景山区万达广场一室一厅现代公寓',
        description: '石景山区万达广场附近，购物娱乐便利。房屋装修现代时尚，家具家电全新，适合年轻人居住。楼下就是万达广场，吃喝玩乐一应俱全。',
        price: 3800,
        area: 50,
        location: '石景山区万达广场东侧',
        district: '石景山区',
        orientation: '西南',
        decoration: '精装',
        houseType: '一室一厅',
        floor: '10/16层',
        images: [
          'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop'
        ],
        facilities: ['空调', '洗衣机', '冰箱', '热水器', '电视', '宽带', '电梯'],
        landlordId: landlord2._id,
        status: 'available',
        viewCount: 67,
        isRecommended: false
      },
      {
        title: '朝阳区国贸CBD三室一厅高端公寓',
        description: '朝阳区国贸CBD核心区域，高端商务公寓。房屋装修奢华，视野开阔，可俯瞰CBD全景。适合高端商务人士，楼下有五星级酒店和高端餐厅。',
        price: 15000,
        area: 110,
        location: '朝阳区国贸桥附近',
        district: '朝阳区',
        orientation: '东南',
        decoration: '豪装',
        houseType: '三室一厅',
        floor: '35/40层',
        images: [
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop'
        ],
        facilities: ['空调', '洗衣机', '冰箱', '热水器', '电视', '宽带', '电梯', '停车位'],
        landlordId: landlord1._id,
        status: 'rented',
        viewCount: 312,
        isRecommended: true
      },
      {
        title: '海淀区五道口学区房两室一厅',
        description: '海淀区五道口，著名学区房，周边有多所知名大学。房屋装修简洁，适合学生或教职工居住。交通便利，有多条地铁线路经过。',
        price: 5500,
        area: 75,
        location: '海淀区五道口华清嘉园',
        district: '海淀区',
        orientation: '南',
        decoration: '简装',
        houseType: '两室一厅',
        floor: '5/7层',
        images: [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
        ],
        facilities: ['空调', '洗衣机', '冰箱', '热水器', '宽带'],
        landlordId: landlord2._id,
        status: 'available',
        viewCount: 198,
        isRecommended: false
      }
    ];

    await House.insertMany(sampleHouses);
    console.log('✅ 示例房屋数据创建成功');
    console.log(`📋 共创建 ${sampleHouses.length} 条房屋记录`);
    console.log('   - 可租赁房源: 7 套');
    console.log('   - 已租出房源: 1 套');
    console.log('   - 推荐房源: 4 套');

  } catch (error) {
    console.error('❌ 创建示例房屋数据失败:', error.message);
  }
};

// 初始化数据库
const initDatabase = async () => {
  console.log('🏠 房屋租赁系统 - 数据库初始化');
  console.log('================================');
  
  await connectDB();
  await createDefaultUsers();
  await createSampleHouses();
  
  console.log('🎉 数据库初始化完成!');
  process.exit(0);
};

// 运行初始化
initDatabase().catch(error => {
  console.error('❌ 数据库初始化失败:', error);
  process.exit(1);
}); 