import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Work } from './entities/work.entity';
import { User } from '../auth/entities/user.entity';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';

@Injectable()
export class WorksService {
  constructor(
    @InjectRepository(Work)
    private worksRepository: Repository<Work>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userId: number, createWorkDto: CreateWorkDto): Promise<Work> {
    // 检查该用户是否已有作品
    let work = await this.worksRepository.findOne({ where: { user_id: userId } });
    if (work) {
      // 已有则更新
      Object.assign(work, createWorkDto);
      return this.worksRepository.save(work);
    } else {
      // 没有则创建
      work = this.worksRepository.create({
        user_id: userId,
        ...createWorkDto,
      });
      return this.worksRepository.save(work);
    }
  }

  async findByUserId(userId: number): Promise<Work | null> {
    return this.worksRepository.findOne({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findByUsername(username: string): Promise<Work | null> {
    const user = await this.usersRepository.findOne({
      where: { username },
    });
    if (!user) {
      return null;
    }
    const work = await this.worksRepository.findOne({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
    });
    console.log('Backend: findByUsername 查询到的作品:', work);
    return work;
  }

  async findOne(id: number): Promise<Work> {
    const work = await this.worksRepository.findOne({ where: { id } });
    if (!work) {
      throw new NotFoundException('作品不存在');
    }
    return work;
  }

  async update(userId: number, id: number, updateWorkDto: UpdateWorkDto): Promise<Work> {
    const work = await this.worksRepository.findOne({ where: { id } });
    if (!work) {
      throw new NotFoundException('作品不存在');
    }
    if (work.user_id !== userId) {
      throw new ForbiddenException('无权更新他人作品');
    }
    Object.assign(work, updateWorkDto);
    return this.worksRepository.save(work);
  }

  async remove(userId: number, id: number): Promise<void> {
    const work = await this.worksRepository.findOne({ where: { id } });
    if (!work) {
      throw new NotFoundException('作品不存在');
    }
    if (work.user_id !== userId) {
      throw new ForbiddenException('无权删除他人作品');
    }
    await this.worksRepository.remove(work);
  }
} 