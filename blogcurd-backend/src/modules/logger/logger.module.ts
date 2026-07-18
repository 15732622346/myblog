import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from '../../config/logger.config';

/**
 * 全局日志模块 - 提供统一的日志服务
 * 使用@Global()装饰器使该模块全局可用
 */
@Global()
@Module({
  imports: [
    // 导入并配置Winston日志模块
    WinstonModule.forRoot(loggerConfig),
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {} 