import React, { useState } from 'react';
import { 
  Card, 
  Table, 
  Image, 
  Button, 
  Input, 
  Space, 
  Popconfirm, 
  message, 
  Tabs,
  Upload,
  Modal
} from 'antd';
import {
  SearchOutlined,
  UploadOutlined,
  DeleteOutlined,
  CopyOutlined,
  EyeOutlined,
  FileImageOutlined,
  FileOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi, FileItem, FileQueryParams } from '../../services/files';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { formatBytes } from '../../utils/format';

// 扩展FileQueryParams类型，添加search字段
interface ExtendedFileQueryParams extends FileQueryParams {
  search?: string;
}

// 定义响应类型，包含两种可能的结构
interface FilesResponseType {
  items?: FileItem[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  data?: {
    items: FileItem[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

const ResourceManager: React.FC = () => {
  const [searchParams, setSearchParams] = useState<ExtendedFileQueryParams>({ page: 1, limit: 10 });
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [uploadVisible, setUploadVisible] = useState<boolean>(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);

  const queryClient = useQueryClient();

  console.log('ResourceManager 渲染启动');

  // 获取文件列表
  const { data: filesData, isLoading } = useQuery({
    queryKey: ['files', searchParams, selectedTab],
    queryFn: () => {
      console.log('开始获取文件列表，参数:', searchParams);
      const result = selectedTab === 'images' 
        ? filesApi.getImages(searchParams)
        : filesApi.getFiles(searchParams);
      
      return result.then(response => {
        console.log('文件列表获取结果:', response);
        return response as FilesResponseType;
      });
    },
  });

  console.log('渲染时的文件数据:', filesData);

  // 准备表格数据
  const tableData = React.useMemo(() => {
    if (!filesData) return [];
    
    // 尝试不同的数据结构路径
    let items: FileItem[] | undefined = undefined;
    
    // 先尝试直接获取items属性
    if ('items' in filesData && Array.isArray(filesData.items)) {
      console.log('使用 filesData.items 路径');
      items = filesData.items;
    } 
    // 再尝试获取data.items属性
    else if (filesData.data && 'items' in filesData.data && Array.isArray(filesData.data.items)) {
      console.log('使用 filesData.data.items 路径');
      items = filesData.data.items;
    }
    
    if (!items) {
      console.log('无法找到有效的数据项，filesData:', filesData);
      return [];
    }
    
    console.log('处理后的表格数据项:', items);
    return items;
  }, [filesData]);

  // 计算总数
  const totalItems = React.useMemo(() => {
    if (!filesData) return 0;
    
    // 先尝试获取meta.total
    if ('meta' in filesData && filesData.meta && typeof filesData.meta.total === 'number') {
      return filesData.meta.total;
    } 
    // 再尝试获取data.meta.total
    else if (filesData.data?.meta?.total !== undefined) {
      return filesData.data.meta.total;
    }
    
    return tableData.length;
  }, [filesData, tableData]);

  // 删除文件
  const deleteMutation = useMutation({
    mutationFn: filesApi.deleteFile,
    onSuccess: () => {
      message.success('文件删除成功');
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: () => {
      message.error('删除文件失败');
    },
  });

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchParams({
      ...searchParams,
      page: 1,
      search: value,
      mime_type: value ? undefined : (selectedTab === 'images' ? 'image/' : undefined),
    });
  };

  // 处理分页
  const handlePageChange = (page: number, pageSize: number) => {
    setSearchParams({
      ...searchParams,
      page,
      limit: pageSize,
    });
  };

  // 处理预览
  const handlePreview = (imagePath: string | undefined) => {
    if (!imagePath) {
      console.error('图片路径为空,无法预览');
      message.error('图片路径无效,无法预览');
      return;
    }
    
    console.log('预览图片原始路径:', imagePath);
    let processedUrl = imagePath;
    
    try {
      // 确保URL有效 - 处理undefined或空字符串
      if (!processedUrl || processedUrl.includes('undefined')) {
        console.error('检测到无效图片URL:', processedUrl);
        message.error('图片路径无效');
        return;
      }
      
      // 处理URL，确保使用API代理
      if (!processedUrl.startsWith('/api/files/proxy/')) {
        // 如果URL包含MinIO直连地址(9000端口)，替换为API代理
        if (processedUrl.includes(':9000')) {
          const parts = processedUrl.split('/');
          const bucketIndex = parts.findIndex(p => p === 'blog-images' || p === 'blog-avatars');
          
          if (bucketIndex >= 0) {
            const bucket = parts[bucketIndex];
            const objectPath = parts.slice(bucketIndex + 1).join('/');
            processedUrl = `/api/files/proxy/${bucket}/${objectPath}`;
            console.log('替换MinIO直连URL为API代理:', processedUrl);
          }
        } else if (processedUrl.startsWith('http://') || processedUrl.startsWith('https://')) {
          // 如果是完整的URL，提取路径部分
          const url = new URL(processedUrl);
          const pathParts = url.pathname.split('/');
          const bucketIndex = pathParts.findIndex(p => p === 'blog-images' || p === 'blog-avatars');
          
          if (bucketIndex >= 0) {
            const bucket = pathParts[bucketIndex];
            const objectPath = pathParts.slice(bucketIndex + 1).join('/');
            processedUrl = `/api/files/proxy/${bucket}/${objectPath}`;
            console.log('替换完整URL为API代理:', processedUrl);
          }
        }
      }
      
      // URL已经是相对路径 /api/...，无需添加服务器地址
      // 浏览器会自动使用当前域名（如 https://admin.lijiangtaobbd.online）
      console.log('使用相对路径URL:', processedUrl);
      
      // 添加时间戳防止缓存
      const timeStamp = new Date().getTime();
      processedUrl = processedUrl.includes('?') 
        ? `${processedUrl}&t=${timeStamp}` 
        : `${processedUrl}?t=${timeStamp}`;
      
      console.log('最终预览图片URL:', processedUrl);
      setPreviewImage(processedUrl);
      setPreviewVisible(true);
    } catch (error) {
      console.error('处理图片URL时出错:', error);
      message.error('预览图片失败');
    }
  };

  // 处理Tab切换
  const handleTabChange = (activeKey: string) => {
    setSelectedTab(activeKey);
    setSearchParams({
      ...searchParams,
      page: 1,
      mime_type: activeKey === 'images' ? 'image/' : undefined,
    });
  };

  // 处理复制链接
  const handleCopyLink = (filePath: string | undefined) => {
    if (!filePath) {
      message.error('文件路径无效,无法复制');
      return;
    }

    if (filePath.includes('undefined')) {
      message.error('文件路径包含无效字符,无法复制');
      return;
    }

    try {
      navigator.clipboard.writeText(filePath)
        .then(() => {
          message.success('链接已复制到剪贴板');
        })
        .catch(err => {
          console.error('复制失败:', err);
          message.error('复制失败,请手动复制');
        });
    } catch (error) {
      console.error('复制文件路径出错:', error);
      message.error('复制失败,请手动复制');
    }
  };

  // 处理删除文件
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  // 上传组件属性
  const uploadProps: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
      console.log('文件已移除', file.name);
    },
    beforeUpload: (file) => {
      console.log('选择文件', file.name, file.type, file.size);
      // 允许图片和apk
      const isImage = file.type.startsWith('image/');
      const isApk = file.type === 'application/vnd.android.package-archive' || file.name.toLowerCase().endsWith('.apk');
      if (!isImage && !isApk) {
        message.error('只能上传图片或APK文件!');
        return Upload.LIST_IGNORE;
      }
      // 检查文件大小 (100MB)
      if (file.size > 100 * 1024 * 1024) {
        message.error('文件大小不能超过100MB!');
        return Upload.LIST_IGNORE;
      }
      // 直接克隆原始文件对象，确保originFileObj存在
      const newFile = {
        ...file,
        originFileObj: file // 确保设置originFileObj为原始文件
      } as UploadFile;
      setFileList([...fileList, newFile]);
      return false; // 阻止自动上传
    },
    fileList,
    multiple: true,
    accept: 'image/*,.apk', // 支持图片和apk
  };

  // 处理上传文件
  const handleUpload = async () => {
    console.log('===== 开始上传流程 =====');
    console.log('文件列表长度:', fileList.length);
    
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    setUploading(true);
    console.log('设置上传状态: true');

    try {
      // 上传文件
      console.log('准备上传', fileList.length, '个文件');
      const promises = fileList.map((file, index) => {
        console.log(`处理第${index+1}个文件:`, file.name);
        const formData = new FormData();
        
        // 这里直接创建一个新的File对象，不再依赖originFileObj
        let fileObj;
        
        if (file.originFileObj) {
          // 如果originFileObj存在，优先使用它
          fileObj = file.originFileObj;
          console.log('使用原始文件对象:', file.name);
        } else if (file instanceof Blob) {
          // 文件本身就是Blob对象
          fileObj = file;
          console.log('文件本身是Blob对象:', file.name);
        } else {
          // 在这里我们使用XHR获取文件内容，创建一个新的File对象
          if (file.url) {
            console.log('文件有URL，尝试通过URL创建文件:', file.url);
            // 这里可以通过XHR获取文件内容，但简单起见，我们直接报错
            return Promise.reject(new Error(`文件 ${file.name} 无法访问，请重新选择文件`));
          }
          return Promise.reject(new Error(`文件 ${file.name} 不可用，请重新选择文件`));
        }
        
        console.log('文件大小:', fileObj.size, '类型:', fileObj.type);
        
        // 确保字段名为'file'，与后端controller的@UploadedFile()参数名匹配
        formData.append('file', fileObj);
        
        console.log('FormData已创建');
        
        console.log('开始发送上传请求');
        return filesApi.uploadImage(formData)
          .then(response => {
            console.log('上传成功响应:', response);
            return response;
          })
          .catch(error => {
            console.error('上传失败:', error);
            throw error;
          });
      });

      console.log('等待所有上传请求完成');
      const results = await Promise.all(promises);
      console.log('所有文件上传完成，结果:', results);

      // 查看上传响应是否有file信息
      const uploadedFiles = results.map(result => {
        if (result && result.file) {
          console.log('检测到上传的文件信息:', result.file);
          return result.file;
        }
        return null;
      }).filter(Boolean);
      
      console.log('成功上传的文件:', uploadedFiles);

      setFileList([]);
      setUploadVisible(false);
      message.success('上传成功');
      
      // 刷新文件列表
      console.log('强制刷新文件列表');
      await queryClient.invalidateQueries({ queryKey: ['files'] });
      
      // 确保invalidateQueries后刷新数据
      queryClient.refetchQueries({ queryKey: ['files'] });
    } catch (error: any) {
      console.error('上传文件失败', error);
      console.error('错误详情:', {
        message: error.message, 
        name: error.name,
        stack: error.stack,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : '无响应'
      });
      message.error('上传失败：' + (error.message || '未知错误'));
    } finally {
      console.log('设置上传状态: false');
      setUploading(false);
      console.log('===== 上传流程结束 =====');
    }
  };

  // 在渲染预览列时，检查图片URL并可能修改
  const renderPreview = (file: FileItem) => {
    // 检查是否为图片类型
    if (file.mime_type?.startsWith('image/')) {
      // 图片URL处理 - 确保URL可以在前端正确访问
      let imageUrl = file.file_path;
      
      // 检查file_path是否有效
      if (!imageUrl || imageUrl === 'undefined' || imageUrl.includes('undefined')) {
        console.warn('文件路径无效:', imageUrl, '文件信息:', file);
        return (
          <div 
            style={{ 
              width: '60px', 
              height: '60px', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #f0f0f0',
              background: '#fafafa',
              color: '#ff4d4f'
            }}
          >
            <FileImageOutlined style={{ fontSize: '24px', opacity: 0.5 }} />
          </div>
        );
      }
      
      // 调试输出
      console.log('处理图片预览,文件ID:', file.id, '原始图片路径:', imageUrl);
      
      try {
        // 处理URL，确保使用API代理
        if (!imageUrl.startsWith('/api/files/proxy/')) {
          // 如果URL包含MinIO直连地址(9000端口)，替换为API代理
          if (imageUrl.includes(':9000')) {
            const parts = imageUrl.split('/');
            const bucketIndex = parts.findIndex(p => p === 'blog-images' || p === 'blog-avatars');
            
            if (bucketIndex >= 0) {
              const bucket = parts[bucketIndex];
              const objectPath = parts.slice(bucketIndex + 1).join('/');
              imageUrl = `/api/files/proxy/${bucket}/${objectPath}`;
              console.log('替换MinIO直连URL为API代理:', imageUrl);
            }
          } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            // 如果是完整的URL，提取路径部分
            const url = new URL(imageUrl);
            const pathParts = url.pathname.split('/');
            const bucketIndex = pathParts.findIndex(p => p === 'blog-images' || p === 'blog-avatars');
            
            if (bucketIndex >= 0) {
              const bucket = pathParts[bucketIndex];
              const objectPath = pathParts.slice(bucketIndex + 1).join('/');
              imageUrl = `/api/files/proxy/${bucket}/${objectPath}`;
              console.log('替换完整URL为API代理:', imageUrl);
            }
          }
        }
        
        // 确保URL包含完整的服务器地址
        // URL已经是相对路径 /api/...，无需添加服务器地址
        console.log('使用相对路径图片URL:', imageUrl);
        
        // 添加时间戳防止缓存
        const timeStamp = new Date().getTime();
        imageUrl = imageUrl.includes('?') 
          ? `${imageUrl}&t=${timeStamp}` 
          : `${imageUrl}?t=${timeStamp}`;
        console.log('最终处理后的图片URL:', imageUrl);
        
        return (
          <div 
            style={{ 
              width: '60px', 
              height: '60px', 
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #f0f0f0',
              borderRadius: '4px',
              background: '#fafafa'
            }}
          >
            <img 
              src={imageUrl} 
              alt={file.original_name} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%',
                objectFit: 'contain'
              }} 
              onClick={() => {
                handlePreview(imageUrl);
              }}
              onError={(e) => {
                console.error('图片加载失败:', imageUrl);
                // 显示错误图标或占位符
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                (e.target as HTMLImageElement).style.padding = '8px';
              }}
            />
          </div>
        );
      } catch (error) {
        console.error('处理图片URL出错:', error);
        return (
          <div 
            style={{ 
              width: '60px', 
              height: '60px', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #f0f0f0',
              background: '#fafafa',
              color: '#ff4d4f'
            }}
          >
            <FileImageOutlined style={{ fontSize: '24px', opacity: 0.5 }} />
          </div>
        );
      }
    }
    
