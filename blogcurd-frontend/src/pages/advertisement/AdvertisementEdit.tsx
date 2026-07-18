import React, { useState, useEffect } from 'react';
import { Card, Form, Button, message, Switch, Spin, Popconfirm, Space, Modal, Table, Input, Upload } from 'antd';
import { SearchOutlined, CopyOutlined, PictureOutlined, UploadOutlined, FileOutlined } from '@ant-design/icons';
import MDEditor from '@uiw/react-md-editor';
import { advertisementApi } from '../../services/advertisements';
import { useQuery } from '@tanstack/react-query';
import { filesApi, FileItem } from '../../services/files';
import { formatBytes } from '../../utils/format';
import type { UploadProps } from 'antd';
import { imageService } from '../../services/image';

const AdvertisementEdit: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [adId, setAdId] = useState<number | null>(null);
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

  // 获取当前用户的广告内容
  useEffect(() => {
    const fetchAdvertisement = async () => {
      try {
        setLoading(true);
        const response = await advertisementApi.getMyAdvertisement();
        // 修复：正确提取response.data
        const adData = response.data;
        console.log('获取到的广告数据:', adData); // 添加日志帮助调试
        setContent(adData?.content || '');
        setAdId(adData?.id || null);
      } catch (error) {
        console.error('获取广告失败:', error);
        message.error('获取广告内容失败');
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertisement();
  }, []);

  // 保存广告
  const handleSave = async () => {
    try {
      setSaving(true);
      await advertisementApi.updateAdvertisement(content);
      message.success('广告更新成功');
    } catch (error) {
      console.error('保存广告失败:', error);
      message.error('保存广告失败');
    } finally {
      setSaving(false);
    }
  };

  // 删除广告
  const handleDelete = async () => {
    if (!adId) return;
    
    try {
      setDeleting(true);
      await advertisementApi.deleteAdvertisement(adId);
      message.success('广告已删除');
      setContent('');
      setAdId(null);
    } catch (error) {
      console.error('删除广告失败:', error);
      message.error('删除广告失败');
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

  // 广告示例模板
  const setExampleTemplate = () => {
    const template = `# 广告标题

这里是广告内容，支持Markdown格式。

## 功能特点
- 支持添加图片
- 支持添加链接
- 支持添加列表

## 图片说明
* 点击"选择已上传图片"按钮可以从资源管理中选择图片
* 可以直接将图片链接粘贴到编辑器中
* 图片将显示在博客前台的广告位置

## 联系方式
- 网站: [我的网站](https://example.com)
- 邮箱: example@example.com
`;
    setContent(template);
  };
  
  // 处理本地图片上传
  const handleUploadImage: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    if (!file) return;
    
    setUploadLoading(true);
    try {
      const result = await imageService.upload(file as File, {
        bucket: 'blog-images',
        maxSize: 5 * 1024 * 1024, // 广告图片可以大一点
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      
      // 插入Markdown格式的图片
      const filename = (file as File).name || '图片';
      const imageMarkdown = `![${filename}](${result.url})`;
      
      // 在当前内容后添加
      setContent(prevContent => {
        return prevContent ? `${prevContent}\n\n${imageMarkdown}` : imageMarkdown;
      });
      
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
      title="广告管理" 
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
            <Form.Item label="广告内容">
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
            </Form.Item>

            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  onClick={handleSave} 
                  loading={saving}
                >
                  更新广告
                </Button>
                
                <Button 
                  onClick={setExampleTemplate}
                >
                  使用示例模板
                </Button>

                {adId && (
                  <Popconfirm
                    title="确定要删除这个广告吗？"
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
                      删除广告
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </Form.Item>
          </Form>
          
          <div style={{ marginTop: 16 }}>
            <p>广告说明:</p>
            <ul>
              <li>广告内容支持Markdown格式</li>
              <li>内容将显示在博客前台的左侧区域</li>
              <li>可以添加图片、链接和其他格式化内容</li>
              <li>点击资源管理中选择图片后复制链接，然后在编辑器中粘贴使用</li>
              <li>建议保持内容简洁，不要过长</li>
            </ul>
          </div>
          
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
        </>
      )}
    </Card>
  );
};

export default AdvertisementEdit; 