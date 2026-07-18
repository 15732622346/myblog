import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'dev-secret-key', // 硬编码验证密钥,与生成token使用的密钥一致
    });
    this.logger.log(`JWT策略初始化`);
    this.logger.debug(`使用的 secret: dev...`);
    this.logger.debug(`当前环境: ${process.env.NODE_ENV}`);
    this.logger.debug(`完整JWT配置: jwtFromRequest=BearerToken, ignoreExpiration=false, secretLength=14`);
  }

  async validate(payload: any) {
    this.logger.debug('开始验证 JWT payload...');
    this.logger.debug(`收到的 payload: ${JSON.stringify({
      sub: payload?.sub,
      username: payload?.username,
      role: payload?.role,
      exp: payload?.exp ? new Date(payload.exp * 1000).toISOString() : 'undefined',
      iat: payload?.iat ? new Date(payload.iat * 1000).toISOString() : 'undefined'
    })}`);

    if (!payload) {
      this.logger.warn('JWT payload 为空');
      return null;
    }

    if (!payload.sub || !payload.username) {
      this.logger.warn('JWT payload 缺少必要字段');
      this.logger.debug(`缺失字段检查 - sub: ${!!payload.sub}, username: ${!!payload.username}`);
      return null;
    }

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      this.logger.warn(`JWT已过期: ${new Date(payload.exp * 1000).toISOString()}`);
      return null;
    }

    const user = {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    };

    this.logger.debug(`JWT验证成功: 用户 ${user.username} (ID: ${user.id}), 角色: ${user.role}`);
    return user;
  }
}