import { useState } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  FileTextOutlined,
  TagOutlined,
  FileImageOutlined,
  UserOutlined,
  LogoutOutlined,
  NotificationOutlined,
  FileOutlined
} from '@ant-design/icons';
import { Layout, Menu, Button, theme, Dropdown } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const getMenuItems = (role: string) => {
    const baseMenuItems = [
      {
        key: '/admin/posts',
        icon: <FileTextOutlined />,
        label: '文章管理',
      },
      {
        key: '/admin/categories',
        icon: <TagOutlined />,
        label: '分类管理',
      },
      {
        key: '/admin/resume',
        icon: <UserOutlined />,
        label: '个人简历',
      },
      {
        key: '/admin/works',
        icon: <FileImageOutlined />,
        label: '作品管理',
      },
    ];
    
    const adminDashboardItem = {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    };
    
    const userOnlyMenuItems = [
      {
        key: '/admin/advertisement',
        icon: <NotificationOutlined />,
        label: '广告管理',
      },
    ];
    
    const adminOnlyMenuItems = [
      {
        key: '/admin/files',
        icon: <FileOutlined />,
        label: '文件管理',
      },
    ];
    
    if (role === 'admin') {
      return [adminDashboardItem, ...adminOnlyMenuItems, ...baseMenuItems];
    }
    
    return [...baseMenuItems, ...userOnlyMenuItems];
  };

  const userMenuItems = [
    {
      key: '/admin/profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  const handleMenuClick = (key: string) => {
    console.log('菜单点击:', key);
    navigate(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/');
    } else {
      navigate(key);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: collapsed ? '12px' : '14px',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}>
          {!collapsed && '博客管理后台'}
          {collapsed && '博客'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems(user?.role || 'user')}
          onClick={({ key }) => handleMenuClick(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <div style={{ float: 'right', marginRight: 24 }}>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
            >
              <Button type="text" icon={<UserOutlined />}>
                {user?.username}
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: 8,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 