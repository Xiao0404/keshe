import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Form, 
  Input, 
  Button, 
  Avatar, 
  Upload, 
  message,
  Divider,
  Space
} from 'antd';
import { UserOutlined, UploadOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import useAuthStore from '../store/authStore';

const { Title } = Typography;

const Profile: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 更新个人信息
  const handleUpdateProfile = async (values: any) => {
    try {
      setLoading(true);
      await updateProfile(values);
      message.success('个人信息更新成功');
      setEditMode(false);
    } catch (error) {
      message.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (values: any) => {
    try {
      setLoading(true);
      await changePassword(values.currentPassword, values.newPassword);
      message.success('密码修改成功');
      setPasswordMode(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error('密码修改失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 头像上传
  const handleAvatarChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setFileList(fileList);
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
      <Card>
        <Title level={2}>个人信息</Title>
        
        {/* 头像区域 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Avatar 
            size={100} 
            src={user.avatar} 
            icon={<UserOutlined />}
            style={{ marginBottom: 16 }}
          />
          <div>
            <Upload
              fileList={fileList}
              onChange={handleAvatarChange}
              beforeUpload={() => false}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>更换头像</Button>
            </Upload>
          </div>
        </div>

        <Divider />

        {/* 基本信息 */}
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {!editMode ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3}>基本信息</Title>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  onClick={() => setEditMode(true)}
                >
                  编辑信息
                </Button>
              </div>
              
              <div style={{ fontSize: 16, lineHeight: 2 }}>
                <div><strong>用户名：</strong>{user.username}</div>
                <div><strong>邮箱：</strong>{user.email}</div>
                <div><strong>手机号：</strong>{user.phone}</div>
                <div><strong>用户角色：</strong>
                  ```typescript
                  {user.role === 'tenant' ? '租客' : user.role === 'landlord' ? '房东' : '管理员'}
                </div>
                <div><strong>注册时间：</strong>{new Date(user.createdAt).toLocaleDateString()}</div>
                <div><strong>最后登录：</strong>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '未知'}</div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3}>编辑信息</Title>
                <Button onClick={() => setEditMode(false)}>取消</Button>
              </div>
              
              <Form
                form={profileForm}
                layout="vertical"
                initialValues={{
                  username: user.username,
                  phone: user.phone
                }}
                onFinish={handleUpdateProfile}
              >
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 2, max: 20, message: '用户名长度为2-20个字符' }
                  ]}
                >
                  <Input />
                </Form.Item>
                
                <Form.Item
                  name="phone"
                  label="手机号"
                  rules={[
                    { required: true, message: '请输入手机号' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                  ]}
                >
                  <Input />
                </Form.Item>
                
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      保存修改
                    </Button>
                    <Button onClick={() => setEditMode(false)}>
                      取消
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          )}
          
          <Divider />
          
          {/* 密码修改 */}
          {!passwordMode ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3}>密码设置</Title>
                <Button 
                  icon={<LockOutlined />}
                  onClick={() => setPasswordMode(true)}
                >
                  修改密码
                </Button>
              </div>
              <div style={{ color: '#8c8c8c' }}>
                为了您的账户安全，建议定期更换密码
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3}>修改密码</Title>
                <Button onClick={() => setPasswordMode(false)}>取消</Button>
              </div>
              
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handleChangePassword}
              >
                <Form.Item
                  name="currentPassword"
                  label="当前密码"
                  rules={[{ required: true, message: '请输入当前密码' }]}
                >
                  <Input.Password />
                </Form.Item>
                
                <Form.Item
                  name="newPassword"
                  label="新密码"
                  rules={[
                    { required: true, message: '请输入新密码' },
                    { min: 6, message: '密码至少6个字符' }
                  ]}
                >
                  <Input.Password />
                </Form.Item>
                
                <Form.Item
                  name="confirmPassword"
                  label="确认新密码"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: '请确认新密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'));
                      },
                    }),
                  ]}
                >
                  <Input.Password />
                </Form.Item>
                
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      修改密码
                    </Button>
                    <Button onClick={() => setPasswordMode(false)}>
                      取消
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Profile;