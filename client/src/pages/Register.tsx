import React, { useState } from 'react';
import { Form, Input, Button, Typography, Card, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  phone: string;
  role: string;
}

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const onFinish = async (values: RegisterFormData) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    
    setLoading(true);
    
    try {
      const { confirmPassword, ...userData } = values;
      await axios.post('/api/auth/register', userData);
      message.success('注册成功，请登录');
      navigate('/login');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        message.error(error.response.data.message || '注册失败，请重试');
      } else {
        message.error('注册失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="register-container" style={{ maxWidth: '400px', margin: '50px auto' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>注册账号</Title>
        
        <Form
          name="register"
          initialValues={{ role: 'tenant' }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>
          
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="手机号" />
          </Form.Item>
          
          <Form.Item name="role">
            <div className="role-selection">
              <Button.Group style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  style={{ width: '50%' }} 
                  onClick={() => document.querySelector<HTMLInputElement>('input[name="register_role"]')!.value = 'tenant'}
                >
                  我是租客
                </Button>
                <Button 
                  style={{ width: '50%' }} 
                  onClick={() => document.querySelector<HTMLInputElement>('input[name="register_role"]')!.value = 'landlord'}
                >
                  我是房东
                </Button>
              </Button.Group>
              <input type="hidden" name="register_role" defaultValue="tenant" />
            </div>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
              注册
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
            已有账号？ <a href="/login" onClick={(e) => {e.preventDefault(); navigate('/login')}}>立即登录</a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register; 