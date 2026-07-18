import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './modules/posts/entities/post.entity';
import { Category } from './modules/categories/entities/category.entity';
import { User } from './modules/auth/entities/user.entity';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('statistics')
  async getStatistics() {
    const [
      postCount,
      categoryCount,
      userCount,
      totalViews,
    ] = await Promise.all([
      this.postRepository.count(),
      this.categoryRepository.count(),
      this.userRepository.count(),
      this.postRepository
        .createQueryBuilder('post')
        .select('SUM(post.view_count)', 'total')
        .getRawOne()
        .then(result => Number(result.total) || 0),
    ]);

    return {
      postCount,
      categoryCount,
      userCount,
      totalViews,
    };
  }
}
