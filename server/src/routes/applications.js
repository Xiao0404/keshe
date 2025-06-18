import express from 'express';
import { body } from 'express-validator';
import {
  createApplication,
  getTenantApplications,
  getLandlordApplications,
  processApplication,
  cancelApplication,
  getApplicationById,
  getApplicationStats
} from '../controllers/applicationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 申请验证规则
const applicationValidation = [
  body('houseId')
    .isMongoId()
    .withMessage('房屋ID格式无效'),
  
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('留言不能超过500个字符'),
  
  body('tenantInfo.name')
    .trim()
    .notEmpty()
    .withMessage('姓名不能为空')
    .isLength({ min: 2, max: 20 })
    .withMessage('姓名长度必须在2-20个字符之间'),
  
  body('tenantInfo.phone')
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号'),
  
  body('tenantInfo.occupation')
    .optional()
    .isLength({ max: 50 })
    .withMessage('职业信息不能超过50个字符'),
  
  body('tenantInfo.income')
    .optional()
    .isLength({ max: 20 })
    .withMessage('收入信息不能超过20个字符')
];

// 处理申请验证规则
const processApplicationValidation = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('状态值只能是approved或rejected'),
  
  body('rejectReason')
    .if(body('status').equals('rejected'))
    .notEmpty()
    .withMessage('拒绝申请时必须提供拒绝原因')
    .isLength({ max: 200 })
    .withMessage('拒绝原因不能超过200个字符')
];

// 需要认证的所有路由
router.use(authenticate);

// 租客路由
router.post('/', 
  authorize('tenant'), 
  applicationValidation, 
  createApplication
); // 提交租赁申请

router.get('/tenant/my-applications', 
  authorize('tenant'), 
  getTenantApplications
); // 获取租客的申请列表

router.patch('/:id/cancel', 
  authorize('tenant'), 
  cancelApplication
); // 取消申请

// 房东路由
router.get('/landlord/received', 
  authorize('landlord', 'admin'), 
  getLandlordApplications
); // 获取房东收到的申请列表

router.patch('/:id/process', 
  authorize('landlord', 'admin'), 
  processApplicationValidation, 
  processApplication
); // 处理申请

// 通用路由（租客、房东、管理员都可以访问）
router.get('/:id', getApplicationById); // 获取申请详情

// 管理员路由
router.get('/admin/stats', 
  authorize('admin'), 
  getApplicationStats
); // 获取申请统计信息

export default router; 