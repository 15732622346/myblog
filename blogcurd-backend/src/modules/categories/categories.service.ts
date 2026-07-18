import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, userId: number): Promise<Category> {
    const category = this.categoriesRepository.create({
      ...createCategoryDto,
      user_id: userId
    });
    return await this.categoriesRepository.save(category);
  }

  async findAll(userId: number): Promise<Category[]> {
    return await this.categoriesRepository
      .createQueryBuilder('category')
      .where('category.user_id = :userId', { userId })
      .orderBy('category.created_at', 'DESC')
      .getMany();
  }

  async findOne(id: number, userId: number): Promise<Category> {
    const category = await this.categoriesRepository
      .createQueryBuilder('category')
      .where('category.id = :id', { id })
      .andWhere('category.user_id = :userId', { userId })
      .getOne();
    
    if (!category) {
      throw new NotFoundException(`分类不存在或您没有权限访问`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: Partial<CreateCategoryDto>, userId: number): Promise<Category> {
    const result = await this.categoriesRepository
      .createQueryBuilder()
      .update(Category)
      .set(updateCategoryDto)
      .where('id = :id', { id })
      .andWhere('user_id = :userId', { userId })
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException(`分类不存在或您没有权限访问`);
    }

    return await this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    const result = await this.categoriesRepository
      .createQueryBuilder()
      .delete()
      .from(Category)
      .where('id = :id', { id })
      .andWhere('user_id = :userId', { userId })
      .execute();
    
    if (result.affected === 0) {
      throw new NotFoundException(`分类不存在或您没有权限访问`);
    }
  }
} 