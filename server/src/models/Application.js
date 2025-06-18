import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  houseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'House',
    required: [true, '房屋ID不能为空']
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '租客ID不能为空']
  },
  landlordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '房东ID不能为空']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: [500, '留言不能超过500个字符'],
    default: ''
  },
  tenantInfo: {
    name: {
      type: String,
      required: [true, '姓名不能为空']
    },
    phone: {
      type: String,
      required: [true, '联系电话不能为空']
    },
    occupation: {
      type: String,
      default: ''
    },
    income: {
      type: String,
      default: ''
    }
  },
  rejectReason: {
    type: String,
    maxlength: [200, '拒绝原因不能超过200个字符']
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// 创建复合索引
ApplicationSchema.index({ houseId: 1, tenantId: 1 }, { unique: true });
ApplicationSchema.index({ landlordId: 1, status: 1 });
ApplicationSchema.index({ tenantId: 1, status: 1 });
ApplicationSchema.index({ createdAt: -1 });

// 处理申请状态更新
ApplicationSchema.methods.updateStatus = function(status, reason = '') {
  this.status = status;
  this.processedAt = new Date();
  if (reason) {
    this.rejectReason = reason;
  }
  return this.save();
};

export default mongoose.model('Application', ApplicationSchema); 