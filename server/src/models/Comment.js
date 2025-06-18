import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  houseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'House',
    required: [true, '房屋ID不能为空']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空']
  },
  content: {
    type: String,
    required: [true, '评论内容不能为空'],
    trim: true,
    minlength: [1, '评论内容不能为空'],
    maxlength: [500, '评论内容不能超过500个字符']
  },
  rating: {
    type: Number,
    min: [1, '评分不能低于1星'],
    max: [5, '评分不能超过5星'],
    default: null
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replyCount: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 创建索引
CommentSchema.index({ houseId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1, createdAt: 1 });
CommentSchema.index({ userId: 1 });

// 更新回复数量的方法
CommentSchema.methods.updateReplyCount = async function() {
  const replyCount = await this.constructor.countDocuments({
    parentId: this._id,
    isDeleted: false
  });
  this.replyCount = replyCount;
  return this.save();
};

// 软删除方法
CommentSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

export default mongoose.model('Comment', CommentSchema);
