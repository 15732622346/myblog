import { Injectable, Scope } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { Logger } from 'winston';

/**
 * 日志服务 - 提供统一的日志记录接口
 * 支持不同级别的日志记录,以及结构化日志
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  // 默认上下文
  private context: string = 'Application';
  
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}
  
  /**
   * 设置日志上下文
   * @param context 上下文名称(通常是类名或模块名)
   */
  setContext(context: string) {
    this.context = context;
    return this;
  }
  
  /**
   * 记录调试级别日志
   * @param message 日志消息
   * @param meta 额外元数据
   */
  debug(message: string, meta?: Record<string, any>) {
    this.logger.debug(message, {
      context: this.context,
      ...meta
    });
  }
  
  /**
   * 记录信息级别日志
   * @param message 日志消息
   * @param meta 额外元数据
   */
  log(message: string, meta?: Record<string, any>) {
    this.logger.info(message, {
      context: this.context,
      ...meta
    });
  }
  
  /**
   * 记录警告级别日志
   * @param message 日志消息
   * @param meta 额外元数据
   */
  warn(message: string, meta?: Record<string, any>) {
    this.logger.warn(message, {
      context: this.context,
      ...meta
    });
  }
  
  /**
   * 记录错误级别日志
   * @param message 日志消息
   * @param trace 错误堆栈
   * @param meta 额外元数据
   */
  error(message: string, trace?: string, meta?: Record<string, any>) {
    this.logger.error(message, {
      context: this.context,
      trace,
      ...meta
    });
  }
  
  /**
   * 记录严重错误级别日志
   * @param message 日志消息
   * @param meta 额外元数据
   */
  fatal(message: string, meta?: Record<string, any>) {
    // winston没有fatal级别,使用error代替
    this.logger.error(`[FATAL] ${message}`, {
      context: this.context,
      severity: 'FATAL',
      ...meta
    });
  }
  
  /**
   * 记录HTTP请求日志
   * @param method HTTP方法
   * @param url 请求URL
   * @param statusCode 状态码
   * @param responseTime 响应时间(毫秒)
   * @param meta 额外元数据
   */
  httpRequest(method: string, url: string, statusCode: number, responseTime: number, meta?: Record<string, any>) {
    const level = statusCode >= 500 ? 'error' : (statusCode >= 400 ? 'warn' : 'info');
    
    this.logger.log(level, `HTTP ${method} ${url} ${statusCode} ${responseTime}ms`, {
      context: 'HTTP',
      method,
      url,
      statusCode,
      responseTime,
      ...meta
    });
  }
  
  /**
   * 记录数据库操作日志
   * @param operation 操作类型
   * @param entity 实体名称
   * @param details 操作详情
   * @param meta 额外元数据
   */
  database(operation: string, entity: string, details: string, meta?: Record<string, any>) {
    this.logger.info(`DB ${operation} ${entity}: ${details}`, {
      context: 'Database',
      operation,
      entity,
      details,
      ...meta
    });
  }
  
  /**
   * 记录鉴权相关日志
   * @param action 操作类型
   * @param userId 用户ID
   * @param details 详情
   * @param meta 额外元数据
   */
  auth(action: string, userId: string | number, details: string, meta?: Record<string, any>) {
    this.logger.info(`AUTH ${action} User:${userId} - ${details}`, {
      context: 'Auth',
      action,
      userId,
      details,
      ...meta
    });
  }
} 