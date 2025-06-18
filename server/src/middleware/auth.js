import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// JWT认证中间件
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '访问被拒绝，请提供有效的token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在或已被禁用'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '无效的token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: 'token已过期'
      });
    }
    
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 角色权限验证中间件
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '请先登录'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }

    next();
  };
};

// 检查资源所有权
export const checkOwnership = (Model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          code: 404,
          message: '资源不存在'
        });
      }

      // 管理员可以访问所有资源
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // 检查是否为资源所有者
      const ownerField = Model.modelName === 'House' ? 'landlordId' : 'userId';
      if (resource[ownerField].toString() !== req.user._id.toString()) {
        return res.status(403).json({
          code: 403,
          message: '无权访问此资源'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '服务器内部错误'
      });
    }
  };
}; 