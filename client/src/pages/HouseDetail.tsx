import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Carousel,
  Descriptions,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Avatar
} from 'antd';
import {
  EnvironmentOutlined,
  PhoneOutlined,
  UserOutlined,
  HeartOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { IHouse, ITenantInfo } from '../types';
import { houseAPI, applicationAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import HouseComments from '../components/HouseComments'; // 新增

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const HouseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [house, setHouse] = useState<IHouse | null>(null);
  const [loading, setLoading] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [form] = Form.useForm();

  // 获取房屋详情
  const fetchHouseDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await houseAPI.getHouseById(id);
      setHouse(response.data.house);
    } catch (error) {
      message.error('获取房源详情失败');
      navigate('/houses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseDetail();
  }, [id]);

  // 处理申请租赁
  const handleApply = async (values: any) => {
    if (!house || !user) return;

    try {
      setApplyLoading(true);
      const tenantInfo: ITenantInfo = {
        name: values.name,
        phone: values.phone,
        occupation: values.occupation || '',
        income: values.income || ''
      };

      await applicationAPI.createApplication({
        houseId: house._id,
        message: values.message || '',
        tenantInfo
      });

      message.success('申请提交成功，请等待房东回复');
      setApplyModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('申请提交失败，请重试');
    } finally {
      setApplyLoading(false);
    }
  };

  // 打开申请弹窗
  const showApplyModal = () => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    if (user?.role !== 'tenant') {
      message.warning('只有租客可以申请租赁');
      return;
    }

    setApplyModalVisible(true);
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!house) {
    return (
      <div className="page-container">
        <Title level={2}>房源不存在</Title>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Row gutter={[24, 24]}>
        {/* 左侧图片和基本信息 */}
        <Col xs={24} lg={16}>
          {/* 图片轮播 */}
          <Card style={{ marginBottom: 24 }}>
            <Carousel autoplay>
              {house.images.map((image, index) => (
                <div key={index}>
                  <img
                    src={image}
                    alt={`房源图片${index + 1}`}
                    style={{
                      width: '100%',
                      height: 400,
                      objectFit: 'cover',
                      borderRadius: 8
                    }}
                  />
                </div>
              ))}
            </Carousel>
          </Card>

          {/* 房源详情 */}
          <Card title="房源详情" style={{ marginBottom: 24 }}>
            <Title level={3}>{house.title}</Title>
            <div style={{ marginBottom: 16 }}>
              <Text type="danger" style={{ fontSize: 24, fontWeight: 'bold' }}>
                ¥{house.price}/月
              </Text>
            </div>

            <Space wrap style={{ marginBottom: 16 }}>
              <Tag color="blue">{house.houseType}</Tag>
              <Tag color="green">{house.decoration}</Tag>
              <Tag color="orange">{house.orientation}</Tag>
              <Tag>{house.area}㎡</Tag>
              <Tag>{house.floor}</Tag>
            </Space>

            <Descriptions column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="所在区域">{house.district}</Descriptions.Item>
              <Descriptions.Item label="详细地址">
                <EnvironmentOutlined /> {house.location}
              </Descriptions.Item>
              <Descriptions.Item label="房屋面积">{house.area}㎡</Descriptions.Item>
              <Descriptions.Item label="房屋朝向">{house.orientation}</Descriptions.Item>
              <Descriptions.Item label="装修情况">{house.decoration}</Descriptions.Item>
              <Descriptions.Item label="楼层信息">{house.floor}</Descriptions.Item>
              <Descriptions.Item label="浏览次数">{house.viewCount}次</Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {new Date(house.createdAt).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 16 }}>
              <Title level={4}>房源描述</Title>
              <Paragraph>{house.description}</Paragraph>
            </div>

            {house.facilities.length > 0 && (
              <div>
                <Title level={4}>配套设施</Title>
                <Space wrap>
                  {house.facilities.map(facility => (
                    <Tag key={facility} color="cyan">{facility}</Tag>
                  ))}
                </Space>
              </div>
            )}
          </Card>

          {/* 房源评价组件 */}
          <HouseComments houseId={house._id} />
        </Col>

        {/* 右侧房东信息和操作 */}
        <Col xs={24} lg={8}>
          {/* 房东信息 */}
          <Card title="房东信息" style={{ marginBottom: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={64}
                src={house.landlordId.avatar}
                icon={<UserOutlined />}
                style={{ marginBottom: 16 }}
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {house.landlordId.username}
                </Title>
                <Text type="secondary">
                  <PhoneOutlined /> {house.landlordId.phone}
                </Text>
              </div>
            </div>
          </Card>

          {/* 操作按钮 */}
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                size="large"
                block
                onClick={showApplyModal}
                disabled={house.status !== 'available'}
              >
                {house.status === 'available' ? '申请租赁' : '房源已租出'}
              </Button>
              <Button size="large" block icon={<HeartOutlined />}>
                收藏房源
              </Button>
              <Button size="large" block icon={<ShareAltOutlined />}>
                分享房源
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 申请租赁弹窗 */}
      <Modal
        title="申请租赁"
        open={applyModalVisible}
        onCancel={() => setApplyModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleApply}
          initialValues={{
            name: user?.username,
            phone: user?.phone
          }}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="联系电话"
            rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
            ]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item
            name="occupation"
            label="职业"
          >
            <Input placeholder="请输入职业（选填）" />
          </Form.Item>

          <Form.Item
            name="income"
            label="月收入"
          >
            <Input placeholder="请输入月收入（选填）" />
          </Form.Item>

          <Form.Item
            name="message"
            label="留言"
          >
            <TextArea
              rows={4}
              placeholder="向房东介绍一下自己，增加申请成功率..."
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setApplyModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={applyLoading}>
                提交申请
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HouseDetail; 