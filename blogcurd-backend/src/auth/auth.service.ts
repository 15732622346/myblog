import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async register(registerDto: { username: string; password: string; email: string }) {
    // 分别检查用户名和邮箱
    const existingUsername = await this.userRepository.findOne({
      where: { username: registerDto.username }
    });
    
    if (existingUsername) {
      throw new ConflictException('用户名已存在');
    }

    const existingEmail = await this.userRepository.findOne({
      where: { email: registerDto.email }
    });

    if (existingEmail) {
      throw new ConflictException('邮箱已存在');
    }

    // 创建新用户
    const hashedPassword = await this.hashPassword(registerDto.password);
    const newUser = this.userRepository.create({
      username: registerDto.username,
      password: hashedPassword,
      email: registerDto.email,
      role: 'user'
    });
    
    await this.userRepository.save(newUser);
    
    // 返回用户信息（不包含密码）
    const { password, ...result } = newUser;
    return result;
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { username }
    });
    
    if (user && await this.comparePasswords(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('用户名或密码错误');
  }

  async login(user: any) {
    const payload = {
      username: user.username,
      sub: user.id,
      email: user.email,
      role: user.role
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  private async comparePasswords(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }
} 