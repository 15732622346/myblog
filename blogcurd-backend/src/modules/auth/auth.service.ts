import { Injectable, ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { IpRegister } from './entities/ip-register.entity';
import { LoggerService } from '../logger/logger.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(IpRegister)
    private ipRegisterRepository: Repository<IpRegister>,
    private jwtService: JwtService,
    private logger: LoggerService
  ) {
    this.logger.setContext('AuthService');
  }

  async register(registerDto: RegisterDto, clientIp: string) {
    this.logger.log(`尝试注册新用户: ${registerDto.username}, IP: ${clientIp}`);
    
    // 检查IP地址今日是否已经注册过账号
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ipRegistrations = await this.ipRegisterRepository.count({
      where: {
        ip: clientIp,
        created_at: MoreThanOrEqual(today)
      }
    });

    if (ipRegistrations > 0) {
      this.logger.warn(`注册失败: IP ${clientIp} 今日已注册过账号`);
      throw new ForbiddenException('每个IP每天只能注册一个账号');
    }

    // 检查用户名是否已存在
    const existingUsername = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });
    if (existingUsername) {
      this.logger.warn(`注册失败: 用户名 ${registerDto.username} 已存在`);
      throw new ConflictException('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existingEmail) {
      this.logger.warn(`注册失败: 邮箱 ${registerDto.email} 已被注册`);
      throw new ConflictException('邮箱已被注册');
    }

    // 对密码进行加密
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 创建新用户
    const user = await this.userRepository.save({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
      role: 'user',
    });

    // 记录IP注册信息
    await this.ipRegisterRepository.save({
      ip: clientIp
    });

    this.logger.auth('注册', user.id, `用户注册成功`, {
      username: user.username,
      email: user.email,
      ip: clientIp
    });

    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    this.logger.debug(`尝试登录用户: ${loginDto.username}`);

    // 查找用户
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      this.logger.warn(`登录失败: 用户 ${loginDto.username} 不存在`);
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`登录失败: 用户 ${loginDto.username} 密码错误`);
      throw new UnauthorizedException('用户名或密码错误');
    }

    this.logger.debug(`用户 ${loginDto.username} 密码验证成功`);

    // 生成JWT token
    const payload = { 
      sub: user.id, 
      username: user.username,
      role: user.role 
    };

    this.logger.debug(`正在为用户 ${user.username} 生成 token，payload: ${JSON.stringify(payload)}`);
    
    // 记录JWT配置
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-here';
    const jwtExpires = process.env.JWT_EXPIRES_IN || '7d';
    this.logger.debug(`JWT配置: SECRET长度=${jwtSecret.length}, EXPIRES_IN=${jwtExpires}`);
    this.logger.debug(`JWT SECRET 前3位: ${jwtSecret.substring(0, 3)}...`);
    
    const token = await this.jwtService.signAsync(payload);
    this.logger.debug(`Token 生成成功，长度: ${token.length} 字符`);
    
    // 计算token的MD5以便与前端token对比
    const tokenMD5 = crypto.createHash('md5').update(token).digest('hex');
    this.logger.debug(`生成的Token MD5: ${tokenMD5} (用于对比前后端token)`);
    
    // 解析生成的token
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      try {
        const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
        this.logger.debug(`生成的Token header: ${JSON.stringify(header)}`);
      } catch (error) {
        this.logger.error(`解析Token header失败: ${error.message}`, error.stack);
      }
    }
    
    // 解码生成的 token 进行验证
    try {
      const decoded = await this.jwtService.verifyAsync(token);
      this.logger.debug(`Token 验证成功，解码后的数据: ${JSON.stringify({
        sub: decoded.sub,
        username: decoded.username,
        role: decoded.role,
        exp: new Date(decoded.exp * 1000).toISOString(),
        iat: new Date(decoded.iat * 1000).toISOString()
      })}`);
    } catch (error) {
      this.logger.error(`Token 验证失败: ${error.message}`, error.stack);
    }
    
    this.logger.auth('登录', user.id, `用户登录成功`, {
      username: user.username,
      role: user.role
    });
    
    const { password, ...result } = user;
    return {
      access_token: token,
      user: result,
    };
  }
}