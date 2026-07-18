import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Advertisement } from './entities/advertisement.entity';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { User } from '../../auth/entities/user.entity';

@Injectable()
export class AdvertisementsService {
  private readonly logger = new Logger(AdvertisementsService.name);

  constructor(
    @InjectRepository(Advertisement)
    private advertisementsRepository: Repository<Advertisement>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userId: number, createAdvertisementDto: CreateAdvertisementDto): Promise<Advertisement> {
    // 检查用户是否已有广告
    const existing = await this.advertisementsRepository.findOne({ where: { user_id: userId } });
    
    if (existing) {
      // 如果已有广告，更新它
      existing.content = createAdvertisementDto.content;
      return this.advertisementsRepository.save(existing);
    }
    
    // 创建新广告
    const advertisement = this.advertisementsRepository.create({
      user_id: userId,
      content: createAdvertisementDto.content,
    });
    
    return this.advertisementsRepository.save(advertisement);
  }

  async findByUserId(userId: number): Promise<Advertisement> {
    const advertisement = await this.advertisementsRepository.findOne({
      where: { user_id: userId },
    });
    
    if (!advertisement) {
      // 如果用户没有广告，返回空内容的广告对象
      return this.createEmptyAd(userId);
    }
    
    return advertisement;
  }

  async findByUsername(username: string): Promise<Advertisement> {
    this.logger.debug(`正在查找用户 ${username} 的广告`);

    try {
      // 查找用户
      const user = await this.usersRepository.findOne({
        where: { username }
      });

      if (!user) {
        this.logger.debug(`用户 ${username} 不存在，返回空广告`);
        return this.createEmptyAd(0);
      }

      this.logger.debug(`找到用户: ID=${user.id}, 用户名=${user.username}`);

      // 查找用户的广告
      const advertisement = await this.advertisementsRepository.findOne({
        where: { user_id: user.id }
      });

      if (!advertisement) {
        this.logger.debug(`用户 ${username} (ID=${user.id}) 没有广告，返回空广告`);
        return this.createEmptyAd(user.id);
      }

      this.logger.debug(`成功找到用户 ${username} 的广告: ${JSON.stringify(advertisement)}`);
      return advertisement;
    } catch (error) {
      this.logger.error(`查找用户 ${username} 的广告时出错: ${error.message}`);
      return this.createEmptyAd(0);
    }
  }

  private createEmptyAd(userId: number): Advertisement {
    const emptyAd = new Advertisement();
    emptyAd.id = 0;
    emptyAd.user_id = userId;
    emptyAd.content = '';
    emptyAd.created_at = new Date();
    emptyAd.updated_at = new Date();
    return emptyAd;
  }

  async update(userId: number, updateAdvertisementDto: UpdateAdvertisementDto): Promise<Advertisement> {
    const advertisement = await this.advertisementsRepository.findOne({
      where: { user_id: userId },
    });
    
    if (!advertisement) {
      // 如果不存在，创建新广告
      return this.create(userId, updateAdvertisementDto as CreateAdvertisementDto);
    }
    
    // 更新广告
    const content = updateAdvertisementDto.content;
    if (content !== undefined) {
      advertisement.content = content;
    }
    
    return this.advertisementsRepository.save(advertisement);
  }

  async remove(userId: number, id: number): Promise<void> {
    const advertisement = await this.advertisementsRepository.findOne({
      where: { id },
    });
    
    if (!advertisement) {
      throw new NotFoundException('广告不存在');
    }
    
    // 检查是否是用户自己的广告
    if (advertisement.user_id !== userId) {
      throw new ForbiddenException('无权删除他人广告');
    }
    
    await this.advertisementsRepository.remove(advertisement);
  }
}