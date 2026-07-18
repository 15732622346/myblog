import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../users/entities/user.entity';
import { IpRegister } from './entities/ip-register.entity';
import { jwtConfig } from '../../config/jwt.config';

@Module({
  imports: [
    PassportModule,
    JwtModule.register(jwtConfig),
    TypeOrmModule.forFeature([User, IpRegister]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {} 