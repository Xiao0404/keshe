import { validationResult } from 'express-validator';
import House from '../models/House.js';
import User from '../models/User.js';
import { deleteFile } from '../middleware/upload.js';
import path from 'path';

// 获取房屋列表（支持筛选和分页）
export const getHouses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      district,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      orientation,
      decoration,
      houseType,
      keyword,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // 构建查询条件
    const query = { status: 'available' };

    if (district) query.district = district;
    if (orientation) query.orientation = orientation;
    if (decoration) query.decoration = decoration;
    if (houseType) query.houseType = houseType;

    // 价格范围筛选
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 面积范围筛选
    if (minArea || maxArea) {
      query.area = {};
      if (minArea) query.area.$gte = Number(minArea);
      if (maxArea) query.area.$lte = Number(maxArea);
    }

    // 关键词搜索
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { location: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 排序选项
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    // 分页计算
    const skip = (Number(page) - 1) * Number(limit);

    // 执行查询
    const [houses, total] = await Promise.all([
      House.find(query)
        .populate('landlordId', 'username phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      House.countDocuments(query)
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;

    res.json({
      code: 200,
      message: '获取房屋列表成功',
      data: {
        houses,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount: total,
          hasNextPage,
          hasPrevPage,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('获取房屋列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 获取房屋详情
export const getHouseById = async (req, res) => {
  try {
    const { id } = req.params;

    const house = await House.findById(id)
      .populate('landlordId', 'username phone avatar');

    if (!house) {
      return res.status(404).json({
        code: 404,
        message: '房屋不存在'
      });
    }

    // 增加浏览次数
    await house.incrementViewCount();

    res.json({
      code: 200,
      message: '获取房屋详情成功',
      data: { house }
    });
  } catch (error) {
    console.error('获取房屋详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 发布房屋信息
export const createHouse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '输入数据验证失败',
        data: errors.array()
      });
    }

    // 检查用户角色
    if (req.user.role !== 'landlord' && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '只有房东可以发布房屋信息'
      });
    }

    const houseData = {
      ...req.body,
      landlordId: req.user._id
    };

    // 处理上传的图片
    if (req.files && req.files.length > 0) {
      houseData.images = req.files.map(file => `/uploads/houses/${file.filename}`);
    }

    // 处理设施数组
    if (req.body.facilities) {
      houseData.facilities = Array.isArray(req.body.facilities) 
        ? req.body.facilities 
        : req.body.facilities.split(',');
    }

    const house = new House(houseData);
    await house.save();

    // 填充房东信息
    await house.populate('landlordId', 'username phone');

    res.status(201).json({
      code: 201,
      message: '房屋发布成功',
      data: { house }
    });
  } catch (error) {
    console.error('发布房屋错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 更新房屋信息
export const updateHouse = async (req, res) => {
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
    const house = await House.findById(id);

    if (!house) {
      return res.status(404).json({
        code: 404,
        message: '房屋不存在'
      });
    }

    // 检查权限
    if (req.user.role !== 'admin' && house.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        code: 403,
        message: '无权修改此房屋信息'
      });
    }

    const updateData = { ...req.body };

    // 处理新上传的图片
    if (req.files && req.files.length > 0) {
      // 删除旧图片
      if (house.images && house.images.length > 0) {
        house.images.forEach(imagePath => {
          const fullPath = path.join(process.cwd(), imagePath);
          deleteFile(fullPath);
        });
      }
      updateData.images = req.files.map(file => `/uploads/houses/${file.filename}`);
    }

    // 处理设施数组
    if (req.body.facilities) {
      updateData.facilities = Array.isArray(req.body.facilities) 
        ? req.body.facilities 
        : req.body.facilities.split(',');
    }

    const updatedHouse = await House.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('landlordId', 'username phone');

    res.json({
      code: 200,
      message: '房屋信息更新成功',
      data: { house: updatedHouse }
    });
  } catch (error) {
    console.error('更新房屋信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 删除房屋
export const deleteHouse = async (req, res) => {
  try {
    const { id } = req.params;
    const house = await House.findById(id);

    if (!house) {
      return res.status(404).json({
        code: 404,
        message: '房屋不存在'
      });
    }

    // 检查权限
    if (req.user.role !== 'admin' && house.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        code: 403,
        message: '无权删除此房屋'
      });
    }

    // 删除相关图片文件
    if (house.images && house.images.length > 0) {
      house.images.forEach(imagePath => {
        const fullPath = path.join(process.cwd(), imagePath);
        deleteFile(fullPath);
      });
    }

    await House.findByIdAndDelete(id);

    res.json({
      code: 200,
      message: '房屋删除成功'
    });
  } catch (error) {
    console.error('删除房屋错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 获取房东的房屋列表 - 修复管理员权限
export const getLandlordHouses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, landlordId } = req.query;

    // 构建查询条件
    let query = {};

    if (req.user.role === 'admin') {
      // 管理员可以查看所有房源，或指定房东的房源
      if (landlordId) {
        query.landlordId = landlordId;
      }
      // 如果没有指定landlordId，管理员可以看到所有房源
    } else {
      // 房东只能看到自己的房源
      query.landlordId = req.user._id;
    }

    if (status) query.status = status;

    // 分页计算
    const skip = (Number(page) - 1) * Number(limit);

    // 执行查询
    const [houses, total] = await Promise.all([
      House.find(query)
        .populate('landlordId', 'username phone email') // 管理员需要看到房东信息
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      House.countDocuments(query)
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      code: 200,
      message: '获取房屋列表成功',
      data: {
        houses,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount: total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('获取房屋列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 新增：管理员专用的获取所有房源接口
export const getAllHousesForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, landlordId, keyword } = req.query;

    // 只有管理员可以访问
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }

    // 构建查询条件
    const query = {};
    if (status) query.status = status;
    if (landlordId) query.landlordId = landlordId;
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { location: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 分页计算
    const skip = (Number(page) - 1) * Number(limit);

    // 执行查询
    const [houses, total] = await Promise.all([
      House.find(query)
        .populate('landlordId', 'username phone email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      House.countDocuments(query)
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      code: 200,
      message: '获取所有房屋列表成功',
      data: {
        houses,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount: total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('获取所有房屋列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 新增：管理员获取用户统计信息
export const getUserStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }

    const [totalUsers, totalLandlords, totalTenants, totalHouses] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'landlord' }),
      User.countDocuments({ role: 'tenant' }),
      House.countDocuments()
    ]);

    res.json({
      code: 200,
      message: '获取统计信息成功',
      data: {
        stats: {
          totalUsers,
          totalLandlords,
          totalTenants,
          totalHouses
        }
      }
    });
  } catch (error) {
    console.error('获取统计信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 更新房屋状态
export const updateHouseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['available', 'rented', 'pending', 'offline'].includes(status)) {
      return res.status(400).json({
        code: 400,
        message: '无效的状态值'
      });
    }

    const house = await House.findById(id);
    if (!house) {
      return res.status(404).json({
        code: 404,
        message: '房屋不存在'
      });
    }

    // 检查权限
    if (req.user.role !== 'admin' && house.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        code: 403,
        message: '无权修改此房屋状态'
      });
    }

    house.status = status;
    await house.save();

    res.json({
      code: 200,
      message: '房屋状态更新成功',
      data: { house }
    });
  } catch (error) {
    console.error('更新房屋状态错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 获取推荐房屋
export const getRecommendedHouses = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const houses = await House.find({
      status: 'available',
      isRecommended: true
    })
      .populate('landlordId', 'username phone')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      code: 200,
      message: '获取推荐房屋成功',
      data: { houses }
    });
  } catch (error) {
    console.error('获取推荐房屋错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
}; 