import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, BadRequestException, UseGuards, Request, Query, ParseIntPipe, Logger, NotFoundException, Req, Res, InternalServerErrorException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { FileQueryDto } from './dto/file-query.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { minioConfig } from '../../config/minio.config';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';

@Controller('files')
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
  ) {}

  @Post('upload/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Request() req) {
    try {
      this.logger.log('===== 开始处理上传图片请求 =====');
      this.logger.log(`请求方法: ${req.method}, 请求路径: ${req.path}`);
      this.logger.log(`用户ID: ${req.user?.id}, 用户名: ${req.user?.username}`);
      this.logger.log(`文件信息: 名称=${file.originalname}, 类型=${file.mimetype}, 大小=${file.size}字节`);
      
      // 修复中文文件名乱码问题
      let originalFileName = file.originalname;
      
      // 检测文件名是否已经是乱码,如果是,尝试修复
      if (/å|ä|ç|ã|æ|¿|¼/.test(originalFileName)) {
        originalFileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      }
      
      // 替换修复后的文件名
      file.originalname = originalFileName;
      
      // 新增：允许图片和.apk，限制50MB
      const isImage = file.mimetype.startsWith('image/');
      const isApk = file.mimetype === 'application/vnd.android.package-archive' || file.originalname.toLowerCase().endsWith('.apk');
      if (!isImage && !isApk) {
        throw new BadRequestException('只允许上传图片或安卓安装包(.apk)文件');
      }
      if (file.size > 100 * 1024 * 1024) {
        throw new BadRequestException('文件大小不能超过100MB');
      }
      
      this.logger.log('调用filesService.uploadImage开始上传...');
      const fileUrl = await this.filesService.uploadImage(file);
      this.logger.log(`uploadImage返回的URL: "${fileUrl}"`);
      
      if (!fileUrl) {
        this.logger.error('严重错误: filesService.uploadImage返回的URL为空!');
        throw new InternalServerErrorException('上传服务返回的URL为空');
      }
      
      // 创建文件记录
      this.logger.log(`开始创建文件数据库记录, 文件URL: ${fileUrl}`);
      const fileRecord = await this.filesService.create({
        user_id: req.user.id,
        filename: file.originalname,
        original_name: file.originalname,
        file_path: fileUrl,
        mime_type: file.mimetype,
        size: file.size
      });
      
      this.logger.log(`文件记录创建成功, ID: ${fileRecord.id}`);
      this.logger.log(`最后返回给前端的URL: "${fileUrl}"`);
      this.logger.log(`返回类型: ${typeof fileUrl}`);
      
      // 确保返回值不为空
      if (!fileUrl || fileUrl.trim() === '') {
        this.logger.error('严重错误: 返回给前端的URL为空!');
        throw new InternalServerErrorException('生成的URL为空');
      }
      
      this.logger.log('===== 上传图片请求处理完成 =====');
      
      // 将URL封装在对象中返回，而不是直接返回字符串
      return { url: fileUrl };
    } catch (error) {
      this.logger.error(`上传图片失败: ${error.message}`);
      throw new BadRequestException(`文件上传失败: ${error.message}`);
    }
  }

  @Post('upload/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // 验证文件类型
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // 验证文件大小（最大2MB）
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('File size cannot exceed 2MB');
    }

    try {
      // 上传头像到 MinIO
      const url = await this.filesService.uploadAvatar(file, req.user.id);
      
      // 更新用户头像
      await this.usersService.updateAvatar(req.user.id, url);
      
      return {
        url,
        message: 'Avatar uploaded successfully'
      };
    } catch (error) {
      throw new BadRequestException(`Avatar upload failed: ${error.message}`);
    }
  }

  // 获取用户文件列表
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req, @Query() query: FileQueryDto) {
    return this.filesService.findAll(req.user.id, query);
  }

  // 新增 - 获取单个文件详情
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.filesService.findOne(id, req.user.id);
  }

  // 新增 - 更新文件信息
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateFileDto: UpdateFileDto,
    @Request() req
  ) {
    return this.filesService.update(id, req.user.id, updateFileDto);
  }

  // 新增 - 删除文件
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // 获取文件信息，用于后续从MinIO删除
    const file = await this.filesService.findOne(id, req.user.id);
    
    // 从数据库中删除记录
    await this.filesService.remove(id, req.user.id);
    
    // 可以添加从MinIO删除文件的逻辑
    
    return { message: '文件删除成功' };
  }

  // 修改代理方法,避免301重定向
  @Get('proxy/:bucket/*')
  async proxyMinioFile(
    @Param('bucket') bucket: string,
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ) {
    // 修改: 不再使用 req.params[0]，改用从 req.path 解析路径
    const fullPath = req.path;
    const bucketPrefix = `/api/files/proxy/${bucket}/`;
    const path = fullPath.indexOf(bucketPrefix) > -1 
      ? fullPath.substring(fullPath.indexOf(bucketPrefix) + bucketPrefix.length) 
      : '';
    
    // 增加防御性检查 - 验证path不为空
    if (!path) {
      return res.status(400).json({
        success: false,
        error: 'File path is missing or invalid',
        details: 'Failed to extract file path from URL'
      });
    }

    try {
      // 获取文件的元数据
      const stat = await this.filesService.statObject(bucket, path);
      
      // 获取文件流
      const fileStream = await this.filesService.getFileStream(bucket, path);
      
      // 设置响应头
      const contentType = stat.metaData['content-type'] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      
      // 如果有内容长度,设置Content-Length
      if (stat.size) {
        res.setHeader('Content-Length', stat.size);
      }
      
      // 设置缓存控制头
      res.setHeader('Cache-Control', 'public, max-age=86400');
      
      // 通过管道将文件流传输到响应
      fileStream.pipe(res);
    } catch (error) {
      // 根据错误类型返回合适的HTTP状态码
      if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
        return res.status(404).json({
          success: false,
          error: 'File not found',
          details: error.message
        });
      } else if (error.name === 'InvalidObjectNameError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid object name',
          details: error.message,
          path: path
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to proxy file',
          details: error.message
        });
      }
    }
  }
} 