import React, { useEffect, useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Typography, 
  Button, 
  Input, 
  Space,
  Carousel,
  Statistic,
  Tag
} from 'antd';
import { 
  SearchOutlined, 
  HomeOutlined, 
  UserOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { IHouse } from '../types';
import { houseAPI } from '../services/api';

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [recommendedHouses, setRecommendedHouses] = useState<IHouse[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取推荐房源
  useEffect(() => {
    const fetchRecommendedHouses = async () => {
      try {
        setLoading(true);
        const response = await houseAPI.getRecommendedHouses(6);
        setRecommendedHouses(response.data.houses);
      } catch (error) {
        console.error('获取推荐房源失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedHouses();
  }, []);

  const handleSearch = (value: string) => {
    navigate(`/houses?keyword=${encodeURIComponent(value)}`);
  };

  const handleHouseClick = (houseId: string) => {
    navigate(`/houses/${houseId}`);
  };

  // 轮播图数据
  const carouselData = [
    {
      title: '找到理想的家',
      subtitle: '海量优质房源，总有一款适合您',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop'
    },
    {
      title: '安全可靠的租房平台',
      subtitle: '实名认证，房源真实，交易安全',
      image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&h=400&fit=crop'
    },
    {
      title: '专业的租房服务',
      subtitle: '一站式服务，让租房变得简单',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=400&fit=crop'
    }
  ];

  // 特色功能
  const features = [
    {
      icon: <SearchOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      title: '智能搜索',
      description: '多维度筛选，快速找到心仪房源'
    },
    {
      icon: <HomeOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      title: '房源丰富',
      description: '覆盖全城，各类房型应有尽有'
    },
    {
      icon: <UserOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
      title: '实名认证',
      description: '房东租客实名认证，交易更安全'
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      title: '品质保证',
      description: '严格审核，确保房源信息真实有效'
    }
  ];

  return (
    <div>
      {/* 轮播图区域 */}
      <div style={{ marginBottom: 48 }}>
        <Carousel autoplay>
          {carouselData.map((item, index) => (
            <div key={index}>
              <div
                style={{
                  height: 400,
                  background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${item.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  textAlign: 'center'
                }}
              >
                <div>
                  <Title level={1} style={{ color: 'white', marginBottom: 16 }}>
                    {item.title}
                  </Title>
                  <Paragraph style={{ color: 'white', fontSize: 18, marginBottom: 32 }}>
                    {item.subtitle}
                  </Paragraph>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={() => navigate('/houses')}
                  >
                    开始找房
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>

      <div className="page-container">
        {/* 搜索区域 */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Title level={2} style={{ marginBottom: 24 }}>
            快速找房
          </Title>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <Search
              placeholder="输入关键词搜索房源..."
              enterButton="搜索"
              size="large"
              onSearch={handleSearch}
            />
          </div>
        </div>

        {/* 统计数据 */}
        <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="房源总数"
                value={1234}
                suffix="套"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="注册用户"
                value={5678}
                suffix="人"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="成功交易"
                value={890}
                suffix="笔"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="服务城市"
                value={12}
                suffix="个"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 特色功能 */}
        <div style={{ marginBottom: 48 }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
            平台特色
          </Title>
          <Row gutter={[24, 24]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card 
                  hoverable
                  style={{ textAlign: 'center', height: '100%' }}
                >
                  <div style={{ marginBottom: 16 }}>
                    {feature.icon}
                  </div>
                  <Title level={4} style={{ marginBottom: 12 }}>
                    {feature.title}
                  </Title>
                  <Text type="secondary">
                    {feature.description}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 推荐房源 */}
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 24 
          }}>
            <Title level={2} style={{ margin: 0 }}>
              推荐房源
            </Title>
            <Button 
              type="link" 
              onClick={() => navigate('/houses')}
            >
              查看更多 →
            </Button>
          </div>
          
          <Row gutter={[24, 24]}>
            {recommendedHouses.map((house) => (
              <Col xs={24} sm={12} lg={8} key={house._id}>
                <Card
                  hoverable
                  loading={loading}
                  cover={
                    <img
                      alt={house.title}
                      src={house.images[0] || 'https://via.placeholder.com/300x200'}
                      style={{ height: 200, objectFit: 'cover' }}
                    />
                  }
                  onClick={() => handleHouseClick(house._id)}
                  className="house-card"
                >
                  <Card.Meta
                    title={
                      <div className="house-card__title">
                        {house.title}
                      </div>
                    }
                    description={
                      <div>
                        <div className="house-card__price">
                          ¥{house.price}/月
                        </div>
                        <div className="house-card__info">
                          {house.area}㎡ · {house.houseType} · {house.district}
                        </div>
                        <div className="house-card__tags">
                          <Space wrap>
                            <Tag color="blue">{house.orientation}</Tag>
                            <Tag color="green">{house.decoration}</Tag>
                          </Space>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </div>
  );
};

export default Home; 