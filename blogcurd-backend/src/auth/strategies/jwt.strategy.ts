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
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
    this.logger.log('JWT策略已初始化');
  }

  async validate(payload: any) {
    this.logger.debug(`验证JWT载荷: ${JSON.stringify({
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
      exp: new Date(payload.exp * 1000).toISOString()
    })}`);

    if (!payload) {
      this.logger.warn('JWT载荷为空');
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

    this.logger.debug(`JWT验证成功: 用户 ${user.username}`);
    return user;
  }
}