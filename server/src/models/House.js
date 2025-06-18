import mongoose from 'mongoose';

const HouseSchema = new mongoose.Schema({
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

// 创建索引以提高查询性能
HouseSchema.index({ district: 1, price: 1 });
HouseSchema.index({ landlordId: 1 });
HouseSchema.index({ status: 1 });
HouseSchema.index({ createdAt: -1 });

// 增加浏览次数
HouseSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

export default mongoose.model('House', HouseSchema); 