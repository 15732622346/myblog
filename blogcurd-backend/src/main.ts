import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from './config/logger.config';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger, ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

/**
 * 全局异常过滤器
 * 捕获并记录所有未处理的异常
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // 日志记录异常信息
    this.logger.error('=== 捕获到全局异常 ===');
    this.logger.error(`请求信息: ${request.method} ${request.url}`);
    this.logger.error(`请求IP: ${request.ip || request.connection.remoteAddress}`);
    this.logger.error(`用户代理: ${request.headers['user-agent']}`);
    this.logger.error(`请求参数: ${JSON.stringify({
      query: request.query,
      params: request.params,
      body: request.body
    })}`);
    
    // 记录异常详情
    this.logger.error(`异常类型: ${exception.constructor.name}`);
    this.logger.error(`异常消息: ${exception.message}`);
    
    if (exception.stack) {
      this.logger.error(`异常堆栈: ${exception.stack}`);
    }

    // 确定HTTP状态码
    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 发送响应
    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message: exception.message || '服务器内部错误',
        timestamp: new Date().toISOString(),
        path: request.url
      }
    });
  }
}

/**
 * 手动加载环境变量
 * 确保在应用启动前正确加载配置
 */
function loadEnvConfig() {
  const envFile = process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env.development';
  const envPath = path.resolve(process.cwd(), envFile);

  // 加载环境变量
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    console.error(`环境变量加载失败: ${result.error.message}`);
  } else {
    console.log(`成功加载环境变量文件: ${envPath}`);
  }
  
  // 强制设置开发环境数据库端口为3307
  if (process.env.NODE_ENV !== 'production') {
    process.env.DB_PORT = '3307';
  }
}

async function bootstrap() {
  // 加载环境配置
  loadEnvConfig();

  // 创建Winston日志实例
  const logger = WinstonModule.createLogger(loggerConfig);
  
  // 创建应用实例,并注入日志服务
  const app = await NestFactory.create(AppModule, {
    logger,
  });
  
  // 添加请求日志中间件
  app.use((req, res, next) => {
    logger.log(`Received request: ${req.method} ${req.url}`);
    next();
  });

  // 打印应用启动信息
  logger.log(`应用环境: ${process.env.NODE_ENV || 'development'}`, 'Bootstrap');
  logger.log(`数据库连接信息:`, 'Database');
  logger.log(`  - 主机: ${process.env.DB_HOST || 'localhost'}`, 'Database');
  logger.log(`  - 端口: ${process.env.DB_PORT || '3306'}`, 'Database');
  logger.log(`  - 用户: ${process.env.DB_USERNAME || 'root'}`, 'Database');
  logger.log(`  - 数据库: ${process.env.DB_DATABASE || 'blog_system'}`, 'Database');
  
  // 设置调试日志级别并输出提示
  const appLogger = new Logger('Application');
  appLogger.debug('已启用DEBUG级别日志，将显示所有详细信息');
  
  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe());
  
  // 注册全局异常过滤器
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  // 启用CORS，临时允许所有来源进行调试
  app.enableCors({
    origin: true, // 允许所有来源
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // 允许的方法
    allowedHeaders: 'Content-Type, Accept, Authorization', // 允许的请求头
    credentials: true, // 允许发送凭据 (如 Cookie)
  });

  // 设置全局前缀
  app.setGlobalPrefix('api');

  // 配置Swagger文档
  const options = new DocumentBuilder()
    .setTitle('博客系统API')
    .setDescription('博客系统后端API文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);

  // 启动应用
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`应用启动成功! 访问地址: http://localhost:${port}/api`, 'Bootstrap');
  logger.log(`API文档地址: http://localhost:${port}/api-docs`, 'Bootstrap');
}

// 启动应用
bootstrap().catch(err => {
  console.error('应用启动失败:', err);
  console.error('错误详情:', err.stack);
});
