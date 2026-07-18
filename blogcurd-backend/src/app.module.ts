import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { FilesModule } from './modules/files/files.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { GuestbookModule } from './modules/guestbook/guestbook.module';
import { AdvertisementsModule } from './modules/advertisements/advertisements.module';
import { WorksModule } from './modules/works/works.module';
import { Post } from './modules/posts/entities/post.entity';
import { Category } from './modules/categories/entities/category.entity';
import { User } from './modules/auth/entities/user.entity';
import { Resume } from './modules/resumes/entities/resume.entity';
import { GuestbookMessage } from './modules/guestbook/entities/guestbook.entity';
import { Advertisement } from './modules/advertisements/entities/advertisement.entity';
import { databaseConfig } from './config/database.config';
import { config } from 'dotenv';
import { HttpLoggerMiddleware } from './middleware/http-logger.middleware';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from './config/logger.config';
import { LoggerModule } from './modules/logger/logger.module';

// 加载环境变量
const envFilePath = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';

config({ path: join(process.cwd(), envFilePath) });

@Module({
  imports: [
    // 配置环境变量
    ConfigModule.forRoot({
      envFilePath,
      isGlobal: true,
    }),
    
    // 配置日志
    LoggerModule,
    
    // 配置数据库
    TypeOrmModule.forRoot(databaseConfig),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/api/uploads',
    }),
    TypeOrmModule.forFeature([Post, Category, User, Resume, GuestbookMessage, Advertisement]),
    AuthModule,
    UsersModule,
    PostsModule,
    CategoriesModule,
    FilesModule,
    ResumesModule,
    GuestbookModule,
    AdvertisementsModule,
    WorksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 应用HTTP日志中间件到所有路由
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
