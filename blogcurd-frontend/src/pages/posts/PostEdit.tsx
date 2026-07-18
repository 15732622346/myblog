import React, { useEffect, useCallback, useState } from 'react';
import { Form, Input, Button, Select, Card, message, Switch, Space, Upload, Modal, Table, Input as AntInput } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { postsApi, CreatePostDto } from '../../services/posts';
import { categoriesApi } from '../../services/categories';
import MDEditor, { commands } from '@uiw/react-md-editor';
import { imageService } from '../../services/image';
import { UploadOutlined, PictureOutlined, SearchOutlined, FileOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { filesApi, FileItem } from '../../services/files';
import { formatBytes } from '../../utils/format';

const PostEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);

  // 添加图片资源管理相关状态
  const [resourceModalVisible, setResourceModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resourcePage, setResourcePage] = useState<number>(1);
  const [content, setContent] = useState<string>('');

  // 获取分类列表
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  // 获取文章详情
  const { data: post } = useQuery({
    queryKey: ['posts', id],
    queryFn: () => postsApi.getPost(Number(id)),
    enabled: isEdit,
  });

  // 获取所有资源（不只图片）
  const [resourcesData, setResourcesData] = useState<any>(null);
  const [resourcesLoading, setResourcesLoading] = useState<boolean>(false);
  useEffect(() => {
    if (resourceModalVisible) {
      setResourcesLoading(true);
      filesApi.getFiles({ page: resourcePage, limit: 10, search: searchQuery || undefined })
        .then(data => setResourcesData(data))
        .finally(() => setResourcesLoading(false));
    }
  }, [resourceModalVisible, resourcePage, searchQuery]);

  // 表格数据
  const allResources = React.useMemo(() => {
    if (!resourcesData) return [];
    let items: FileItem[] = [];
    if ('items' in resourcesData && Array.isArray(resourcesData.items)) {
      items = resourcesData.items;
    }
    return items;
  }, [resourcesData]);

  // 总数
  const totalResources = React.useMemo(() => {
    if (!resourcesData) return 0;
    if ('meta' in resourcesData && resourcesData.meta && typeof resourcesData.meta.total === 'number') {
      return resourcesData.meta.total;
    }
    return allResources.length;
  }, [resourcesData, allResources]);

  // 创建或更新文章
  const mutation = useMutation({
    mutationFn: (data: CreatePostDto) => {
      if (isEdit && id) {
        return postsApi.updatePost(parseInt(id), data);
      }
      return postsApi.createPost(data);
    },
    onSuccess: () => {
      message.success(isEdit ? '文章更新成功' : '文章保存成功');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigate('/admin/posts');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '保存失败，请重试');
    },
  });

  // 当获取到文章详情时，设置表单初始值
  useEffect(() => {
    if (post) {
      form.setFieldsValue({
        title: post.title,
        content: post.content,
        status: post.status,
        is_pinned: post.is_pinned,
        category_ids: post.categories?.map(cat => cat.id),
      });
      setContent(post.content || '');
    }
  }, [post, form]);

  // 处理图片上传
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    try {
      const hide = message.loading('正在上传图片...', 0);
      
      const result = await imageService.upload(file, {
        bucket: 'blog-images',
        maxSize: 5 * 1024 * 1024, // 文章图片可以大一点，设置为5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      
      hide();
      message.success('图片上传成功');
      return result.url;
    } catch (error: any) {
      message.error('图片上传失败: ' + (error.message || '未知错误'));
      throw error;
    }
  }, []);

  // 本地上传图片
  const handleUploadImage: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    if (!file) return;
    
    setUploadLoading(true);
    try {
      const result = await imageService.upload(file as File, {
        bucket: 'blog-images',
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      
      // 插入Markdown格式的图片
      const filename = (file as File).name || '图片';
      const imageMarkdown = `![${filename}](${result.url})`;
      
      // 在当前内容后添加
      const newContent = content ? `${content}\n\n${imageMarkdown}` : imageMarkdown;
      setContent(newContent);
      form.setFieldValue('content', newContent);
      
      onSuccess?.(result);
      message.success('图片上传成功并已插入');
    } catch (error: any) {
      message.error('图片上传失败: ' + (error.message || '未知错误'));
      onError?.(error as Error);
    } finally {
      setUploadLoading(false);
    }
  };

  // 打开资源选择弹窗
  const openResourceModal = () => {
    setResourceModalVisible(true);
    setSearchQuery('');
  };
  
  // 处理资源搜索
  const handleResourceSearch = (value: string) => {
    setSearchQuery(value);
    setResourcePage(1);
  };
  
  // 插入资源（图片或文件）
  const handleInsertResource = (file: FileItem) => {
    if (!file.file_path) {
      message.error('文件路径不存在');
      return;
    }
    let markdown = '';
    if (file.mime_type?.startsWith('image/')) {
      markdown = `![${file.original_name || '图片'}](${file.file_path})`;
    } else if (
      file.mime_type === 'application/vnd.android.package-archive' ||
      file.original_name?.toLowerCase().endsWith('.apk')
    ) {
      markdown = `[${file.original_name || '下载APK'}](${file.file_path})`;
    } else {
      markdown = `[${file.original_name || '下载文件'}](${file.file_path})`;
    }
    const newContent = content ? `${content}\n\n${markdown}` : markdown;
    setContent(newContent);
    form.setFieldValue('content', newContent);
    message.success('资源链接已插入');
    setResourceModalVisible(false);
  };
  
  // 处理分页
  const handleResourcePageChange = (page: number) => {
    setResourcePage(page);
  };

  // 自定义图片上传命令
  const imageUploadCommand = {
    ...commands.image,
    execute: async (_state: any, api: any) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) {
          try {
            const imageUrl = await handleImageUpload(file);
            const imageMarkdown = `![${file.name}](${imageUrl})`;
            api.replaceSelection(imageMarkdown);
          } catch (error) {
            console.error('Image upload failed:', error);
          }
        }
      };
      input.click();
    },
  };

  const onFinish = (values: any) => {
    const postData: CreatePostDto = {
      title: values.title,
      content: values.content,
      status: values.status,
      is_pinned: values.is_pinned || false,
      category_ids: values.category_ids,
    };
    mutation.mutate(postData);
  };

  return (
    <Card title={isEdit ? "编辑文章" : "新建文章"}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          status: 'draft',
          is_pinned: false,
        }}
      >
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入文章标题' }]}
        >
          <Input placeholder="请输入文章标题" />
        </Form.Item>

        <Form.Item
          name="content"
          label="内容"
          rules={[{ required: true, message: '请输入文章内容' }]}
        >
          <div>
            <MDEditor 
              height={400}
              commands={[
                ...commands.getCommands(),
                imageUploadCommand,
              ]}
              value={content}
              onChange={(value) => {
                setContent(value || '');
                form.setFieldValue('content', value || '');
              }}
            />
            <div style={{ marginTop: '10px' }}>
              <Space>
                <Upload
                  customRequest={handleUploadImage}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button 
                    type="primary" 
                    icon={<UploadOutlined />} 
                    loading={uploadLoading}
                  >
                    从本地添加图片
                  </Button>
                </Upload>
                <Button 
                  icon={<PictureOutlined />} 
                  onClick={openResourceModal}
                >
                  选择已上传图片
                </Button>
              </Space>
            </div>
          </div>
        </Form.Item>

        <Space size="large">
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择文章状态' }]}
          >
            <Select style={{ width: 200 }}>
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="published">发布</Select.Option>
              <Select.Option value="private">私密</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="category_ids"
            label="分类"
            rules={[{ required: true, message: '请选择至少一个分类' }]}
          >
            <Select 
              mode="multiple" 
              placeholder="请选择分类"
              style={{ width: 300 }}
              options={categories.map(cat => ({
                label: cat.name,
                value: cat.id,
              }))}
            />
          </Form.Item>

          <Form.Item name="is_pinned" label="置顶" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Space>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            {isEdit ? '更新文章' : '发布文章'}
          </Button>
        </Form.Item>
      </Form>

      {/* 资源选择弹窗 */}
      <Modal
        title="选择文件资源"
        open={resourceModalVisible}
        onCancel={() => setResourceModalVisible(false)}
        footer={null}
        width={800}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <AntInput.Search
            placeholder="搜索文件..."
            onSearch={handleResourceSearch}
            style={{ marginBottom: 16 }}
            prefix={<SearchOutlined />}
          />
          <Table
            columns={[
              {
                title: '预览',
                dataIndex: 'file_path',
                key: 'preview',
                width: 100,
                render: (path: string, record: FileItem) =>
                  record.mime_type?.startsWith('image/') ? (
                    <div style={{ width: '60px', height: '60px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img 
                        src={path} 
                        alt={record.original_name} 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                      />
                    </div>
                  ) : (
                    <FileOutlined style={{ fontSize: 32, color: '#aaa' }} />
                  )
              },
              {
                title: '文件名',
                dataIndex: 'original_name',
                key: 'filename',
                ellipsis: true,
              },
              {
                title: '文件大小',
                dataIndex: 'size',
                key: 'size',
                width: 120,
                render: (size: number) => formatBytes(size)
              },
              {
                title: '操作',
                key: 'action',
                width: 100,
                render: (_: any, record: FileItem) => (
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => handleInsertResource(record)}
                  >
                    插入
                  </Button>
                )
              }
            ]}
            dataSource={allResources}
            rowKey="id"
            loading={resourcesLoading}
            pagination={{
              current: resourcePage,
              pageSize: 10,
              total: totalResources,
              onChange: handleResourcePageChange,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        </Space>
      </Modal>
    </Card>
  );
};

export default PostEdit; 