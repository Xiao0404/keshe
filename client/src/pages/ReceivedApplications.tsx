import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Image,
  Descriptions
} from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { IApplication, ApplicationStatus } from '../types';
import { applicationAPI } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ReceivedApplications: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<IApplication | null>(null);
  const [processLoading, setProcessLoading] = useState(false);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 获取收到的申请列表
  const fetchReceivedApplications = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await applicationAPI.getLandlordApplications({ page, limit: pageSize });
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
    fetchReceivedApplications();
  }, []);

  // 批准申请
  const handleApprove = async (applicationId: string) => {
    try {
      setProcessLoading(true);
      await applicationAPI.processApplication(applicationId, { status: 'approved' });
      message.success('申请已批准');
      fetchReceivedApplications(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('处理申请失败');
    } finally {
      setProcessLoading(false);
    }
  };

  // 拒绝申请
  const handleReject = async (values: { rejectReason: string }) => {
    if (!selectedApplication) return;

    try {
      setProcessLoading(true);
      await applicationAPI.processApplication(selectedApplication._id, {
        status: 'rejected',
        rejectReason: values.rejectReason
      });
      message.success('申请已拒绝');
      setRejectModalVisible(false);
      form.resetFields();
      fetchReceivedApplications(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('处理申请失败');
    } finally {
      setProcessLoading(false);
    }
  };

  // 查看申请详情
  const showDetail = (application: IApplication) => {
    setSelectedApplication(application);
    setDetailModalVisible(true);
  };

  // 显示拒绝弹窗
  const showRejectModal = (application: IApplication) => {
    setSelectedApplication(application);
    setRejectModalVisible(true);
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
      title: '申请人',
      dataIndex: ['tenantInfo', 'name'],
      key: 'tenantName',
      width: 100
    },
    {
      title: '联系电话',
      dataIndex: ['tenantInfo', 'phone'],
      key: 'tenantPhone',
      width: 120
    },
    {
      title: '职业',
      dataIndex: ['tenantInfo', 'occupation'],
      key: 'occupation',
      width: 100,
      render: (occupation: string) => occupation || '未填写'
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
      width: 200,
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
            <>
              <Button
                type="link"
                icon={<CheckOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleApprove(record._id)}
                loading={processLoading}
              >
                通过
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => showRejectModal(record)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <Card>
        <Title level={2} style={{ marginBottom: 16 }}>收到的申请</Title>

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
              fetchReceivedApplications(page, pageSize);
            }
          }}
          scroll={{ x: 1200 }}
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
              <Descriptions.Item label="房源状态">
                {selectedApplication.houseId.status}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="申请人信息" column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="姓名">
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

      {/* 拒绝申请弹窗 */}
      <Modal
        title="拒绝申请"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleReject}
        >
          <Form.Item
            name="rejectReason"
            label="拒绝原因"
            rules={[{ required: true, message: '请输入拒绝原因' }]}
          >
            <TextArea
              rows={4}
              placeholder="请说明拒绝的原因..."
              maxLength={200}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setRejectModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" danger htmlType="submit" loading={processLoading}>
                确认拒绝
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReceivedApplications; 