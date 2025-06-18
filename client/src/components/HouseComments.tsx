import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Avatar,
  Button,
  Form,
  Input,
  Rate,
  Space,
  Typography,
  Divider,
  message,
  Spin,
  Empty,
  Pagination,
  Popconfirm
} from 'antd';
import {
  UserOutlined,
  MessageOutlined,
  DeleteOutlined,
  LikeOutlined
} from '@ant-design/icons';
import { IComment, ICommentStats } from '../types';
import { commentAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface HouseCommentsProps {
  houseId: string;
}

const HouseComments: React.FC<HouseCommentsProps> = ({ houseId }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<IComment[]>([]);
  const [stats, setStats] = useState<ICommentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, IComment[]>>({});
  const [replyLoading, setReplyLoading] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [form] = Form.useForm();
  const [replyForms] = Form.useForm();

  // 获取评论列表
  const fetchComments = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await commentAPI.getHouseComments(houseId, { page, limit: pageSize });
      setComments(response.data.comments);
      setPagination({
        current: response.data.pagination.currentPage,
        pageSize: response.data.pagination.limit,
        total: response.data.pagination.totalCount
      });
    } catch (error) {
      message.error('获取评论失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取评论统计
  const fetchStats = async () => {
    try {
      const response = await commentAPI.getHouseCommentStats(houseId);
      setStats(response.data.stats);
    } catch (error) {
      console.error('获取评论统计失败:', error);
    }
  };

  // 获取回复列表
  const fetchReplies = async (commentId: string) => {
    try {
      setReplyLoading(prev => ({ ...prev, [commentId]: true }));
      const response = await commentAPI.getCommentReplies(commentId);
      setReplies(prev => ({ ...prev, [commentId]: response.data.replies }));
    } catch (error) {
      message.error('获取回复失败');
    } finally {
      setReplyLoading(prev => ({ ...prev, [commentId]: false }));
    }
  };

  useEffect(() => {
    fetchComments();
    fetchStats();
  }, [houseId]);

  // 提交评论
  const handleSubmitComment = async (values: any) => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      return;
    }

    try {
      setSubmitLoading(true);
      await commentAPI.createComment(houseId, {
        content: values.content,
        rating: values.rating
      });
      message.success('评论发表成功');
      form.resetFields();
      fetchComments();
      fetchStats();
    } catch (error) {
      message.error('评论发表失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 提交回复
  const handleSubmitReply = async (parentId: string, values: any) => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      return;
    }

    try {
      setSubmitLoading(true);
      await commentAPI.createComment(houseId, {
        content: values.content,
        parentId
      });
      message.success('回复发表成功');
      replyForms.resetFields();
      setShowReplyForm(null);
      fetchReplies(parentId);
      fetchComments(); // 刷新评论列表以更新回复数量
    } catch (error) {
      message.error('回复发表失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 删除评论
  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentAPI.deleteComment(commentId);
      message.success('评论删除成功');
      fetchComments();
      fetchStats();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 切换回复显示
  const toggleReplies = (commentId: string) => {
    if (replies[commentId]) {
      // 如果已经加载了回复，则隐藏
      setReplies(prev => {
        const newReplies = { ...prev };
        delete newReplies[commentId];
        return newReplies;
      });
    } else {
      // 加载回复
      fetchReplies(commentId);
    }
  };

  // 渲染评分分布
  const renderRatingDistribution = () => {
    if (!stats || stats.totalRatings === 0) return null;

    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <Rate disabled value={stats.averageRating} allowHalf />
          <Text style={{ marginLeft: 8 }}>
            {stats.averageRating.toFixed(1)} ({stats.totalRatings}条评价)
          </Text>
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {Object.entries(stats.ratingDistribution).reverse().map(([rating, count]) => (
            <div key={rating} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ width: 20 }}>{rating}星</span>
              <div style={{
                flex: 1,
                height: 6,
                backgroundColor: '#f0f0f0',
                borderRadius: 3,
                margin: '0 8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0}%`,
                  height: '100%',
                  backgroundColor: '#1890ff'
                }} />
              </div>
              <span style={{ width: 30, textAlign: 'right' }}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card title={
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <MessageOutlined style={{ marginRight: 8 }} />
        房源评价 {stats && `(${stats.totalComments})`}
      </div>
    }>
      {/* 评分统计 */}
      {renderRatingDistribution()}

      {/* 发表评论表单 */}
      {isAuthenticated ? (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitComment}
          style={{ marginBottom: 24 }}
        >
          <Form.Item
            name="rating"
            label="评分"
            rules={[{ required: true, message: '请给出评分' }]}
          >
            <Rate />
          </Form.Item>
          <Form.Item
            name="content"
            label="评价内容"
            rules={[
              { required: true, message: '请输入评价内容' },
              { min: 5, message: '评价内容至少5个字符' },
              { max: 500, message: '评价内容不能超过500个字符' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="分享您对这个房源的看法..."
              maxLength={500}
              showCount
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitLoading}>
              发表评价
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0', marginBottom: 24 }}>
          <Text type="secondary">请登录后发表评价</Text>
        </div>
      )}

      <Divider />

      {/* 评论列表 */}
      <Spin spinning={loading}>
        {comments.length > 0 ? (
          <>
            <List
              dataSource={comments}
              renderItem={(comment) => (
                <List.Item key={comment._id}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={comment.userId.avatar}
                        icon={<UserOutlined />}
                      />
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <Text strong>{comment.userId.username}</Text>
                          {comment.rating && (
                            <Rate
                              disabled
                              value={comment.rating}
                              style={{ marginLeft: 8, fontSize: 12 }}
                            />
                          )}
                        </div>
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(comment.createdAt).toLocaleString()}
                          </Text>
                          {(user?.id === comment.userId.id || user?.role === 'admin') && (
                            <Popconfirm
                              title="确定要删除这条评论吗？"
                              onConfirm={() => handleDeleteComment(comment._id)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                style={{ marginLeft: 8 }}
                              />
                            </Popconfirm>
                          )}
                        </div>
                      </div>
                    }
                    description={
                      <div>
                        <Paragraph style={{ marginBottom: 8 }}>
                          {comment.content}
                        </Paragraph>
                        <Space>
                          {comment.replyCount && comment.replyCount > 0 && (
                            <Button
                              type="link"
                              size="small"
                              onClick={() => toggleReplies(comment._id)}
                              loading={replyLoading[comment._id]}
                            >
                              {replies[comment._id] ? '收起' : '查看'}回复 ({comment.replyCount})
                            </Button>
                          )}
                          {isAuthenticated && (
                            <Button
                              type="link"
                              size="small"
                              onClick={() => setShowReplyForm(
                                showReplyForm === comment._id ? null : comment._id
                              )}
                            >
                              回复
                            </Button>
                          )}
                        </Space>

                        {/* 回复列表 */}
                        {replies[comment._id] && (
                          <div style={{ marginTop: 12, paddingLeft: 20, borderLeft: '2px solid #f0f0f0' }}>
                            {replies[comment._id].map(reply => (
                              <div key={reply._id} style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                  <Avatar
                                    size="small"
                                    src={reply.userId.avatar}
                                    icon={<UserOutlined />}
                                  />
                                  <Text strong style={{ marginLeft: 8 }}>
                                    {reply.userId.username}
                                  </Text>
                                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                    {new Date(reply.createdAt).toLocaleString()}
                                  </Text>
                                  {(user?.id === reply.userId.id || user?.role === 'admin') && (
                                    <Popconfirm
                                      title="确定要删除这条回复吗？"
                                      onConfirm={() => handleDeleteComment(reply._id)}
                                      okText="确定"
                                      cancelText="取消"
                                    >
                                      <Button
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        style={{ marginLeft: 8 }}
                                      />
                                    </Popconfirm>
                                  )}
                                </div>
                                <Text>{reply.content}</Text>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 回复表单 */}
                        {showReplyForm === comment._id && (
                          <div style={{ marginTop: 12 }}>
                            <Form
                              form={replyForms}
                              onFinish={(values) => handleSubmitReply(comment._id, values)}
                            >
                              <Form.Item
                                name="content"
                                rules={[
                                  { required: true, message: '请输入回复内容' },
                                  { min: 1, message: '回复内容不能为空' },
                                  { max: 500, message: '回复内容不能超过500个字符' }
                                ]}
                              >
                                <TextArea
                                  rows={3}
                                  placeholder="输入回复内容..."
                                  maxLength={500}
                                />
                              </Form.Item>
                              <Form.Item>
                                <Space>
                                  <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="small"
                                    loading={submitLoading}
                                  >
                                    发表回复
                                  </Button>
                                  <Button
                                    size="small"
                                    onClick={() => setShowReplyForm(null)}
                                  >
                                    取消
                                  </Button>
                                </Space>
                              </Form.Item>
                            </Form>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            {/* 分页 */}
            {pagination.total > pagination.pageSize && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                  onChange={(page) => {
                    setPagination({ ...pagination, current: page });
                    fetchComments(page, pagination.pageSize);
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <Empty description="暂无评价" />
        )}
      </Spin>
    </Card>
  );
};

export default HouseComments;
