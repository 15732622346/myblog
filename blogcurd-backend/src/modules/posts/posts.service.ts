import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private logger: LoggerService
  ) {
    this.logger.setContext('PostsService');
  }

  async create(createPostDto: CreatePostDto, userId: number): Promise<Post> {
    const { category_ids, ...postData } = createPostDto;
    
    // 创建文章实例
    const post = this.postsRepository.create({
      ...postData,
      user_id: userId,
    });

    // 如果有分类ID，查找对应的分类
    if (category_ids && category_ids.length > 0) {
      post.categories = await this.categoriesRepository.findByIds(category_ids);
    }

    // 保存文章及其关联
    return await this.postsRepository.save(post);
  }

  async findAll(
    userId: number,
    params?: {
      keyword?: string;
      startTime?: Date;
      endTime?: Date;
      categoryId?: number;
    }
  ): Promise<Post[]> {
    // 创建基础查询构建器
    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.categories', 'category')
      .where('post.user_id = :userId', { userId });

    if (params) {
      // 关键词搜索（标题和内容）
      if (params.keyword) {
        queryBuilder.andWhere(
          '(post.title LIKE :keyword OR post.content LIKE :keyword)',
          { keyword: `%${params.keyword}%` },
        );
      }

      // 时间范围筛选
      if (params.startTime) {
        queryBuilder.andWhere('post.created_at >= :startTime', {
          startTime: params.startTime,
        });
      }
      if (params.endTime) {
        queryBuilder.andWhere('post.created_at <= :endTime', {
          endTime: params.endTime,
        });
      }

      // 分类筛选 - 确保只筛选用户自己的分类
      if (params.categoryId) {
        queryBuilder
          .andWhere('category.id = :categoryId', { categoryId: params.categoryId })
          .andWhere('category.user_id = :userId', { userId });
      }
    }

    queryBuilder.orderBy('post.created_at', 'DESC');
    return await queryBuilder.getMany();
  }

  async findOne(id: number, userId: number): Promise<Post> {
    this.logger.log(`Finding post by id and userId: ${JSON.stringify({ id, userId })}`);
    
    // 先查询用户的文章
    const post = await this.postsRepository
      .createQueryBuilder('post')
      .where('post.id = :id', { id })
      .andWhere('post.user_id = :userId', { userId })
      // 然后关联分类
      .leftJoinAndSelect('post.categories', 'category')
      .getOne();

    if (!post) {
      throw new NotFoundException(`文章ID ${id} 不存在或您没有权限访问`);
    }

    this.logger.debug(`Found post: ${JSON.stringify(post)}`);
    return post;
  }

  async update(id: number, updatePostDto: Partial<CreatePostDto>, userId: number): Promise<Post> {
    const { category_ids, ...postData } = updatePostDto;

    // 更新文章基本信息
    const result = await this.postsRepository
      .createQueryBuilder()
      .update(Post)
      .set(postData)
      .where('id = :id', { id })
      .andWhere('user_id = :userId', { userId })
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException(`文章不存在或您没有权限访问`);
    }

    // 如果提供了分类ID，更新分类关联
    if (category_ids) {
      const post = await this.findOne(id, userId);
      const categories = await this.categoriesRepository
        .createQueryBuilder('category')
        .where('category.id IN (:...ids)', { ids: category_ids })
        .andWhere('category.user_id = :userId', { userId })
        .getMany();
      post.categories = categories;
      await this.postsRepository.save(post);
    }

    return await this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    const result = await this.postsRepository
      .createQueryBuilder()
      .delete()
      .from(Post)
      .where('id = :id', { id })
      .andWhere('user_id = :userId', { userId })
      .execute();
    
    if (result.affected === 0) {
      throw new NotFoundException(`文章不存在或您没有权限访问`);
    }
  }

  async findPublicByUser(userId: number, page: number = 1, limit: number = 10, title?: string, category_id?: number) {
    this.logger.debug(`[findPublicByUser] Input params: ${JSON.stringify({ userId, page, limit, title, category_id })}`);
    
    const skip = (page - 1) * limit;

    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.categories', 'category');

    // 基础条件
    queryBuilder
      .where('post.user_id = :userId', { userId })
      .andWhere('post.status = :status', { status: 'published' });

    // 标题搜索
    if (title) {
      queryBuilder.andWhere('post.title LIKE :title', { title: `%${title}%` });
    }

    // 分类过滤
    if (category_id) {
      this.logger.debug(`[findPublicByUser] Applying category filter: ${category_id}`);
      queryBuilder.andWhere('category.id = :categoryId', { categoryId: category_id });
    }

    // 排序
    queryBuilder
      .orderBy('post.is_pinned', 'DESC')
      .addOrderBy('post.created_at', 'DESC');

    // 获取SQL查询
    const sql = queryBuilder.getSql();
    const params = queryBuilder.getParameters();
    this.logger.debug(`[findPublicByUser] Generated SQL: ${sql}`);
    this.logger.debug(`[findPublicByUser] Query params: ${JSON.stringify(params)}`);

    // 分页
    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    this.logger.debug(`[findPublicByUser] Query results: ${JSON.stringify({
      total,
      itemsCount: items.length,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        categoryIds: item.categories.map(c => c.id)
      }))
    })}`);

    // 获取用户信息
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'username']
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      user: {
        id: user.id,
        username: user.username
      }
    };
  }

  async findPublicByUsername(username: string, page: number = 1, limit: number = 10, title?: string, category_id?: number) {
    // 先查找用户
    const user = await this.usersRepository.findOne({
      where: { username },
      select: ['id', 'username']
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 再查找该用户的公开文章
    return this.findPublicByUser(user.id, page, limit, title, category_id);
  }

  async findPublicOne(id: number) {
    const post = await this.postsRepository.findOne({
      where: {
        id,
        status: 'published' // 只返回已发布的
      },
      relations: ['categories']
    });

    if (!post) {
      throw new NotFoundException('文章不存在或未公开');
    }

    // 增加浏览次数
    post.view_count = (post.view_count || 0) + 1;
    await this.postsRepository.save(post);

    // 添加用户信息
    const user = await this.usersRepository.findOne({
      where: { id: post.user_id },
      select: ['id', 'username']
    });

    if (!user) {
      throw new NotFoundException('文章作者不存在');
    }

    return {
      ...post,
      user: {
        id: user.id,
        username: user.username
      }
    };
  }

  async findAllPublic(page: number = 1, limit: number = 10) {
    const [items, total] = await this.postsRepository.findAndCount({
      where: { status: 'published' },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'categories'],
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPublicCategoriesByUsername(username: string) {
    // 先查找用户
    const user = await this.usersRepository.findOne({
      where: { username },
      select: ['id', 'username']
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 查找该用户的所有公开文章的分类
    const categories = await this.categoriesRepository
      .createQueryBuilder('category')
      .select([
        'category.id',
        'category.name',
        'category.description'
      ])
      .distinct(true)
      .innerJoin('blog_categories', 'bc', 'bc.category_id = category.id')
      .innerJoin('blogs', 'blog', 'blog.id = bc.blog_id')
      .where('blog.user_id = :userId', { userId: user.id })
      .andWhere('blog.status = :status', { status: 'published' })
      .getRawMany();

    return categories.map(cat => ({
      id: cat.category_id,
      name: cat.category_name,
      description: cat.category_description
    }));
  }
} 