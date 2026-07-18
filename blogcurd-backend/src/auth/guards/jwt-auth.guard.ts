import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { headers, url, method } = request;

    this.logger.debug(`认证请求: ${method} ${url}`);
    this.logger.debug(`请求头: ${JSON.stringify(headers)}`);

    if (!headers.authorization) {
      this.logger.warn('请求被拦截: 缺少 Authorization 头');
      return false;
    }

    const token = headers.authorization.replace('Bearer ', '');
    this.logger.debug(`Token: ${token.substring(0, 20)}...`);

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err) {
      this.logger.error(`认证错误: ${err.message}`);
      throw err;
    }
    
    if (!user) {
      this.logger.warn(`认证失败: ${info?.message || '未知原因'}`);
      return false;
    }

    this.logger.debug(`认证成功: 用户 ${user.username}`);
    return user;
  }
} 