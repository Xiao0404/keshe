import { validationResult } from 'express-validator';
import Application from '../models/Application.js';
import House from '../models/House.js';
import User from '../models/User.js';

// 提交租赁申请
export const createApplication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '输入数据验证失败',
        data: errors.array()
      });
    }

    const { houseId, message, tenantInfo } = req.body;
    const tenantId = req.user._id;

    // 检查房屋是否存在且可租赁
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({
        code: 404,
        message: '房屋不存在'
      });
    }

    if (house.status !== 'available') {
      return res.status(400).json({
        code: 400,
        message: '该房屋当前不可申请'
      });
    }

    // 检查是否已经申请过
    const existingApplication = await Application.findOne({
      houseId,
      tenantId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingApplication) {
      return res.status(400).json({
        code: 400,
        message: '您已经申请过该房屋'
      });
    }

    // 创建申请
    const application = new Application({
      houseId,
      tenantId,
      landlordId: house.landlordId,
      message: message || '',
      tenantInfo: {
        name: tenantInfo.name,
        phone: tenantInfo.phone,
        occupation: tenantInfo.occupation || '',
        income: tenantInfo.income || ''
      }
    });

    await application.save();

    // 填充相关信息
    await application.populate([
      { path: 'houseId', select: 'title price location images' },
      { path: 'tenantId', select: 'username email phone' },
      { path: 'landlordId', select: 'username phone' }
    ]);

    res.status(201).json({
      code: 201,
      message: '申请提交成功',
      data: { application }
    });
  } catch (error) {
    console.error('提交申请错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 获取申请列表（租客查看自己的申请）
export const getTenantApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const tenantId = req.user._id;

    // 构建查询条件
    const query = { tenantId };
    if (status) query.status = status;

    // 分页计算
    const skip = (Number(page) - 1) * Number(limit);

    // 执行查询
    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('houseId', 'title price location images status')
        .populate('landlordId', 'username phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Application.countDocuments(query)
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      code: 200,
      message: '获取申请列表成功',
      data: {
        applications,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount: total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('获取租客申请列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 获取房东收到的申请列表
export const getLandlordApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, houseId } = req.query;
    const landlordId = req.user._id;

    // 构建查询条件
    const query = { landlordId };
    if (status) query.status = status;
    if (houseId) query.houseId = houseId;

    // 分页计算
    const skip = (Number(page) - 1) * Number(limit);

    // 执行查询
    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('houseId', 'title price location images')
        .populate('tenantId', 'username email phone avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Application.countDocuments(query)
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      code: 200,
      message: '获取申请列表成功',
      data: {
        applications,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount: total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('获取房东申请列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 处理申请（房东操作）
export const processApplication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '输入数据验证失败',
        data: errors.array()
      });
    }

    const { id } = req.params;
    const { status, rejectReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        code: 400,
        message: '无效的状态值'
      });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({
        code: 404,
        message: '申请不存在'
      });
    }

    // 检查权限
    if (application.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        code: 403,
        message: '无权处理此申请'
      });
    }

    // 检查申请状态
    if (application.status !== 'pending') {
      return res.status(400).json({
        code: 400,
        message: '该申请已被处理'
      });
    }

    // 更新申请状态
    await application.updateStatus(status, rejectReason);

    // 如果申请被批准，更新房屋状态并拒绝其他申请
    if (status === 'approved') {
      // 更新房屋状态为已租赁
      await House.findByIdAndUpdate(application.houseId, { status: 'rented' });

      // 拒绝该房屋的其他待处理申请
      await Application.updateMany(
        {
          houseId: application.houseId,
          _id: { $ne: application._id },
          status: 'pending'
        },
        {
          status: 'rejected',
          rejectReason: '房屋已被其他租客租赁',
          processedAt: new Date()
        }
      );
    }

    // 填充相关信息
    await application.populate([
      { path: 'houseId', select: 'title price location' },
      { path: 'tenantId', select: 'username email phone' }
    ]);

    res.json({
      code: 200,
      message: `申请${status === 'approved' ? '批准' : '拒绝'}成功`,
      data: { application }
    });
  } catch (error) {
    console.error('处理申请错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 取消申请（租客操作）
export const cancelApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        code: 404,
        message: '申请不存在'
      });
    }

    // 检查权限
    if (application.tenantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        code: 403,
        message: '无权取消此申请'
      });
    }

    // 检查申请状态
    if (application.status !== 'pending') {
      return res.status(400).json({
        code: 400,
        message: '只能取消待处理的申请'
      });
    }

    // 更新申请状态
    await application.updateStatus('cancelled');

    res.json({
      code: 200,
      message: '申请取消成功'
    });
  } catch (error) {
    console.error('取消申请错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 获取申请详情
export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id)
      .populate('houseId', 'title price location images facilities')
      .populate('tenantId', 'username email phone avatar')
      .populate('landlordId', 'username phone');

    if (!application) {
      return res.status(404).json({
        code: 404,
        message: '申请不存在'
      });
    }

    // 检查权限（只有相关的租客、房东或管理员可以查看）
    const userId = req.user._id.toString();
    const isAuthorized = 
      application.tenantId._id.toString() === userId ||
      application.landlordId._id.toString() === userId ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        code: 403,
        message: '无权查看此申请'
      });
    }

    res.json({
      code: 200,
      message: '获取申请详情成功',
      data: { application }
    });
  } catch (error) {
    console.error('获取申请详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 获取申请统计信息（管理员）
export const getApplicationStats = async (req, res) => {
  try {
    const stats = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApplications = await Application.countDocuments();
    const recentApplications = await Application.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const formattedStats = {
      total: totalApplications,
      recent: recentApplications,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };

    res.json({
      code: 200,
      message: '获取申请统计成功',
      data: { stats: formattedStats }
    });
  } catch (error) {
    console.error('获取申请统计错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
}; 