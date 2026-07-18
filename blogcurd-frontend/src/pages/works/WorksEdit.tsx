import React, { useState, useEffect } from 'react';
import { Card, Form, Button, message, Spin, Switch, Space, Modal, Upload, Input, Table, Popconfirm } from 'antd';
import { UploadOutlined, PictureOutlined, FileOutlined } from '@ant-design/icons';
import MDEditor from '@uiw/react-md-editor';
import { worksApi } from '../../services/works';
import { filesApi, FileItem } from '../../services/files';

const WorksEdit: React.FC = () => {
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [workId, setWorkId] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);

  // 资源选择相关状态
  const [resourceModalVisible, setResourceModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resourcePage, setResourcePage] = useState<number>(1);

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

  // 获取当前用户的作品内容
  useEffect(() => {
    const fetchWork = async () => {
      try {
        setLoading(true);
        const response = await worksApi.getMyWorks();
        const workData = Array.isArray(response.data) ? response.data[0] : response.data;
        setTitle(workData?.title || '');
        setContent(workData?.content || '');
        setWorkId(workData?.id || null);
      } catch (error) {
        message.error('获取作品内容失败');
      } finally {
        setLoading(false);
      }
    };
    fetchWork();
  }, []);

  // 保存作品
  const handleSave = async () => {
    if (!title.trim()) {
      message.error('请输入作品标题');
      return;
    }
    try {
      setSaving(true);
      if (workId) {
        await worksApi.updateWork(workId, { title, content });
        message.success('作品更新成功');
      } else {
        const res = await worksApi.createWork({ title, content });
        setWorkId(res.data?.id || null);
        message.success('作品创建成功');
      }
    } catch (error) {
      message.error('保存作品失败');
    } finally {
      setSaving(false);
    }
  };

  // 删除作品
  const handleDelete = async () => {
    if (!workId) return;
    try {
      setDeleting(true);
      await worksApi.deleteWork(workId);
      message.success('作品已删除');
      setTitle('');
      setContent('');
      setWorkId(null);
    } catch (error) {
      message.error('删除作品失败');
    } finally {
      setDeleting(false);
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
    setContent(prevContent => prevContent ? `${prevContent}\n\n${markdown}` : markdown);
    message.success('资源链接已插入');
    setResourceModalVisible(false);
  };

  // 处理分页
  const handleResourcePageChange = (page: number) => {
    setResourcePage(page);
  };

  // 处理本地图片上传
  const handleUploadImage = async (options: any) => {
    const { file, onSuccess, onError } = options;
    if (!file) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file as File);
      const result = await filesApi.uploadImage(formData);
      const filename = (file as File).name || '图片';
      const imageMarkdown = `![${filename}](${result.url})`;
      setContent(prevContent => prevContent ? `${prevContent}\n\n${imageMarkdown}` : imageMarkdown);
      onSuccess?.(result);
      message.success('图片上传成功并已插入');
    } catch (error: any) {
      message.error('图片上传失败: ' + (error.message || '未知错误'));
      onError?.(error as Error);
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <Card 
      title="作品管理" 
      extra={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: 8 }}>预览模式</span>
          <Switch 
            checked={previewMode} 
            onChange={setPreviewMode} 
          />
        </div>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Form layout="vertical">
            <Form.Item label="作品标题" required>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="请输入作品标题"
                maxLength={255}
                showCount
              />
            </Form.Item>
            <Form.Item label="作品内容">
              <div data-color-mode="light">
                <MDEditor
                  value={content}
                  onChange={value => setContent(value || '')}
                  preview={previewMode ? 'preview' : 'edit'}
                  height={400}
                />
              </div>
              <div style={{ marginTop: '10px' }}>
                <Space>
                  <Upload
                    customRequest={handleUploadImage}
                    showUploadList={false}
                    accept="image/*,.apk,application/vnd.android.package-archive"
                  >
                    <Button 
                      type="primary" 
                      icon={<UploadOutlined />} 
                      loading={uploadLoading}
                    >
                      从本地添加文件
                    </Button>
                  </Upload>
                  <Button 
                    icon={<PictureOutlined />} 
                    onClick={openResourceModal}
                  >
                    选择已上传文件
                  </Button>
                </Space>
              </div>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  onClick={handleSave} 
                  loading={saving}
                >
                  {workId ? '更新作品' : '创建作品'}
                </Button>
                {workId && (
                  <Popconfirm
                    title="确定要删除这个作品吗？"
                    description="删除后将无法恢复。"
                    onConfirm={handleDelete}
                    okText="确定"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                  >
                    <Button 
                      danger
                      loading={deleting}
                    >
                      删除作品
                    </Button>
                  </Popconfirm>
                )}
              </Space>
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
              <Input.Search
                placeholder="搜索文件..."
                onSearch={handleResourceSearch}
                style={{ marginBottom: 16 }}
                prefix={<PictureOutlined />}
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
                    render: (size: number) => `${(size / 1024).toFixed(1)} KB`
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
        </>
      )}
    </Card>
  );
};

export default WorksEdit; 