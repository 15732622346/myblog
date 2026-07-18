import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  Space,
  message,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  UploadOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';
import type { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import { updateProfile, changePassword } from '../../services/users';
import request from '../../utils/request';
import { imageService } from '../../services/image';

const Profile: React.FC = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const { user, setUser } = useAuthStore();
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [loading, setLoading] = useState(false);

  // 处理头像URL，确保显示正确
  useEffect(() => {
    if (user?.avatar) {
      const avatarUrl = user.avatar;
      console.log('头像获取URL: 原始URL = ', avatarUrl);
      
      // 处理不完整路径
      if (avatarUrl.startsWith('undefined/')) {
        // 使用API代理URL而非直接访问MinIO
        const fixedUrl = `/api/files/proxy/${avatarUrl.replace('undefined/', '')}`;
        console.log('头像获取URL: 修复不完整路径后 = ', fixedUrl);
        setAvatar(fixedUrl);
      } else if (avatarUrl.includes('localhost:9000')) {
        // 如果URL包含MinIO直接访问地址(9000端口)，替换为API代理
        const parts = avatarUrl.split('/');
        const bucketIndex = parts.findIndex(p => p === 'blog-avatars');
        if (bucketIndex >= 0) {
          const bucket = parts[bucketIndex];
          const objectPath = parts.slice(bucketIndex + 1).join('/');
          const displayUrl = `/api/files/proxy/${bucket}/${objectPath}`;
          console.log('头像获取URL: 替换MinIO直接URL为代理 = ', displayUrl);
          setAvatar(displayUrl);
        } else {
          console.log('头像获取URL: 保持原URL不变 = ', avatarUrl);
          setAvatar(avatarUrl);
        }
      } else {
        console.log('头像获取URL: 使用标准格式URL = ', avatarUrl);
        setAvatar(avatarUrl);
      }
    } else {
      console.log('头像获取URL: 用户无头像');
    }
  }, [user?.avatar]);

  // 设置表单初始值
  useEffect(() => {
    if (user) {
      console.log('用户信息更新，设置表单值:', user);
      // 当user数据更新时，更新表单值
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        nickname: user.nickname || '',
        bio: user.bio || ''
      });
    }
  }, [user, form]);
  
  // 页面加载时获取最新的用户信息
  useEffect(() => {
    // 获取最新的用户资料
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await request.get('/users/profile');
        const profileData = response.data;
        console.log('获取到的用户资料:', profileData);
        
        // 更新全局状态
        if (profileData) {
          // 直接设置新的用户信息，不依赖当前user状态
          setUser(profileData);
        }
      } catch (error) {
        console.error('获取用户资料失败:', error);
        message.error('获取用户资料失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [setUser]);

  // 头像上传前的校验
  const beforeUpload = (file: RcFile) => {
    try {
      // 使用imageService的验证逻辑
      imageService.validateFile(file, {
        maxSize: 2 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png'],
        bucket: 'blog-avatars'
      });
      return true;
    } catch (error) {
      message.error(error.message);
      return false;
    }
  };

  // 处理头像上传
  const handleAvatarChange = async (info: UploadChangeParam<UploadFile<any>>) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      try {
        // 使用后端直接返回的URL，无需通过imageService再次处理
        const responseUrl = info.file.response?.url;
        console.log('头像获取URL: 后端返回的URL = ', responseUrl);

        if (!responseUrl) {
          throw new Error('服务器未返回有效的URL');
        }

        // 更新用户头像
        const updateData = { avatar: responseUrl };
        console.log('头像获取URL: 上传成功，服务器返回URL = ', responseUrl);
        const response = await request.patch('/users/profile', updateData);
        
        if (response.data) {
          setUser(response.data);
          message.success('头像更新成功');
        }
      } catch (error) {
        let errorMsg = '头像更新失败: 未知错误';
        if (error instanceof Error) {
          errorMsg = '头像更新失败: ' + error.message;
        }
        message.error(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  // 处理基本信息更新
  const handleUpdateProfile = async (values: any) => {
    try {
      setLoading(true);
      await updateProfile(values);
      setUser({ ...user!, ...values });
      message.success('个人信息更新成功');
    } catch (error) {
      message.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理密码更新
  const handleUpdatePassword = async (values: any) => {
    try {
      setLoading(true);
      // 调用修改密码API
      await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });
      message.success('密码更新成功');
      passwordForm.resetFields();
    } catch (error: any) {
      // 显示具体错误信息
      const errorMsg = error.response?.data?.message || '密码更新失败，请重试';
      message.error(errorMsg);
      if (errorMsg.includes('当前密码错误')) {
        passwordForm.setFieldsValue({ oldPassword: '' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        {/* 基本信息卡片 */}
        <Col span={24}>
          <Card title="基本信息" variant="outlined">
            <Row gutter={16}>
              <Col span={6} style={{ textAlign: 'center' }}>
                <Space direction="vertical" size="large">
                  <Avatar
                    size={120}
                    icon={<UserOutlined />}
                    src={avatar}
                    onLoad={() => console.log('头像获取URL: 图片成功加载 = ', avatar)}
                    onError={() => console.log('头像获取URL: 图片加载失败 = ', avatar)}
                  />
                  <Upload
                    name="file"
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    onChange={handleAvatarChange}
                    action="/api/files/upload/avatar"
                    headers={{
                      Authorization: `Bearer ${localStorage.getItem('token')}`,
                    }}
                    maxCount={1}
                    accept="image/png,image/jpeg"
                  >
                    <Button icon={<UploadOutlined />} loading={loading}>
                      {loading ? '上传中...' : '更换头像'}
                    </Button>
                  </Upload>
                </Space>
              </Col>
              <Col span={18}>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleUpdateProfile}
                  initialValues={{
                    username: user?.username,
                    email: user?.email,
                    nickname: user?.nickname || '',
                    bio: user?.bio || '',
                  }}
                >
                  <Form.Item
                    name="username"
                    label="用户名"
                  >
                    <Input disabled prefix={<UserOutlined />} />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} />
                  </Form.Item>
                  <Form.Item
                    name="nickname"
                    label="昵称"
                    rules={[
                      { max: 15, message: '昵称最多15个字符' }
                    ]}
                  >
                    <Input 
                      prefix={<EditOutlined />} 
                      maxLength={15}
                      showCount
                      placeholder="请输入昵称(最多15个字符)"
                    />
                  </Form.Item>
                  <Form.Item
                    name="bio"
                    label="个人简介"
                    rules={[
                      { max: 15, message: '个人简介最多15个字符' }
                    ]}
                  >
                    <Input.TextArea 
                      rows={4} 
                      maxLength={15}
                      showCount
                      placeholder="请输入个人简介(最多15个字符)"
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      保存修改
                    </Button>
                  </Form.Item>
                </Form>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 安全设置卡片 */}
        <Col span={24}>
          <Card title="安全设置" variant="outlined">
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleUpdatePassword}
            >
              <Form.Item
                name="oldPassword"
                label="当前密码"
                rules={[
                  { required: true, message: '请输入当前密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="输入当前密码"
                />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6个字符' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('oldPassword') !== value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('新密码不能与当前密码相同'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="输入新密码"
                />
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
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="确认新密码"
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  更新密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;