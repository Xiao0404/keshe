import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Popconfirm,
  Image,
  Descriptions
} from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { IApplication, ApplicationStatus } from '../types';
import { applicationAPI } from '../services/api';

const { Title, Text } = Typography;

const MyApplications: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<IApplication | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 获取我的申请列表
  const fetchMyApplications = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await applicationAPI.getTenantApplications({ page, limit: pageSize });
      setApplications(response.data.applications);
      setPagination({
        current: response.data.pagination.currentPage,
        pageSize: response.data.pagination.limit,
        total: response.data.pagination.totalCount
      });
    } catch (error) {
      message.error('获取申请列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, []);

  // 取消申请
  const handleCancel = async (applicationId: string) => {
    try {
      await applicationAPI.cancelApplication(applicationId);
      message.success('申请已取消');
      fetchMyApplications(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('取消申请失败');
    }
  };

  // 查看申请详情
  const showDetail = (application: IApplication) => {
    setSelectedApplication(application);
    setDetailModalVisible(true);
  };

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

  // 表格列定义
  const columns: ColumnsType<IApplication> = [
    {
      title: '房源图片',
      dataIndex: ['houseId', 'images'],
      key: 'houseImage',
      width: 100,
      render: (images: string[]) => (
        <Image
          width={60}
          height={60}
          src={images?.[0] || 'https://via.placeholder.com/60x60'}
          style={{ objectFit: 'cover', borderRadius: 4 }}
        />
      )
    },
    {
      title: '房源标题',
      dataIndex: ['houseId', 'title'],
      key: 'houseTitle',
      ellipsis: true,
      render: (title: string, record: IApplication) => (
        <Button
          type="link"
          onClick={() => navigate(`/houses/${record.houseId._id}`)}
          style={{ padding: 0, height: 'auto' }}
        >
          {title}
        </Button>
      )
    },
    {
      title: '租金',
      dataIndex: ['houseId', 'price'],
      key: 'price',
      width: 100,
      render: (price: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          ¥{price}/月
        </span>
      )
    },
    {
      title: '位置',
      dataIndex: ['houseId', 'location'],
      key: 'location',
      ellipsis: true,
      width: 150
    },
    {
      title: '房东',
      dataIndex: ['landlordId', 'username'],
      key: 'landlord',
      width: 100
    },
    {
      title: '申请状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatus
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record: IApplication) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          >
            详情
          </Button>
          {record.status === ApplicationStatus.PENDING && (
            <Popconfirm
              title="确定要取消这个申请吗？"
              onConfirm={() => handleCancel(record._id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              >
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <Card>
        <Title level={2} style={{ marginBottom: 16 }}>我的申请</Title>

        <Table
          columns={columns}
          dataSource={applications}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize: pageSize || 10 });
              fetchMyApplications(page, pageSize);
            }
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 申请详情弹窗 */}
      <Modal
        title="申请详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedApplication && (
          <div>
            <Descriptions title="房源信息" column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="房源标题">
                {selectedApplication.houseId.title}
              </Descriptions.Item>
              <Descriptions.Item label="租金">
                ¥{selectedApplication.houseId.price}/月
              </Descriptions.Item>
              <Descriptions.Item label="位置">
                {selectedApplication.houseId.location}
              </Descriptions.Item>
              <Descriptions.Item label="房东">
                {selectedApplication.landlordId.username}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="申请信息" column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="申请人">
                {selectedApplication.tenantInfo.name}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {selectedApplication.tenantInfo.phone}
              </Descriptions.Item>
              <Descriptions.Item label="职业">
                {selectedApplication.tenantInfo.occupation || '未填写'}
              </Descriptions.Item>
              <Descriptions.Item label="月收入">
                {selectedApplication.tenantInfo.income || '未填写'}
              </Descriptions.Item>
              <Descriptions.Item label="申请状态">
                {renderStatus(selectedApplication.status)}
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {new Date(selectedApplication.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {selectedApplication.message && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>申请留言：</Text>
                <div style={{ marginTop: 8, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  {selectedApplication.message}
                </div>
              </div>
            )}

            {selectedApplication.status === ApplicationStatus.REJECTED && selectedApplication.rejectReason && (
              <div>
                <Text strong style={{ color: '#ff4d4f' }}>拒绝原因：</Text>
                <div style={{ marginTop: 8, padding: 12, backgroundColor: '#fff2f0', borderRadius: 4, border: '1px solid #ffccc7' }}>
                  {selectedApplication.rejectReason}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyApplications; 