import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resume } from './entities/resume.entity';
import { CreateResumeDto } from './dto/create-resume.dto';

@Injectable()
export class ResumesService {
  constructor(
    @InjectRepository(Resume)
    private resumesRepository: Repository<Resume>,
  ) {}

  async create(createResumeDto: CreateResumeDto, userId: number) {
    const resume = this.resumesRepository.create({
      ...createResumeDto,
      user_id: userId,
    });
    return await this.resumesRepository.save(resume);
  }

  async findByUserId(userId: number) {
    return await this.resumesRepository.findOne({
      where: { user_id: userId },
    });
  }

  async findPublicByUsername(username: string) {
    const resume = await this.resumesRepository
      .createQueryBuilder('resume')
      .innerJoin('resume.user', 'user')
      .where('user.username = :username', { username })
      .andWhere('resume.is_public = :isPublic', { isPublic: true })
      .getOne();

    if (!resume) {
      throw new NotFoundException('未找到公开的简历');
    }

    return resume;
  }

  async update(userId: number, updateResumeDto: Partial<CreateResumeDto>) {
    const resume = await this.findByUserId(userId);
    if (!resume) {
      return this.create(updateResumeDto as CreateResumeDto, userId);
    }

    Object.assign(resume, updateResumeDto);
    return await this.resumesRepository.save(resume);
  }
} 