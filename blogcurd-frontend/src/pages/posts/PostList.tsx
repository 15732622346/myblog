import React, { useEffect } from 'react';
import { Table, Space, Button, Tag, message, Form, Input, DatePicker, Select, Card, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { postsApi, Post, PostsQueryParams } from '../../services/posts';
import { categoriesApi } from '../../services/categories';
import { useAuthStore } from '../../store/auth';

const { RangePicker } = DatePicker;

const PostList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = React.useState<PostsQueryParams>({});
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const user = useAuthStore((state) => state.user);

  // 获取分类列表
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => {
      console.log('获取分类列表...');
      return categoriesApi.getCategories();
    },
    enabled: isInitialized && isAuthenticated,
  });

  // 获取文章列表
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', searchParams],
    queryFn: () => {
      console.log('获取文章列表...');
      return postsApi.getPosts(searchParams);
    },
    enabled: isInitialized && isAuthenticated && !!user,
  });

  // 组件挂载时预取数据
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      queryClient.prefetchQuery({
        queryKey: ['posts', searchParams],
        queryFn: () => postsApi.getPosts(searchParams),
      });
      queryClient.prefetchQuery({
        queryKey: ['categories'],
        queryFn: () => categoriesApi.getCategories(),
      });
    }
  }, [isInitialized, isAuthenticated, user, queryClient, searchParams]);

  const deleteMutation = useMutation({
    mutationFn: postsApi.deletePost,
    onSuccess: () => {
      message.success('文章删除成功');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleSearch = (values: any) => {
    const { dateRange, ...rest } = values;
    const params: PostsQueryParams = {
      ...rest,
      startTime: dateRange?.[0]?.toISOString(),
      endTime: dateRange?.[1]?.toISOString(),
    };
    setSearchParams(params);
  };

  const handleReset = () => {
    form.resetFields();
    setSearchParams({});
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const columns: ColumnsType<Post> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <a>{text}</a>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'published' ? 'green' : status === 'draft' ? 'gold' : 'blue'}>
          {status === 'published' ? '已发布' : status === 'draft' ? '草稿' : '私密'}
        </Tag>
      ),
    },
    {
      title: '分类',
      key: 'categories',
      render: (_, record) => (
        <>
          {record.categories?.map((category) => (
            <Tag key={category.id}>{category.name}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '浏览量',
      dataIndex: 'view_count',
      key: 'view_count',
    },
    {
      title: '点赞数',
      dataIndex: 'like_count',
      key: 'like_count',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/posts/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这篇文章吗？"
            description="删除后将无法恢复。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending && deleteMutation.variables === record.id}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword">
            <Input placeholder="搜索标题或内容" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="dateRange">
            <RangePicker showTime style={{ width: 380 }} />
          </Form.Item>
          <Form.Item name="categoryId">
            <Select
              placeholder="选择分类"
              style={{ width: 200 }}
              allowClear
              options={categories?.map(cat => ({
                label: cat.name,
                value: cat.id,
              }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              搜索
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={handleReset}>
              重置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={() => navigate('/admin/posts/create')}>
            新建文章
          </Button>
        </div>

        <Table<Post>
          columns={columns}
          dataSource={posts}
          rowKey="id"
          loading={isLoading}
        />
      </Card>
    </div>
  );
};

export default PostList;
