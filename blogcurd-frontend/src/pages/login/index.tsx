import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi, LoginData, RegisterData } from '../../services/auth';
import { useAuthStore } from '../../store/auth';
import styles from './index.module.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const login = useAuthStore((state) => state.login);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');

  const onLogin = async (values: LoginData) => {
    setLoginError(''); // 清除之前的错误信息
    console.log('开始登录，参数：', values);
    try {
      setLoading(true);
      const response = await authApi.login(values);
      console.log('登录响应：', response);
      
      if (!response || !response.access_token) {
        console.error('登录响应缺少token或用户信息', response);
        throw new Error('登录响应缺少必要信息');
      }
      
      // 保存登录状态
      login(response.access_token, response.user);
      
      // 验证token是否已保存到localStorage
      const savedToken = localStorage.getItem('token');
      console.log('登录完成 - Token已保存:', !!savedToken, '值长度:', savedToken?.length);
      
      message.success('登录成功');
      
      // 获取之前尝试访问的页面路径
      const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
      console.log('重定向到:', from);
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('登录失败：', error);
      console.log('错误详情:', JSON.stringify(error));
      
      // 无论什么情况，都显示错误信息
      const errorMsg = '用户名或密码错误';
      message.error(errorMsg);
      setLoginError(errorMsg);
      
      loginForm.setFieldsValue({ password: '' });
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: RegisterData & { confirmPassword: string }) => {
    setRegisterError(''); // 清除之前的错误信息
    console.log('开始注册，参数：', values);
    try {
      setLoading(true);
      const { confirmPassword, ...registerData } = values;
      const response = await authApi.register(registerData);
      console.log('注册响应：', response);
      message.success('注册成功，请登录');
      setActiveTab('login');
      registerForm.resetFields();
    } catch (error: any) {
      console.error('注册失败：', error);
      
      // 处理特定错误
      let errorMsg = '注册失败，请重试';
      
      if (error.response) {
        if (error.response.status === 403) {
          errorMsg = '每个IP每天只能注册一个账号';
        } else if (error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      }
      
      message.error(errorMsg);
      setRegisterError(errorMsg);
      
      // 根据错误信息清除对应字段
      if (errorMsg.includes('用户名已存在')) {
        registerForm.setFieldsValue({ username: '' });
      } else if (errorMsg.includes('邮箱已被注册')) {
        registerForm.setFieldsValue({ email: '' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setLoginError('');
    setRegisterError('');
    loginForm.resetFields();
    registerForm.resetFields();
  };

  const items = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form
          form={loginForm}
          name="login"
          onFinish={onLogin}
          onFinishFailed={(errorInfo) => {
            console.log('登录表单验证失败:', errorInfo);
            const errorFields = errorInfo.errorFields || [];
            if (errorFields.length > 0) {
              const firstError = errorFields[0];
              const errorMsg = firstError.errors[0] || '请检查输入是否正确';
              message.error(errorMsg);
              setLoginError(errorMsg);
            } else {
              message.error('请检查输入是否正确');
              setLoginError('请检查输入是否正确');
            }
          }}
          autoComplete="off"
          initialValues={{ username: '', password: '' }}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入用户名（至少3个字符）" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
              { max: 20, message: '密码最多20个字符' }
            ]}
            style={{ marginBottom: '5px' }}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入密码（至少6个字符）" 
            />
          </Form.Item>

          <div 
            style={{ 
              color: '#ff4d4f', 
              fontSize: '14px', 
              height: '22px',
              marginBottom: '24px',
              padding: '0 0 4px 0',
              border: loginError ? '1px solid #ffccc7' : '1px solid transparent',
              backgroundColor: loginError ? '#fff2f0' : 'transparent',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '8px'
            }}
          >
            {loginError || ' '}
          </div>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form
          form={registerForm}
          name="register"
          onFinish={onRegister}
          onFinishFailed={(errorInfo) => {
            console.log('注册表单验证失败:', errorInfo);
            const errorFields = errorInfo.errorFields || [];
            if (errorFields.length > 0) {
              const firstError = errorFields[0];
              const errorMsg = firstError.errors[0] || '请检查输入是否正确';
              message.error(errorMsg);
              setRegisterError(errorMsg);
            } else {
              message.error('请检查输入是否正确');
              setRegisterError('请检查输入是否正确');
            }
          }}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入用户名（字母/数字/下划线）" 
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
              { max: 50, message: '邮箱长度不能超过50个字符' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="请输入有效的邮箱地址" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
              { max: 20, message: '密码最多20个字符' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码（至少6个字符）" 
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请再次输入密码" 
            />
          </Form.Item>

          <div 
            style={{ 
              color: '#ff4d4f', 
              fontSize: '14px', 
              height: registerError ? 'auto' : '22px',
              marginBottom: '24px',
              padding: registerError ? '8px' : '0 0 4px 0',
              border: registerError ? '1px solid #ffccc7' : '1px solid transparent',
              backgroundColor: registerError ? '#fff2f0' : 'transparent',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '8px'
            }}
          >
            {registerError || ' '}
          </div>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
            >
              注册
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          centered
          items={items}
        />
      </Card>
    </div>
  );
};

export default Login; 