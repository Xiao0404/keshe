import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Statistic,
  List,
  Avatar,
  Button,
  Space,
  Tag,
  Empty
} from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  FileTextOutlined,
  EyeOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { houseAPI, applicationAPI } from '../services/api';
import { IHouse, IApplication, ApplicationStatus } from '../types';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalHouses: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0
  });
  const [recentHouses, setRecentHouses] = useState<IHouse[]>([]);
  const [recentApplications, setRecentApplications] = useState<IApplication[]>([]);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      setLoading(true);

      if (user?.role === 'landlord') {
        // 房东统计
        const [housesRes, applicationsRes] = await Promise.all([
          houseAPI.getLandlordHouses({ limit: 5 }),
          applicationAPI.getLandlordApplications({ limit: 5 })
        ]);

        setRecentHouses(housesRes.data.houses);
        setRecentApplications(applicationsRes.data.applications);

        setStats({
          totalHouses: housesRes.data.pagination.totalCount,
          totalApplications: applicationsRes.data.pagination.totalCount,
          pendingApplications: applicationsRes.data.applications.filter(app => app.status === ApplicationStatus.PENDING).length,
          approvedApplications: applicationsRes.data.applications.filter(app => app.status === ApplicationStatus.APPROVED).length
        });
      } else if (user?.role === 'tenant') {
        // 租客统计
        const applicationsRes = await applicationAPI.getTenantApplications({ limit: 5 });
        setRecentApplications(applicationsRes.data.applications);

        setStats({
          totalHouses: 0,
          totalApplications: applicationsRes.data.pagination.totalCount,
          pendingApplications: applicationsRes.data.applications.filter(app => app.status === ApplicationStatus.PENDING).length,
          approvedApplications: applicationsRes.data.applications.filter(app => app.status === ApplicationStatus.APPROVED).length
        });
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  // 状态标签渲染
  const renderStatus = (status: ApplicationStatus) => {
    const statusConfig = {
      [ApplicationStatus.PENDING]: { color: 'blue', text: '待处理' },
      [ApplicationStatus.APPROVED]: { color: 'green', text: '已通过' },
      [ApplicationStatus.REJECTED]: { color: 'red', text: '已拒绝' },
      [ApplicationStatus.CANCELLED]: { color: 'gray', text: '已取消' }
    };

    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  if (!user) {
    return (
      <div className="page-container">
        <Title level={2}>请先登录</Title>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Title level={2}>个人中心</Title>

      {/* 欢迎信息 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size={64} src={user.avatar} icon={<UserOutlined />} />
          <div style={{ marginLeft: 16 }}>
            <Title level={3} style={{ margin: 0 }}>
              欢迎回来，{user.username}！
            </Title>
            <Text type="secondary">
              {user.role === 'tenant' ? '租客' : user.role === 'landlord' ? '房东' : '管理员'} ·
              最后登录：{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '未知'}
            </Text>
          </div>
        </div>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {user.role === 'landlord' && (
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="我的房源"
                value={stats.totalHouses}
                prefix={<HomeOutlined />}
                suffix="套"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        )}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={user.role === 'landlord' ? '收到申请' : '我的申请'}
              value={stats.totalApplications}
              prefix={<FileTextOutlined />}
              suffix="个"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pendingApplications}
              prefix={<CalendarOutlined />}
              suffix="个"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已通过"
              value={stats.approvedApplications}
              prefix={<EyeOutlined />}
              suffix="个"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 房东：最近房源 */}
        {user.role === 'landlord' && (
          <Col xs={24} lg={12}>
            <Card
              title="最近发布的房源"
              extra={
                <Button type="link" onClick={() => navigate('/my-houses')}>
                  查看全部
                </Button>
              }
            >
              {recentHouses.length > 0 ? (
                <List
                  dataSource={recentHouses}
                  renderItem={(house) => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          onClick={() => navigate(`/houses/${house._id}`)}
                        >
                          查看
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            shape="square"
                            size={48}
                            src={house.images[0] || 'https://via.placeholder.com/48x48'}
                          />
                        }
                        title={house.title}
                        description={
                          <Space>
                            <Text>¥{house.price}/月</Text>
                            <Text type="secondary">{house.district}</Text>
                            <Tag color={house.status === 'available' ? 'green' : 'orange'}>
                              {house.status === 'available' ? '可租' : '已租'}
                            </Tag>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无房源" />
              )}
            </Card>
          </Col>
        )}

        {/* 最近申请 */}
        <Col xs={24} lg={user.role === 'landlord' ? 12 : 24}>
          <Card
            title={user.role === 'landlord' ? '最近收到的申请' : '最近的申请'}
            extra={
              <Button
                type="link"
                onClick={() => navigate(user.role === 'landlord' ? '/received-applications' : '/my-applications')}
              >
                查看全部
              </Button>
            }
          >
            {recentApplications.length > 0 ? (
              <List
                dataSource={recentApplications}
                renderItem={(application) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        onClick={() => navigate(`/houses/${application.houseId._id}`)}
                      >
                        查看房源
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          shape="square"
                          size={48}
                          src={application.houseId.images?.[0] || 'https://via.placeholder.com/48x48'}
                        />
                      }
                      title={application.houseId.title}
                      description={
                        <Space direction="vertical" size={4}>
                          <div>
                            <Text type="secondary">
                              {user.role === 'landlord' ? '申请人：' : ''}
                              {user.role === 'landlord' ? application.tenantInfo.name : `¥${application.houseId.price}/月`}
                            </Text>
                          </div>
                          <div>
                            {renderStatus(application.status)}
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              {new Date(application.createdAt).toLocaleDateString()}
                            </Text>
                          </div>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无申请" />
            )}
          </Card>
        </Col>
      </Row>

      {/* 快捷操作 */}
      <Card title="快捷操作" style={{ marginTop: 24 }}>
        <Space wrap>
          <Button type="primary" onClick={() => navigate('/houses')}>
            浏览房源
          </Button>
          {user.role === 'landlord' && (
            <>
              <Button onClick={() => navigate('/publish')}>
                发布房源
              </Button>
              <Button onClick={() => navigate('/my-houses')}>
                管理房源
              </Button>
            </>
          )}
          <Button onClick={() => navigate('/profile')}>
            个人设置
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default Dashboard; 