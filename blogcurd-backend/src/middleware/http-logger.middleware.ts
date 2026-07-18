import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../modules/logger/logger.service';

/**
 * HTTP日志中间件 - 记录所有API请求的详细信息
 * 包括请求方法、URL、IP地址、请求头、请求体、响应状态码和响应时间
 */
@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {
    // 设置日志上下文
    this.logger.setContext('HTTP');
  }
  
  use(req: Request, res: Response, next: NextFunction) {
    // 记录请求开始时间
    const start = Date.now();
    const { method, originalUrl, ip, headers } = req;
    
    // 获取请求体内容(非生产环境下)
    const requestBody = process.env.NODE_ENV !== 'production' 
      ? JSON.stringify(req.body) 
      : '[REDACTED IN PRODUCTION]';

    // 处理请求完成后记录响应信息
    res.on('finish', () => {
      const responseTime = Date.now() - start;
      const { statusCode } = res;
      
      // 记录HTTP请求日志
      this.logger.httpRequest(
        method,
        originalUrl,
        statusCode,
        responseTime,
        {
          ip,
          headers: process.env.NODE_ENV !== 'production' ? headers : undefined,
          body: requestBody && requestBody !== '{}' ? requestBody : undefined
        }
      );
    });
    
    next();
  }
} 