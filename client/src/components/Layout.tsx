import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout as AntdLayout,
  Menu,
  Dropdown,
  Avatar,
  Button,
  Space,
  Typography,
  MenuProps
} from 'antd';
import {
  HomeOutlined,
  SearchOutlined,
  UserOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  DashboardOutlined,
  LogoutOutlined,
  LoginOutlined
} from '@ant-design/icons';
import useAuthStore from '../store/authStore';
import { UserRole } from '../types';

const { Header, Content, Footer } = AntdLayout;
const { Text } = Typography;

// 定义菜单项类型
type MenuItem = Required<MenuProps>['items'][number];

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 用户菜单
  const userMenuItems: MenuItem[] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile')
    },
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '个人中心',
      onClick: () => navigate('/dashboard')
    },
    ...(user?.role === UserRole.TENANT ? [
      {
        key: 'my-applications',
        icon: <UnorderedListOutlined />,
        label: '我的申请',
        onClick: () => navigate('/my-applications')
      }
    ] as MenuItem[] : []),
    ...(user?.role === UserRole.LANDLORD || user?.role === UserRole.ADMIN ? [
      {
        key: 'publish',
        icon: <PlusOutlined />,
        label: '发布房源',
        onClick: () => navigate('/publish')
      },
      {
        key: 'my-houses',
        icon: <UnorderedListOutlined />,
        label: '我的房源',
        onClick: () => navigate('/my-houses')
      },
      {
        key: 'received-applications',
        icon: <UnorderedListOutlined />,
        label: '收到的申请',
        onClick: () => navigate('/received-applications')
      }
    ] as MenuItem[] : []),
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  // 主导航菜单
  const mainMenuItems: MenuItem[] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页'
    },
    {
      key: '/houses',
      icon: <SearchOutlined />,
      label: '找房源'
    }
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <AntdLayout className="layout">
      <Header className="layout__header">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Text strong style={{ fontSize: 20, color: '#1890ff' }}>
                拼好房
              </Text>
            </Link>
          </div>

          {/* 主导航 */}
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={mainMenuItems}
            onClick={handleMenuClick}
            style={{ 
              border: 'none',
              backgroundColor: 'transparent',
              flex: 1,
              justifyContent: 'center'
            }}
          />

          {/* 用户操作区 */}
          <div>
            {isAuthenticated && user ? (
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar 
                    src={user.avatar} 
                    icon={<UserOutlined />}
                    size="small"
                  />
                  <Text>{user.username}</Text>
                </Space>
              </Dropdown>
            ) : (
              <Space>
                <Button 
                  type="text" 
                  icon={<LoginOutlined />}
                  onClick={() => navigate('/login')}
                >
                  登录
                </Button>
                <Button 
                  type="primary"
                  onClick={() => navigate('/register')}
                >
                  注册
                </Button>
              </Space>
            )}
          </div>
        </div>
      </Header>

      <Content className="layout__content">
        <Outlet />
      </Content>

      <Footer className="layout__footer">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Text type="secondary">
            房屋租赁网站 ©2025 Created by React + Node.js (xyao)
          </Text>
        </div>
      </Footer>
    </AntdLayout>
  );
};

export default Layout; 