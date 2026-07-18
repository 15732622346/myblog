import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { GuestbookMessage } from './entities/guestbook.entity';
import { CreateGuestbookMessageDto } from './dto/create-guestbook-message.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class GuestbookService {
  private readonly logger = new Logger(GuestbookService.name);

  constructor(
    @InjectRepository(GuestbookMessage)
    private guestbookRepository: Repository<GuestbookMessage>,
    private usersService: UsersService,
  ) {}

  async createMessage(createGuestbookMessageDto: CreateGuestbookMessageDto, userId: number) {
    // 直接打印到控制台
    console.log('\n\n=========== 留言服务处理（控制台输出）===========');
    console.log(`时间: ${new Date().toISOString()}`);
    console.log(`传入参数对象: `, createGuestbookMessageDto);
    console.log(`userId: ${userId}`);
    console.log(`content: ${createGuestbookMessageDto.content}`);
    console.log(`visitor_name: ${createGuestbookMessageDto.visitor_name}`);
    console.log(`visitor_name是否存在: ${createGuestbookMessageDto.hasOwnProperty('visitor_name')}`);
    console.log(`visitor_name类型: ${typeof createGuestbookMessageDto.visitor_name}`);
    console.log('====================================================\n\n');
    
    // 继续使用logger记录
    this.logger.debug(`===== 留言服务处理 =====`);
    this.logger.debug(`创建留言: userId=${userId}, content=${createGuestbookMessageDto.content}`);
    try {
      const message = this.guestbookRepository.create({
        ...createGuestbookMessageDto,
        user_id: userId,
      });
      const result = await this.guestbookRepository.save(message);
      this.logger.debug(`留言创建成功: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`留言创建失败: ${error.message}`);
      
      // 直接打印错误到控制台
      console.log('\n\n=========== 留言创建错误（控制台输出）===========');
      console.log(`错误消息: ${error.message}`);
      console.log(`错误对象: `, error);
      console.log(`错误堆栈: ${error.stack}`);
      console.log('====================================================\n\n');
      
      throw error;
    }
  }

  async findMessagesByUserId(userId: number) {
    this.logger.debug(`获取用户留言: userId=${userId}`);
    try {
      const result = await this.guestbookRepository.find({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
      });
      this.logger.debug(`获取用户留言成功，共 ${result.length} 条`);
      return result;
    } catch (error) {
      this.logger.error(`获取用户留言失败: ${error.message}`);
      throw error;
    }
  }

  async findMessagesByUsername(username: string, page: number = 1, limit: number = 10): Promise<{ data: GuestbookMessage[]; total: number }> {
    this.logger.debug(`根据用户名获取留言: username=${username}, page=${page}, limit=${limit}`);
    try {
      const user = await this.usersService.findByUsername(username);
      if (!user) {
        this.logger.warn(`用户不存在: username=${username}`);
        throw new NotFoundException('用户不存在');
      }

      // 计算需要跳过的记录数
      const skip = (page - 1) * limit;
      
      // 使用 findAndCount 来同时获取分页数据和总数
      const [result, total] = await this.guestbookRepository.findAndCount({
        where: { user_id: user.id },
        order: { created_at: 'DESC' },
        take: limit, // 获取指定数量的记录
        skip: skip,   // 跳过前面的记录
      });
      
      this.logger.debug(`获取用户留言成功，当前页 ${page} 共 ${result.length} 条，总共 ${total} 条`);
      // 返回包含数据和总数的对象
      return { data: result, total }; 
    } catch (error) {
      this.logger.error(`获取用户留言失败: ${error.message}`);
      throw error;
    }
  }

  async findUserByUsername(username: string) {
    this.logger.debug(`查找用户: username=${username}`);
    try {
      const user = await this.usersService.findByUsername(username);
      if (!user) {
        this.logger.warn(`用户不存在: username=${username}`);
      } else {
        this.logger.debug(`用户查找成功: ${JSON.stringify(user)}`);
      }
      return user;
    } catch (error) {
      this.logger.error(`用户查找失败: ${error.message}`);
      throw error;
    }
  }

  async countTodayMessagesByIpAndUsername(ip: string, username: string) {
    this.logger.debug(`计算今日留言数量: ip=${ip}, username=${username}`);
    try {
      // 查找用户
      const user = await this.usersService.findByUsername(username);
      if (!user) {
        this.logger.warn(`用户不存在: username=${username}`);
        throw new NotFoundException('用户不存在');
      }

      // 创建今天的开始和结束时间
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // 查询该IP今天对此用户的留言数量
      const count = await this.guestbookRepository.count({
        where: {
          visitor_name: ip,
          user_id: user.id,
          created_at: Between(today, tomorrow)
        }
      });
      
      this.logger.debug(`今日留言数量: ${count}`);
      return count;
    } catch (error) {
      this.logger.error(`计算留言数量失败: ${error.message}`);
      throw error;
    }
  }

  async deleteMessage(id: number, userId: number) {
    this.logger.debug(`删除留言: id=${id}, userId=${userId}`);
    try {
      const message = await this.guestbookRepository.findOne({
        where: { id, user_id: userId },
      });

      if (!message) {
        this.logger.warn(`留言不存在或无权删除: id=${id}, userId=${userId}`);
        throw new NotFoundException('留言不存在或无权删除');
      }

      const result = await this.guestbookRepository.remove(message);
      this.logger.debug(`删除留言成功: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`删除留言失败: ${error.message}`);
      throw error;
    }
  }
} 