    // 非图片类型显示图标
    return <FileOutlined style={{ fontSize: '24px' }} />;
  };

  // 定义表格列
  const columns = [
    {
      title: '预览',
      dataIndex: 'file_path',
      key: 'preview',
      width: 100,
      render: (_: any, record: FileItem) => renderPreview(record)
    },
    {
      title: '文件名',
      dataIndex: 'original_name',
      key: 'filename',
      ellipsis: true,
      render: (text: string) => <span style={{ wordBreak: 'break-all' }}>{text}</span>
    },
    {
      title: '文件类型',
      dataIndex: 'mime_type',
      key: 'type',
      width: 120
    },
    {
      title: '文件大小',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number) => formatBytes(size)
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: FileItem) => {
        const filePath = record.file_path || record.path;
        return (
          <Space size="small">
            {record.mime_type?.startsWith('image/') && (
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                onClick={() => handlePreview(filePath)}
              />
            )}
            <Button 
              type="text" 
              icon={<CopyOutlined />} 
              onClick={() => handleCopyLink(filePath)}
            />
            <Popconfirm
              title="确定要删除此文件吗?"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <Card
      title="资源管理"
      extra={
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => setUploadVisible(true)}
        >
          上传文件
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input.Search
          placeholder="搜索文件名..."
          onSearch={handleSearch}
          style={{ maxWidth: 300 }}
          prefix={<SearchOutlined />}
        />
        <Tabs activeKey={selectedTab} onChange={handleTabChange}>
          <Tabs.TabPane tab="全部文件" key="all" />
          <Tabs.TabPane tab="图片" key="images" />
        </Tabs>
        <Table
          columns={columns}
          dataSource={tableData}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.limit,
            total: totalItems,
            onChange: handlePageChange,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
        
        {/* 添加调试信息区域 */}
        {process.env.NODE_ENV !== 'production' && (
          <div style={{ marginTop: 16, border: '1px dashed #ccc', padding: 8 }}>
            <h4>调试信息</h4>
            <div>查询参数: {JSON.stringify(searchParams)}</div>
            <div>数据条数: {tableData?.length || 0}</div>
            {tableData?.length > 0 && (
              <div>
                <div>第一条数据: {JSON.stringify(tableData[0])}</div>
              </div>
            )}
          </div>
        )}
      </Space>

      {/* 图片预览弹窗 */}
      <Modal
        open={previewVisible}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <div style={{ textAlign: 'center', overflow: 'auto', maxHeight: '70vh' }}>
          {previewImage ? (
            <img 
              alt="预览图片" 
              style={{ maxWidth: '100%' }} 
              src={previewImage} 
              onError={(e) => {
                console.error('预览图片加载失败:', previewImage);
                message.error('图片加载失败，可能是链接无效或网络问题');
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
              }}
            />
          ) : (
            <div style={{ padding: '50px', color: '#999' }}>
              <FileImageOutlined style={{ fontSize: '48px', opacity: 0.5 }} />
              <p>无法加载图片</p>
            </div>
          )}
          <div style={{ marginTop: 10, wordBreak: 'break-all', textAlign: 'left', color: '#666' }}>
            <small>图片URL: {previewImage || '无效URL'}</small>
          </div>
        </div>
      </Modal>

      {/* 上传文件弹窗 */}
      <Modal
        open={uploadVisible}
        title="上传文件"
        onCancel={() => {
          setUploadVisible(false);
          setFileList([]);
        }}
        onOk={handleUpload}
        confirmLoading={uploading}
        okText="上传"
        cancelText="取消"
      >
        <div>
          <p style={{ marginBottom: 10 }}>请选择要上传的图片文件</p>
          <Upload 
            {...uploadProps}
            // 显式设置名称为file
            name="file"
            listType="picture"
          >
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
          
          {/* 添加一些调试信息，便于排查 */}
          {fileList.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p>已选择 {fileList.length} 个文件：</p>
              <ul>
                {fileList.map((file, index) => (
                  <li key={index}>
                    {file.name} ({formatBytes(file.size || 0)})
                    {file.originFileObj ? ' ✓' : ' ✗'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </Card>
  );
};

export default ResourceManager;
