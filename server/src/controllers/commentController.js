import { validationResult } from 'express-validator';
import Comment from '../models/Comment.js';
import House from '../models/House.js';

// 获取房源评论列表
export const getHouseComments = async (req, res) => {
  try {
    const { houseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // 检查房源是否存在
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({
        code: 404,
        message: '房源不存在'
      });
    }

    // 分页计算
    const skip = (Number(page) - 1) * Number(limit);

    // 获取主评论（非回复）
    const [comments, total] = await Promise.all([
      Comment.find({
        houseId,
        parentId: null,
        isDeleted: false
      })
        .populate('userId', 'username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Comment.countDocuments({
        houseId,
        parentId: null,
        isDeleted: false
      })
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      code: 200,
      message: '获取评论列表成功',
      data: {
        comments,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount: total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('获取评论列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 获取评论回复
export const getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // 检查父评论是否存在
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({
        code: 404,
        message: '评论不存在'
      });
    }

    // 分页计算
    const skip = (Number(page) - 1) * Number(limit);

    // 获取回复
    const [replies, total] = await Promise.all([
      Comment.find({
        parentId: commentId,
        isDeleted: false
      })
        .populate('userId', 'username avatar')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Comment.countDocuments({
        parentId: commentId,
        isDeleted: false
      })
    ]);

    res.json({
      code: 200,
      message: '获取回复列表成功',
      data: {
        replies,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalCount: total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('获取回复列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 创建评论
export const createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '输入数据验证失败',
        data: errors.array()
      });
    }

    const { houseId } = req.params;
    const { content, rating, parentId } = req.body;
    const userId = req.user._id;

    // 检查房源是否存在
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({
        code: 404,
        message: '房源不存在'
      });
    }

    // 如果是回复，检查父评论是否存在
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return res.status(404).json({
          code: 404,
          message: '父评论不存在'
        });
      }

      // 回复不能有评分
      if (rating) {
        return res.status(400).json({
          code: 400,
          message: '回复不能包含评分'
        });
      }
    } else {
      // 主评论必须有评分
      if (!rating) {
        return res.status(400).json({
          code: 400,
          message: '评论必须包含评分'
        });
      }

      // 检查用户是否已经对该房源评价过
      const existingComment = await Comment.findOne({
        houseId,
        userId,
        parentId: null,
        isDeleted: false
      });

      if (existingComment) {
        return res.status(400).json({
          code: 400,
          message: '您已经评价过该房源'
        });
      }
    }

    // 创建评论
    const comment = new Comment({
      houseId,
      userId,
      content,
      rating: parentId ? null : rating,
      parentId: parentId || null
    });

    await comment.save();

    // 如果是回复，更新父评论的回复数量
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      await parentComment.updateReplyCount();
    }

    // 填充用户信息
    await comment.populate('userId', 'username avatar');

    res.status(201).json({
      code: 201,
      message: parentId ? '回复发表成功' : '评论发表成功',
      data: { comment }
    });
  } catch (error) {
    console.error('创建评论错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 删除评论
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        code: 404,
        message: '评论不存在'
      });
    }

    // 检查权限：只有评论作者或管理员可以删除
    if (comment.userId.toString() !== userId.toString() && userRole !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权删除此评论'
      });
    }

    // 软删除评论
    await comment.softDelete();

    // 如果是回复，更新父评论的回复数量
    if (comment.parentId) {
      const parentComment = await Comment.findById(comment.parentId);
      if (parentComment) {
        await parentComment.updateReplyCount();
      }
    } else {
      // 如果是主评论，软删除所有回复
      await Comment.updateMany(
        { parentId: commentId },
        { isDeleted: true }
      );
    }

    res.json({
      code: 200,
      message: '评论删除成功'
    });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 获取房源评论统计
export const getCommentStats = async (req, res) => {
  try {
    const { houseId } = req.params;

    // 检查房源是否存在
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({
        code: 404,
        message: '房源不存在'
      });
    }

    // 获取评论统计
    const [totalComments, ratingStats] = await Promise.all([
      Comment.countDocuments({
        houseId,
        parentId: null,
        isDeleted: false
      }),
      Comment.aggregate([
        {
          $match: {
            houseId: mongoose.Types.ObjectId(houseId),
            parentId: null,
            isDeleted: false,
            rating: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // 计算评分分布和平均分
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRatings = 0;
    let totalScore = 0;

    ratingStats.forEach(stat => {
      ratingDistribution[stat._id] = stat.count;
      totalRatings += stat.count;
      totalScore += stat._id * stat.count;
    });

    const averageRating = totalRatings > 0 ? totalScore / totalRatings : 0;

    res.json({
      code: 200,
      message: '获取评论统计成功',
      data: {
        stats: {
          totalComments,
          totalRatings,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingDistribution
        }
      }
    });
  } catch (error) {
    console.error('获取评论统计错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};
