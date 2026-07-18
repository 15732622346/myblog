import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { FileTextOutlined, TagsOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';

interface Statistics {
  postCount: number;
  categoryCount: number;
  userCount: number;
  totalViews: number;
}

const Dashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics>({
    postCount: 0,
    categoryCount: 0,
    userCount: 0,
    totalViews: 0,
  });

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const response = await axios.get(`${API_URL}/statistics`);
        setStatistics(response.data);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      }
    };

    fetchStatistics();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="文章总数"
              value={statistics.postCount}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="分类总数"
              value={statistics.categoryCount}
              prefix={<TagsOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={statistics.userCount}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总访问量"
              value={statistics.totalViews}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 
