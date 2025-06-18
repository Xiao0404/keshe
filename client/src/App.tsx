import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// 导入页面组件
import Layout from 'components/Layout';
import Home from 'pages/Home';
import Login from 'pages/Login';
import Register from 'pages/Register';
import HouseList from 'pages/HouseList';
import HouseDetail from 'pages/HouseDetail';
import Profile from 'pages/Profile';
import Dashboard from 'pages/Dashboard';
import PublishHouse from 'pages/PublishHouse';
import MyHouses from 'pages/MyHouses';
import MyApplications from 'pages/MyApplications';
import ReceivedApplications from 'pages/ReceivedApplications';

// 导入状态管理
import useAuthStore from 'store/authStore';

// 导入样式
import './App.css';

// 设置dayjs中文
dayjs.locale('zh-cn');

// 路由保护组件
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ 
  children, 
  roles 
}) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// 公开路由组件（已登录用户不能访问）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // 应用启动时检查认证状态
    checkAuth();
  }, [checkAuth]);

  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <Router>
          <div className="app">
            <Routes>
              {/* 公开路由 */}
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              
              {/* 需要Layout的路由 */}
              <Route path="/" element={<Layout />}>
                {/* 首页 */}
                <Route index element={<Home />} />
                
                {/* 房屋相关 */}
                <Route path="houses" element={<HouseList />} />
                <Route path="houses/:id" element={<HouseDetail />} />
                
                {/* 需要认证的路由 */}
                <Route path="profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                
                <Route path="dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                {/* 房东专用路由 */}
                <Route path="publish" element={
                  <ProtectedRoute roles={['landlord', 'admin']}>
                    <PublishHouse />
                  </ProtectedRoute>
                } />
                
                <Route path="my-houses" element={
                  <ProtectedRoute roles={['landlord', 'admin']}>
                    <MyHouses />
                  </ProtectedRoute>
                } />
                
                <Route path="received-applications" element={
                  <ProtectedRoute roles={['landlord', 'admin']}>
                    <ReceivedApplications />
                  </ProtectedRoute>
                } />
                
                {/* 租客专用路由 */}
                <Route path="my-applications" element={
                  <ProtectedRoute roles={['tenant']}>
                    <MyApplications />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* 404页面 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App; 