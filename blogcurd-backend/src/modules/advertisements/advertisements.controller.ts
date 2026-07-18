import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Logger, NotFoundException } from '@nestjs/common';
import { AdvertisementsService } from './advertisements.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('advertisements')
export class AdvertisementsController {
  private readonly logger = new Logger(AdvertisementsController.name);

  constructor(private readonly advertisementsService: AdvertisementsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() createAdvertisementDto: CreateAdvertisementDto) {
    this.logger.debug(`创建广告: ${JSON.stringify(createAdvertisementDto)}`);
    try {
      const result = await this.advertisementsService.create(req.user.id, createAdvertisementDto);
      this.logger.debug(`创建广告成功: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`创建广告失败: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async findMine(@Request() req) {
    this.logger.debug(`查找我的广告: 用户ID ${req.user.id}`);
    try {
      const result = await this.advertisementsService.findByUserId(req.user.id);
      this.logger.debug(`查找广告成功: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`查找广告失败: ${error.message}`);
      throw error;
    }
  }

  @Get('by-username/:username')
  async findByUsername(@Param('username') username: string) {
    this.logger.debug(`根据用户名查找广告: ${username}`);
    if (!username) {
      this.logger.warn('用户名为空，无法查找广告');
      throw new NotFoundException('用户名不能为空');
    }
    
    try {
      const result = await this.advertisementsService.findByUsername(username);
      this.logger.debug(`查找广告成功: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`查找广告失败: ${error.message}`);
      // 返回空广告而不是错误
      return {
        id: 0,
        user_id: 0,
        content: '',
        created_at: new Date(),
        updated_at: new Date()
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async update(@Request() req, @Body() updateAdvertisementDto: UpdateAdvertisementDto) {
    this.logger.debug(`更新广告: ${JSON.stringify(updateAdvertisementDto)}`);
    try {
      const result = await this.advertisementsService.update(req.user.id, updateAdvertisementDto);
      this.logger.debug(`更新广告成功: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`更新广告失败: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    this.logger.debug(`删除广告: ID ${id}`);
    try {
      const result = await this.advertisementsService.remove(req.user.id, +id);
      this.logger.debug(`删除广告成功`);
      return result;
    } catch (error) {
      this.logger.error(`删除广告失败: ${error.message}`);
      throw error;
    }
  }
}