import express from 'express';
import { body } from 'express-validator';
import {
  getHouseComments,
  getCommentReplies,
  createComment,
  deleteComment,
  getCommentStats
} from '../controllers/commentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 评论验证规则
const commentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('评论内容长度必须在1-500个字符之间'),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('评分必须是1-5之间的整数'),

  body('parentId')
    .optional()
    .isMongoId()
    .withMessage('父评论ID格式无效')
];

// 公开路由
router.get('/house/:houseId', getHouseComments); // 获取房源评论列表
router.get('/house/:houseId/stats', getCommentStats); // 获取房源评论统计
router.get('/:commentId/replies', getCommentReplies); // 获取评论回复

// 需要认证的路由
router.use(authenticate);

router.post('/house/:houseId', commentValidation, createComment); // 创建评论
router.delete('/:commentId', deleteComment); // 删除评论

export default router;
