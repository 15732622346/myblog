import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestbookService } from './guestbook.service';
import { GuestbookController } from './guestbook.controller';
import { GuestbookMessage } from './entities/guestbook.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GuestbookMessage]),
    UsersModule,
  ],
  controllers: [GuestbookController],
  providers: [GuestbookService],
})
export class GuestbookModule {} 