import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvertisementsService } from './advertisements.service';
import { AdvertisementsController } from './advertisements.controller';
import { Advertisement } from './entities/advertisement.entity';
import { User } from '../../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Advertisement, User])],
  controllers: [AdvertisementsController],
  providers: [AdvertisementsService],
  exports: [AdvertisementsService]
})
export class AdvertisementsModule {} 