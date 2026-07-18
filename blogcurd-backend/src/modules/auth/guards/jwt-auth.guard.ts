import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger('JwtAuthGuard');

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const { url, method, headers } = request;
    
    this.logger.debug(`认证请求: ${method} ${url}`);
    this.logger.debug(`请求头: ${JSON.stringify(headers)}`);
    
    // 记录token信息(不显示完整token)
    const token = headers.authorization?.split(' ')[1];
    if (token) {
      this.logger.debug(`Token: ${token.substring(0, 20)}...`);
      
      // 计算token的MD5用于对比
      const tokenMD5 = crypto.createHash('md5').update(token).digest('hex');
      this.logger.debug(`Token MD5: ${tokenMD5} (用于对比前后端token)`);
      
      // 尝试解析token结构以便调试
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const headerBase64 = tokenParts[0];
          const payloadBase64 = tokenParts[1];
          const signature = tokenParts[2];
          
          try {
            const header = JSON.parse(Buffer.from(headerBase64, 'base64').toString());
            this.logger.debug(`Token header: ${JSON.stringify(header)}`);
            
            const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
            this.logger.debug(`Token payload: ${JSON.stringify({
              sub: payload.sub,
              username: payload.username,
              role: payload.role,
              exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'undefined',
              iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'undefined'
            })}`);
            
            this.logger.debug(`Token签名长度: ${signature.length}, 签名前几位: ${signature.substring(0, 10)}...`);
            
            // 记录JWT算法信息
            if (header.alg) {
              this.logger.debug(`JWT使用算法: ${header.alg}, 类型: ${header.typ || 'unknown'}`);
            }
            
            // 检查token是否过期
            if (payload.exp) {
              const expTime = payload.exp * 1000;
              const now = Date.now();
              this.logger.debug(`Token过期时间: ${new Date(expTime).toISOString()}, 当前时间: ${new Date(now).toISOString()}, 是否过期: ${now > expTime}`);
            }
          } catch (err) {
            this.logger.warn(`Token解析失败: ${err instanceof Error ? err.message : String(err)}`);
          }
        } else {
          this.logger.warn(`无效Token格式: 期望3部分(header.payload.signature), 实际: ${tokenParts.length}部分`);
        }
      } catch (err) {
        this.logger.warn(`无法解析Token: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      this.logger.debug('未提供Token');
    }

    // 调用父类的canActivate方法进行实际验证
    try {
      const result = super.canActivate(context);
      if (result instanceof Promise) {
        return result.catch(error => {
          this.logger.warn(`认证失败: ${error.message || '未知错误'}`);
          throw new UnauthorizedException('认证失败，请重新登录');
        });
      }
      return result;
    } catch (error) {
      this.logger.warn(`直接认证失败: ${error instanceof Error ? error.message : String(error)}`);
      throw new UnauthorizedException('认证失败，请重新登录');
    }
  }
  
  // 处理请求上下文
  handleRequest(err, user, info) {
    if (err || !user) {
      this.logger.warn(`JWT验证失败: ${err?.message || info?.message || '未知原因'}`);
      throw new UnauthorizedException('认证失败，请重新登录');
    }
    
    this.logger.debug(`请求已认证: 用户ID ${user.id}, 用户名 ${user.username}, 角色 ${user.role}`);
    return user;
  }
} 