import express from 'express';
import { body } from 'express-validator';
import {
  getHouses,
  getHouseById,
  createHouse,
  updateHouse,
  deleteHouse,
  getLandlordHouses,
  updateHouseStatus,
  getRecommendedHouses,
  getAllHousesForAdmin, // 新增
  getUserStats // 新增
} from '../controllers/houseController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = express.Router();

// 房屋信息验证规则
const houseValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('房屋标题长度必须在5-100个字符之间'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('房屋描述长度必须在10-1000个字符之间'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('租金必须是大于0的数字'),
  
  body('area')
    .isFloat({ min: 0 })
    .withMessage('面积必须是大于0的数字'),
  
  body('location')
    .trim()
    .notEmpty()
    .withMessage('详细地址不能为空'),
  
  body('district')
    .trim()
    .notEmpty()
    .withMessage('所在区域不能为空'),
  
  body('orientation')
    .isIn(['东', '南', '西', '北', '东南', '东北', '西南', '西北', '南北通透'])
    .withMessage('朝向值无效'),
  
  body('decoration')
    .isIn(['毛坯', '简装', '精装', '豪装'])
    .withMessage('装修情况值无效'),
  
  body('houseType')
    .isIn(['一室一厅', '两室一厅', '两室两厅', '三室一厅', '三室两厅', '四室两厅', '其他'])
    .withMessage('房型值无效'),
  
  body('floor')
    .trim()
    .notEmpty()
    .withMessage('楼层信息不能为空'),
  
  body('facilities')
    .optional()
    .custom((value) => {
      const validFacilities = ['空调', '洗衣机', '冰箱', '热水器', '电视', '宽带', '燃气', '暖气', '电梯', '停车位'];
      const facilities = Array.isArray(value) ? value : value.split(',');
      return facilities.every(facility => validFacilities.includes(facility.trim()));
    })
    .withMessage('设施选项无效')
];

// 状态更新验证规则
const statusValidation = [
  body('status')
    .isIn(['available', 'rented', 'pending', 'offline'])
    .withMessage('状态值无效')
];

// 公开路由
router.get('/', getHouses); // 获取房屋列表（支持筛选）
router.get('/recommended', getRecommendedHouses); // 获取推荐房屋
router.get('/:id', getHouseById); // 获取房屋详情

// 需要认证的路由
router.use(authenticate);

// 房东/管理员路由
router.post('/', 
  authorize('landlord', 'admin'), 
  uploadMultiple('images', 10), 
  houseValidation, 
  createHouse
); // 发布房屋

router.put('/:id', 
  authorize('landlord', 'admin'), 
  uploadMultiple('images', 10), 
  houseValidation, 
  updateHouse
); // 更新房屋信息

router.delete('/:id', 
  authorize('landlord', 'admin'), 
  deleteHouse
); // 删除房屋

router.patch('/:id/status', 
  authorize('landlord', 'admin'), 
  statusValidation, 
  updateHouseStatus
); // 更新房屋状态

// 房东专用路由（管理员也可以访问，但逻辑不同）
router.get('/landlord/my-houses', 
  authorize('landlord', 'admin'), 
  getLandlordHouses
); // 获取房东的房屋列表

// 管理员专用路由
router.get('/admin/all-houses',
  authorize('admin'),
  getAllHousesForAdmin
);

router.get('/admin/stats',
  authorize('admin'),
  getUserStats
);

export default router; 