import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ConfigModule } from '@nestjs/config';
import { minioConfig } from '../../config/minio.config';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { Client } from 'minio';

@Module({
  imports: [
    TypeOrmModule.forFeature([File]),
    ConfigModule,
    UsersModule,
  ],
  controllers: [FilesController],
  providers: [
    {
      provide: 'MINIO',
      useFactory: () => {
        return new Client({
          endPoint: minioConfig.endPoint,
          port: minioConfig.port,
          useSSL: minioConfig.useSSL,
          accessKey: minioConfig.accessKey,
          secretKey: minioConfig.secretKey,
        });
      },
    },
    FilesService,
  ],
  exports: [FilesService],
})
export class FilesModule {}