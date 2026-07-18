import { Injectable, Inject, OnModuleInit, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Client } from 'minio';
import { minioConfig } from '../../config/minio.config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileQueryDto } from './dto/file-query.dto';

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly logger = new Logger(FilesService.name);
  protected minioClient: Client;

  constructor(
    @InjectRepository(File)
    private readonly filesRepository: Repository<File>,
  ) {
    // 初始化MinIO客户端
    this.minioClient = new Client({
      endPoint: minioConfig.endPoint,
      port: minioConfig.port,
      useSSL: minioConfig.useSSL,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
    });
  }

  async onModuleInit() {
    try {
      // 检查MinIO连接
      await this.checkMinIOConnection();
      
      // 确保必要的bucket存在
      const buckets = ['blog-images', 'blog-avatars'];
      for (const bucket of buckets) {
        const exists = await this.minioClient.bucketExists(bucket);
        if (!exists) {
          await this.minioClient.makeBucket(bucket);
          this.logger.log(`Created bucket: ${bucket}`);
          
          // 设置bucket策略为公开读
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucket}/*`],
              },
            ],
          };
          await this.minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
          this.logger.log(`Set public read policy for bucket: ${bucket}`);
        }
      }
    } catch (error) {
      console.error('MinIO initialization error:', error);
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const bucketName = 'blog-images';
    
    // 确保文件名正确编码(此时Controller应该已经修复过编码问题)
    this.logger.log('===== 文件上传详细信息 =====');
    this.logger.log(`原始文件名: ${file.originalname}`);
    this.logger.log(`文件名字符代码: ${Array.from(file.originalname).map(c => c.charCodeAt(0).toString(16)).join(' ')}`);
    
    const uniqueFileName = `${Date.now()}_${uuidv4()}${path.extname(file.originalname)}`;
    const objectName = `images/${uniqueFileName}`;
    
    this.logger.log(`生成的唯一文件名: ${uniqueFileName}`);
    this.logger.log(`文件类型: ${file.mimetype}`);
    this.logger.log(`文件大小: ${file.size} 字节`);
    this.logger.log(`目标存储桶: ${bucketName}`);
    this.logger.log(`MinIO对象名称: ${objectName}`);
    this.logger.log(`完整的MinIO路径: ${bucketName}/${objectName}`);

    this.logger.log('Checking if bucket exists:', bucketName);
    const bucketExists = await this.minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      this.logger.log('Bucket does not exist. Creating bucket:', bucketName);
      await this.minioClient.makeBucket(bucketName);
      // 设置 bucket 策略为公开读
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      await this.minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      this.logger.log('Bucket policy set for:', bucketName);
    }
    
    this.logger.log('Uploading file:', objectName);
    await this.minioClient.putObject(
      bucketName,
      objectName,
      file.buffer,
      file.size,
      { 
        'Content-Type': file.mimetype,
        'x-amz-meta-original-filename': encodeURIComponent(file.originalname) // 存储原始文件名作为元数据
      }
    );
    this.logger.log('File uploaded successfully:', objectName);

    // 返回文件访问URL，使用代理路径
    const url = `/api/files/proxy/${bucketName}/${objectName}`;
    this.logger.log(`生成的代理URL: ${url}`);
    this.logger.log('===== 文件上传完成 =====');
    return url;
  }

  // 添加检查MinIO连接的方法
  private async checkMinIOConnection(): Promise<boolean> {
    try {
      this.logger.log('检查MinIO连接状态...');
      this.logger.log(`MinIO配置: ${JSON.stringify({
        endPoint: minioConfig.endPoint,
        port: minioConfig.port,
        publicEndpoint: minioConfig.publicEndpoint,
        // 隐藏凭证
        useSSL: minioConfig.useSSL
      })}`);
      
      // 尝试列出所有bucket
      const buckets = await this.minioClient.listBuckets();
      this.logger.log(`MinIO连接成功! 现有Bucket: ${buckets.map(b => b.name).join(', ')}`);
      return true;
    } catch (error) {
      this.logger.error('MinIO连接失败!');
      this.logger.error(`错误消息: ${error.message}`);
      this.logger.error(`错误代码: ${error.code}`);
      return false;
    }
  }

  async uploadAvatar(file: Express.Multer.File, userId: number): Promise<string> {
    // 先检查MinIO连接
    const connectionOk = await this.checkMinIOConnection();
    if (!connectionOk) {
      this.logger.warn('MinIO连接检查失败，但仍将尝试上传');
    }

    const bucketName = 'blog-avatars';
    const objectName = `avatars/${userId}_${Date.now()}${path.extname(file.originalname)}`;

    // [新增] 详细记录预期生成的URL信息
    this.logger.log(`[DEBUG] 预期生成的头像URL路径组成部分:`);
    this.logger.log(`[DEBUG] - bucketName: "${bucketName}"`);
    this.logger.log(`[DEBUG] - objectName: "${objectName}"`);
    this.logger.log(`[DEBUG] - 预期URL格式: /api/files/proxy/${bucketName}/${objectName}`);

    this.logger.log('===== 头像上传到MinIO存储开始 =====');
    this.logger.log(`用户ID: ${userId}, 目标Bucket: ${bucketName}`);
    this.logger.log(`文件名: ${file.originalname}, 生成的对象名: ${objectName}`);
    this.logger.log(`文件类型: ${file.mimetype}, 文件大小: ${file.size} bytes`);
    this.logger.log(`文件编码: ${file.encoding || '未知'}`);
    this.logger.log(`Buffer大小: ${file.buffer ? file.buffer.length : '无'} bytes`);
    this.logger.log(`文件原始路径: ${file.path || '无路径-基于内存'}`);
    this.logger.log(`文件名字符代码: ${Array.from(file.originalname).map(c => c.charCodeAt(0).toString(16)).join(' ')}`);
    this.logger.log(`文件扩展名: ${path.extname(file.originalname)}`);
    this.logger.log(`MinIO配置: endPoint=${minioConfig.endPoint}, port=${minioConfig.port}, useSSL=${minioConfig.useSSL}`);
    this.logger.log(`公共访问端点: ${minioConfig.publicEndpoint}`);

    try {
      this.logger.log('Checking if avatars bucket exists:', bucketName);
      const bucketExists = await this.minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        this.logger.log('Avatars bucket does not exist. Creating bucket:', bucketName);
        await this.minioClient.makeBucket(bucketName);
        // 设置 bucket 策略为公开读
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
        this.logger.log('Avatars bucket policy set for:', bucketName);
        this.logger.log(`Bucket策略详情: ${JSON.stringify(policy)}`);
      } else {
        this.logger.log('头像Bucket已存在，无需创建');
        // MinIO的Client接口没有直接提供getBucketPolicy方法
        this.logger.log(`Bucket ${bucketName} 已存在，假定权限设置正确`);
      }
      
      this.logger.log('开始上传头像文件到MinIO:', objectName);
      this.logger.log('准备元数据...');
      const metaData = { 
        'Content-Type': file.mimetype,
        'x-amz-meta-original-filename': encodeURIComponent(file.originalname),
        'x-amz-meta-user-id': `${userId}`,
        'x-amz-meta-upload-time': new Date().toISOString()
      };
      this.logger.log(`上传元数据: ${JSON.stringify(metaData)}`);
      
      try {
        await this.minioClient.putObject(
          bucketName,
          objectName,
          file.buffer,
          file.size,
          metaData
        );
        this.logger.log('头像文件上传到MinIO成功');
        this.logger.log(`文件路径: ${bucketName}/${objectName}`);
      } catch (uploadError) {
        this.logger.error('文件上传到MinIO失败:');
        this.logger.error(`错误消息: ${uploadError.message}`);
        this.logger.error(`错误代码: ${uploadError.code || '无代码'}`);
        this.logger.error(`错误堆栈: ${uploadError.stack}`);
        
        // 尝试诊断上传失败原因
        if (uploadError.code === 'ConnectionRefused' || uploadError.code === 'NetworkError') {
          this.logger.error('网络连接问题 - 检查MinIO服务是否正常运行');
        } else if (uploadError.code === 'AccessDenied') {
          this.logger.error('访问被拒绝 - 检查MinIO的访问密钥和权限设置');
        } else if (uploadError.code === 'NoSuchBucket') {
          this.logger.error(`Bucket不存在 - 尝试创建Bucket ${bucketName}失败`);
        }
        
        throw uploadError;
      }

      this.logger.log('Avatar uploaded successfully:', objectName);
      
      // 检查文件是否真的存在
      try {
        const stat = await this.minioClient.statObject(bucketName, objectName);
        this.logger.log('文件已成功存储，获取文件状态:');
        this.logger.log(`文件大小: ${stat.size} bytes`);
        this.logger.log(`最后修改时间: ${stat.lastModified}`);
        this.logger.log(`ETag: ${stat.etag}`);
        this.logger.log(`内容类型: ${stat.metaData['content-type']}`);
        this.logger.log(`全部元数据: ${JSON.stringify(stat.metaData)}`);
      } catch (error) {
        this.logger.warn('文件存储状态检查失败:');
        this.logger.warn(`错误消息: ${error.message}`);
        this.logger.warn(`错误代码: ${error.code || '无代码'}`);
      }

      // 生成URL前的日志
      this.logger.log('[DEBUG] 准备生成返回URL...');
      
      // 返回文件访问URL，使用代理路径（与uploadImage保持一致）
      const url = `/api/files/proxy/${bucketName}/${objectName}`;
      
      // [新增] 添加更详细的URL构建日志
      this.logger.log(`[DEBUG] 构建URL细节:`);
      this.logger.log(`[DEBUG] - 前缀: "/api/files/proxy/"`);
      this.logger.log(`[DEBUG] - 存储桶: "${bucketName}"`);
      this.logger.log(`[DEBUG] - 对象名: "${objectName}"`);
      this.logger.log(`[DEBUG] - 完整URL: "${url}"`);
      
      // [新增] 检查是否意外使用了默认图片
      if (url.includes('default-image.jpg')) {
        this.logger.error(`[严重错误] 检测到返回URL包含default-image.jpg: ${url}`);
        this.logger.error(`[严重错误] 这与预期的URL格式不符: /api/files/proxy/${bucketName}/${objectName}`);
        this.logger.error(`[严重错误] 可能存在代码逻辑问题或硬编码默认值!`);
      }
      
      this.logger.log(`生成的代理URL: ${url}`);
      this.logger.log('===== 头像上传完成 =====');
      return url;
    } catch (error) {
      this.logger.error('===== 头像上传过程中发生错误 =====');
      this.logger.error(`错误类型: ${error.constructor.name}`);
      this.logger.error(`错误消息: ${error.message}`);
      this.logger.error(`错误堆栈: ${error.stack}`);
      
      // [新增] 检查是否应该返回默认图片
      this.logger.warn(`[DEBUG] 发生错误后不会返回默认图片，而是抛出异常`);
      
      throw error;
    }
  }

  async create(fileData: {
    user_id: number;
    filename: string;
    original_name: string;
    file_path: string;
    mime_type: string;
    size: number;
  }): Promise<File> {
    this.logger.log(`创建文件记录: ${JSON.stringify(fileData)}`);
    
    // 保存到数据库
    const file = this.filesRepository.create(fileData);
    return await this.filesRepository.save(file);
  }

  async findAll(userId: number, query: FileQueryDto) {
    const { mime_type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    
    this.logger.log(`查询参数: userId=${userId}, mime_type=${mime_type || '无'}, page=${page}, limit=${limit}, skip=${skip}`);
    
    const queryBuilder = this.filesRepository.createQueryBuilder('file')
      .where('file.user_id = :userId', { userId })
      .orderBy('file.created_at', 'DESC')
      .skip(skip)
      .take(limit);
    
    if (mime_type) {
      queryBuilder.andWhere('file.mime_type LIKE :mimeType', { mimeType: `${mime_type}%` });
    }
    
    // 打印完整SQL和参数
    const sql = queryBuilder.getSql();
    const parameters = queryBuilder.getParameters();
    
    // 直接将参数拼接到SQL中，方便调试
    let finalSql = sql;
    Object.entries(parameters).forEach(([key, value]) => {
      finalSql = finalSql.replace(new RegExp(`:${key}`, 'g'), typeof value === 'string' ? `'${value}'` : value);
    });
    
    console.log('----------------------------------------');
    console.log('完整拼接后的SQL查询语句:');
    console.log(finalSql);
    console.log('----------------------------------------');
    
    // 记录到日志
    this.logger.log(`生成的SQL: ${sql}`);
    this.logger.log(`SQL参数: ${JSON.stringify(parameters)}`);
    this.logger.log(`拼接后的完整SQL: ${finalSql}`);
    
    const [files, total] = await queryBuilder.getManyAndCount();
    
    // 打印查询结果详情
    console.log('----------------------------------------');
    console.log(`查询结果: 获取到${files.length}条记录，总计${total}条`);
    
    if (files.length > 0) {
      console.log('查询结果详情:');
      console.log(JSON.stringify(files, null, 2));
    } else {
      console.log('没有找到匹配的记录!');
      // 尝试直接查询数据库，验证数据是否存在
      try {
        const testQuery = 'SELECT * FROM files WHERE user_id = ' + userId + ' LIMIT 2';
        console.log('执行测试查询:', testQuery);
        const testResult = await this.filesRepository.query(testQuery);
        console.log('测试查询结果:', JSON.stringify(testResult, null, 2));
        if (testResult.length > 0) {
          console.log('数据库中确实存在该用户的文件记录，但QueryBuilder查询未返回结果，可能存在转换问题');
        }
      } catch (error) {
        console.error('测试查询执行失败:', error.message);
      }
    }
    console.log('----------------------------------------');
    
    this.logger.log(`查询结果: 获取到${files.length}条记录，总计${total}条`);
    
    return {
      items: files,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId: number): Promise<File> {
    const file = await this.filesRepository.findOne({
      where: { id, user_id: userId },
    });
    
    if (!file) {
      throw new NotFoundException('文件不存在或您没有权限访问');
    }
    
    return file;
  }

  async update(id: number, userId: number, updateFileDto: UpdateFileDto): Promise<File> {
    const file = await this.findOne(id, userId);
    
    Object.assign(file, updateFileDto);
    
    return this.filesRepository.save(file);
  }

  async remove(id: number, userId: number): Promise<void> {
    const file = await this.findOne(id, userId);
    
    // 从文件路径中提取MinIO的bucket和objectName
    try {
      const fileUrl = file.file_path;
      this.logger.log(`准备删除文件: ${fileUrl}`);
      
      // 解析文件URL获取bucket和objectName
      // 示例: http://localhost:3000/api/uploads/blog-images/images/1743681373689_c38c2290-0483-4e75-8a26-d9a39fd5590c.png
      // 或者: http://localhost:3000/api/uploads/bucket-name/path/to/file.jpg
      const publicEndpoint = minioConfig.publicEndpoint;
      
      if (fileUrl && fileUrl.startsWith(publicEndpoint)) {
        const relativePath = fileUrl.substring(publicEndpoint.length + 1); // +1 是为了去掉开头的斜杠
        const parts = relativePath.split('/');
        
        if (parts.length >= 1) {
          const bucketName = parts[0];
          const objectName = parts.slice(1).join('/');
          
          this.logger.log(`从MinIO删除文件: bucket=${bucketName}, object=${objectName}`);
          
          try {
            // 检查文件是否存在
            await this.minioClient.statObject(bucketName, objectName);
            
            // 删除文件
            await this.minioClient.removeObject(bucketName, objectName);
            this.logger.log(`MinIO文件删除成功: ${objectName}`);
          } catch (minioError) {
            this.logger.error(`MinIO删除失败: ${minioError.message}`);
            // 即使MinIO删除失败，仍然继续删除数据库记录
          }
        } else {
          this.logger.error(`无法从URL解析文件路径: ${fileUrl}`);
        }
      } else {
        this.logger.error(`文件URL格式不正确: ${fileUrl}`);
      }
    } catch (parseError) {
      this.logger.error(`解析文件URL失败: ${parseError.message}`);
    }
    
    // 删除数据库记录
    this.logger.log(`从数据库删除文件记录: id=${id}`);
    await this.filesRepository.remove(file);
    this.logger.log(`文件记录删除成功: id=${id}`);
  }

  // 新增方法:从MinIO获取文件流
  async getFileStream(bucket: string, objectName: string) {
    this.logger.log('===== 获取MinIO文件流 =====');
    this.logger.log(`存储桶: ${bucket}`);
    this.logger.log(`对象名称: ${objectName}`);
    
    try {
      const stream = await this.minioClient.getObject(bucket, objectName);
      this.logger.log('成功获取文件流');
      
      // 监听流的事件
      stream.on('end', () => {
        this.logger.log('文件流读取完成');
      });
      
      stream.on('error', (error) => {
        this.logger.error('文件流读取错误:');
        this.logger.error(`- 错误类型: ${error.constructor.name}`);
        this.logger.error(`- 错误消息: ${error.message}`);
        this.logger.error(`- 错误堆栈: ${error.stack}`);
      });
      
      return stream;
    } catch (error) {
      this.logger.error('获取文件流失败:');
      this.logger.error(`- 错误类型: ${error.constructor.name}`);
      this.logger.error(`- 错误消息: ${error.message}`);
      this.logger.error(`- 错误代码: ${error.code || '无代码'}`);
      this.logger.error(`- 错误堆栈: ${error.stack}`);
      throw error;
    }
  }

  // 获取文件元数据
  async statObject(bucket: string, objectName: string) {
    this.logger.log('===== 获取MinIO文件元数据 =====');
    this.logger.log(`存储桶: ${bucket}`);
    this.logger.log(`对象名称: ${objectName}`);
    
    // 防御性编程: 检查undefined或空对象名称
    if (!objectName) {
      const error = new Error('Invalid object name: undefined');
      error['name'] = 'InvalidObjectNameError';
      
      this.logger.error('获取文件元数据失败: 对象名称为空');
      this.logger.error(`存储桶: ${bucket}`);
      this.logger.error(`对象名称值: ${objectName}`);
      this.logger.error(`对象名称类型: ${typeof objectName}`);
      
      throw error;
    }
    
    try {
      // 添加详细的参数日志
      this.logger.log(`开始调用minio.statObject(${bucket}, ${objectName})`);
      this.logger.log(`MinIO客户端参数: ${JSON.stringify({
        endPoint: minioConfig.endPoint,
        port: minioConfig.port, 
        useSSL: minioConfig.useSSL,
        accessKey: '***MASKED***',
        secretKey: '***MASKED***',
      })}`);
      
      const stat = await this.minioClient.statObject(bucket, objectName);
      this.logger.log('获取元数据成功:');
      this.logger.log(`- 大小: ${stat.size} bytes`);
      this.logger.log(`- 最后修改时间: ${stat.lastModified}`);
      this.logger.log(`- ETag: ${stat.etag}`);
      this.logger.log(`- 内容类型: ${stat.metaData['content-type']}`);
      this.logger.log(`- 完整元数据: ${JSON.stringify(stat.metaData, null, 2)}`);
      return stat;
    } catch (error) {
      this.logger.error('获取文件元数据失败:');
      this.logger.error(`- 错误类型: ${error.constructor.name}`);
      this.logger.error(`- 错误名称: ${error.name || '无名称'}`);
      this.logger.error(`- 错误消息: ${error.message}`);
      this.logger.error(`- 错误代码: ${error.code || '无代码'}`);
      this.logger.error(`- 错误堆栈: ${error.stack}`);
      this.logger.error(`- 请求参数: bucket=${bucket}, objectName=${objectName}, typeof objectName=${typeof objectName}`);
      throw error;
    }
  }
} 