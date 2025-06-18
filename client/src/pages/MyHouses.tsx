import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Select,
  Input,
  message,
  Popconfirm,
  Image
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { IHouse, HouseStatus } from '../types';
import { houseAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

const MyHouses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [houses, setHouses] = useState<IHouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 获取房源列表
  const fetchHouses = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      let response;

      if (user?.role === 'admin') {
        // 管理员获取所有房源
        response = await houseAPI.getAllHousesForAdmin({
          page,
          limit: pageSize,
          status: statusFilter || undefined,
          keyword: searchKeyword || undefined
        });
      } else {
        // 房东获取自己的房源
        response = await houseAPI.getLandlordHouses({
          page,
          limit: pageSize,
          status: statusFilter || undefined
        });
      }

      setHouses(response.data.houses);
      setPagination({
        current: response.data.pagination.currentPage,
        pageSize: response.data.pagination.limit,
        total: response.data.pagination.totalCount
      });
    } catch (error) {
      message.error('获取房源列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouses();
  }, [user, statusFilter, searchKeyword]);

  // 更新房源状态
  const handleStatusChange = async (houseId: string, status: string) => {
    try {
      await houseAPI.updateHouseStatus(houseId, status);
      message.success('状态更新成功');
      fetchHouses(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  // 删除房源
  const handleDelete = async (houseId: string) => {
    try {
      await houseAPI.deleteHouse(houseId);
      message.success('删除成功');
      fetchHouses(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 状态标签渲染
  const renderStatus = (status: HouseStatus) => {
    const statusConfig = {
      [HouseStatus.AVAILABLE]: { color: 'green', text: '可租赁' },
      [HouseStatus.RENTED]: { color: 'orange', text: '已租出' },
      [HouseStatus.PENDING]: { color: 'blue', text: '待审核' },
      [HouseStatus.OFFLINE]: { color: 'gray', text: '已下线' }
    };

    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义 - 管理员需要额外的房东信息列
  const columns: ColumnsType<IHouse> = [
    {
      title: '房源图片',
      dataIndex: 'images',
      key: 'images',
      width: 100,
      render: (images: string[]) => (
        <Image
          width={60}
          height={60}
          src={images[0] || 'https://via.placeholder.com/60x60'}
          style={{ objectFit: 'cover', borderRadius: 4 }}
        />
      )
    },
    {
      title: '房源标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: IHouse) => (
        <Button
          type="link"
          onClick={() => navigate(`/houses/${record._id}`)}
          style={{ padding: 0, height: 'auto' }}
        >
          {title}
        </Button>
      )
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          ¥{price}/月
        </span>
      )
    },
    {
      title: '区域',
      dataIndex: 'district',
      key: 'district',
      width: 100
    },
    {
      title: '房型',
      dataIndex: 'houseType',
      key: 'houseType',
      width: 100
    },
    {
      title: '面积',
      dataIndex: 'area',
      key: 'area',
      width: 80,
      render: (area: number) => `${area}㎡`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatus
    },
    {
      title: '浏览量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 80
    },
    {
      title: '发布时间',
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
      render: (_, record: IHouse) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/houses/${record._id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/houses/${record._id}/edit`)}
          >
            编辑
          </Button>
          <Select
            value={record.status}
            style={{ width: 80 }}
            size="small"
            onChange={(value) => handleStatusChange(record._id, value)}
          >
            <Option value="available">可租</Option>
            <Option value="rented">已租</Option>
            <Option value="offline">下线</Option>
          </Select>
          <Popconfirm
            title="确定要删除这个房源吗？"
            onConfirm={() => handleDelete(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    },

    // 管理员专用：房东信息列
    ...(user?.role === 'admin' ? [{
      title: '房东',
      dataIndex: ['landlordId', 'username'],
      key: 'landlord',
      width: 100,
      render: (username: string, record: IHouse) => (
        <div>
          <div>{username}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.landlordId.phone}
          </div>
        </div>
      )
    }] : []),
  ];

  return (
    <div className="page-container">
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={2} style={{ margin: 0 }}>
            {user?.role === 'admin' ? '房源管理' : '我的房源'}
          </Title>
          {user?.role !== 'admin' && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/publish')}
            >
              发布房源
            </Button>
          )}
        </div>

        {/* 管理员专用搜索和筛选 */}
        {user?.role === 'admin' && (
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Search
                placeholder="搜索房源..."
                style={{ width: 200 }}
                onSearch={setSearchKeyword}
                allowClear
              />
              <Select
                placeholder="状态筛选"
                style={{ width: 120 }}
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
              >
                <Option value="available">可租赁</Option>
                <Option value="rented">已租出</Option>
                <Option value="pending">待审核</Option>
                <Option value="offline">已下线</Option>
              </Select>
            </Space>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={houses}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize: pageSize || 10 });
              fetchHouses(page, pageSize);
            }
          }}
          scroll={{ x: user?.role === 'admin' ? 1300 : 1200 }}
        />
      </Card>
    </div>
  );
};

export default MyHouses; 