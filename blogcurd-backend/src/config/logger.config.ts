import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

// 确保日志目录存在
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志文件路径
const errorLogPath = path.join(logDir, 'error.log');
const combinedLogPath = path.join(logDir, 'combined.log');
const accessLogPath = path.join(logDir, 'access.log');

// 日志级别映射
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 根据环境设置日志级别
const level = () => {
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

// 日志颜色定义
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// 添加颜色
winston.addColors(colors);

// 定义日志输出格式
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  nestWinstonModuleUtilities.format.nestLike('BlogSystem', {
    prettyPrint: true,
    colors: true,
  }),
);

// 定义文件日志格式 (不包含颜色代码)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json(),
);

// 创建每日轮转日志传输器
const dailyErrorTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
  format: fileFormat,
});

const dailyCombinedTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
});

/**
 * Winston日志配置
 * 开发环境: 控制台彩色输出
 * 生产环境: 文件日志 + 控制台简化输出
 */
export const loggerConfig = {
  levels,
  level: level(),
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // 生产环境添加文件日志
    ...(process.env.NODE_ENV === 'production' 
      ? [dailyErrorTransport, dailyCombinedTransport] 
      : []),
  ],
  // 异常捕获
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      format: fileFormat,
    }),
  ],
  // 拒绝捕获
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'rejections.log'),
      format: fileFormat,
    }),
  ],
};

// 创建HTTP请求日志记录中间件
export const httpLoggerFormat = winston.format.printf(({ level, message, timestamp, context, ...meta }) => {
  return JSON.stringify({
    '@timestamp': timestamp,
    level,
    message,
    context: context || 'HTTP',
    ...meta,
  });
}); 