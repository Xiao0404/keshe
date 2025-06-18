import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Pagination,
  Spin,
  Empty,
  message
} from 'antd';
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IHouse, IHouseSearchParams } from '../types';
import { houseAPI } from '../services/api';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const HouseList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [houses, setHouses] = useState<IHouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });

  // 搜索参数 - 修复类型问题
  const [searchFilters, setSearchFilters] = useState<IHouseSearchParams>({
    page: 1,
    limit: 12,
    keyword: searchParams.get('keyword') || '',
    district: searchParams.get('district') || '',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    houseType: searchParams.get('houseType') || undefined,
    decoration: searchParams.get('decoration') || undefined,
    orientation: searchParams.get('orientation') || undefined
  });

  // 获取房屋列表
  const fetchHouses = async (params: IHouseSearchParams) => {
    try {
      setLoading(true);
      const response = await houseAPI.getHouses(params);
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
    fetchHouses(searchFilters);
  }, []);

  // 处理搜索
  const handleSearch = (value: string) => {
    const newFilters = { ...searchFilters, keyword: value, page: 1 };
    setSearchFilters(newFilters);
    fetchHouses(newFilters);
    updateSearchParams(newFilters);
  };

  // 处理筛选
  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...searchFilters, [key]: value, page: 1 };
    setSearchFilters(newFilters);
    fetchHouses(newFilters);
    updateSearchParams(newFilters);
  };

  // 更新URL参数
  const updateSearchParams = (filters: IHouseSearchParams) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString());
      }
    });
    setSearchParams(params);
  };

  // 处理分页
  const handlePageChange = (page: number, pageSize?: number) => {
    const newFilters = { ...searchFilters, page, limit: pageSize || 12 };
    setSearchFilters(newFilters);
    fetchHouses(newFilters);
    updateSearchParams(newFilters);
  };

  // 跳转到房屋详情
  const handleHouseClick = (houseId: string) => {
    navigate(`/houses/${houseId}`);
  };

  return (
    <div className="page-container">
      <Title level={2}>房源列表</Title>

      {/* 搜索和筛选区域 */}
      <Card className="search-bar" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="输入关键词搜索房源..."
              enterButton={<SearchOutlined />}
              size="large"
              defaultValue={searchFilters.keyword}
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="选择区域"
              style={{ width: '100%' }}
              size="large"
              value={searchFilters.district}
              onChange={(value) => handleFilterChange('district', value)}
              allowClear
            >
              <Option value="朝阳区">朝阳区</Option>
              <Option value="海淀区">海淀区</Option>
              <Option value="西城区">西城区</Option>
              <Option value="东城区">东城区</Option>
              <Option value="丰台区">丰台区</Option>
              <Option value="石景山区">石景山区</Option>
              <Option value="昌平区">昌平区</Option>
              <Option value="顺义区">顺义区</Option>
              <Option value="通州区">通州区</Option>
              <Option value="大兴区">大兴区</Option>
              <Option value="房山区">房山区</Option>
              <Option value="门头沟区">门头沟区</Option>
              <Option value="平谷区">平谷区</Option>
              <Option value="怀柔区">怀柔区 </Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="房型"
              style={{ width: '100%' }}
              size="large"
              value={searchFilters.houseType}
              onChange={(value) => handleFilterChange('houseType', value)}
              allowClear
            >
              <Option value="一室一厅">一室一厅</Option>
              <Option value="两室一厅">两室一厅</Option>
              <Option value="两室两厅">两室两厅</Option>
              <Option value="三室一厅">三室一厅</Option>
              <Option value="三室两厅">三室两厅</Option>
              <Option value="四室两厅">四室两厅</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="装修情况"
              style={{ width: '100%' }}
              size="large"
              value={searchFilters.decoration}
              onChange={(value) => handleFilterChange('decoration', value)}
              allowClear
            >
              <Option value="毛坯">毛坯</Option>
              <Option value="简装">简装</Option>
              <Option value="精装">精装</Option>
              <Option value="豪装">豪装</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="朝向"
              style={{ width: '100%' }}
              size="large"
              value={searchFilters.orientation}
              onChange={(value) => handleFilterChange('orientation', value)}
              allowClear
            >
              <Option value="东">东</Option>
              <Option value="南">南</Option>
              <Option value="西">西</Option>
              <Option value="北">北</Option>
              <Option value="东南">东南</Option>
              <Option value="东北">东北</Option>
              <Option value="西南">西南</Option>
              <Option value="西北">西北</Option>
              <Option value="南北通透">南北通透</Option>
            </Select>
          </Col>
        </Row>

        {/* 价格筛选 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={12} sm={6} md={4}>
            <Input
              placeholder="最低价格"
              type="number"
              value={searchFilters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
              addonAfter="元"
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Input
              placeholder="最高价格"
              type="number"
              value={searchFilters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
              addonAfter="元"
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              type="primary"
              onClick={() => fetchHouses(searchFilters)}
              loading={loading}
            >
              搜索
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 房源列表 */}
      <Spin spinning={loading}>
        {houses.length > 0 ? (
          <>
            <Row gutter={[24, 24]}>
              {houses.map((house) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={house._id}>
                  <Card
                    hoverable
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
                            <EnvironmentOutlined /> {house.district}
                          </div>
                          <div className="house-card__info">
                            {house.area}㎡ · {house.houseType} · {house.floor}
                          </div>
                          <div className="house-card__tags">
                            <Space wrap>
                              <Tag color="blue">{house.orientation}</Tag>
                              <Tag color="green">{house.decoration}</Tag>
                              {house.facilities.slice(0, 2).map(facility => (
                                <Tag key={facility} color="orange">{facility}</Tag>
                              ))}
                            </Space>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            {/* 分页 */}
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                onChange={handlePageChange}
              />
            </div>
          </>
        ) : (
          <Empty description="暂无房源数据" />
        )}
      </Spin>
    </div>
  );
};

export default HouseList; 