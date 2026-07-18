import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

/**
 * 数据库连接配置
 * 
 * 生产环境使用本地数据库:
 * - 主机: localhost
 * - 端口: 3306  
 * - 用户名: root
 * - 密码: MySQLRoot@2025
 * - 数据库: blog_system (确保已创建)
 */

// 获取配置
const isProduction = process.env.NODE_ENV === 'production';
const dbHost = process.env.DB_HOST || 'localhost';
// 全部使用3306端口
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbUsername = process.env.DB_USERNAME || 'root';
const dbPassword = process.env.DB_PASSWORD || 'MySQLRoot@2025';
const dbName = process.env.DB_DATABASE || 'blog_system';
const dbType = process.env.DB_TYPE || 'mysql';

// 打印实际使用的数据库配置
console.log('==========================================');
console.log('数据库配置模块 - 实际使用值:');
console.log('------------------------------------------');
console.log(`环境: ${isProduction ? 'production' : 'development'}`);
console.log(`主机: ${dbHost}`);
console.log(`端口: ${dbPort} (来自环境变量)`);
console.log(`用户: ${dbUsername}`);
console.log(`密码: ${dbPassword.substring(0, 2)}${'*'.repeat(Math.max(0, dbPassword.length - 2))}`);
console.log(`数据库: ${dbName}`);
console.log(`连接字符串: ${dbType}://${dbUsername}:******@${dbHost}:${dbPort}/${dbName}`);
console.log('==========================================');

export const databaseConfig: TypeOrmModuleOptions & DataSourceOptions = {
  type: dbType as any,
  host: dbHost,
  port: dbPort,
  username: dbUsername,
  password: dbPassword, 
  database: dbName,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.DB_SYNCHRONIZE === 'true' || false,
  logging: process.env.DB_LOGGING === 'true' || true,
  charset: 'utf8mb4',
  extra: {
    charset: 'utf8mb4_unicode_ci',
  },
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '30000', 10),
  retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '10', 10),
  retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000', 10),
}; 