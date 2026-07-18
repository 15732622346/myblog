import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { WorksService } from './works.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('works')
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  // 后台接口 - 创建作品
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createWorkDto: CreateWorkDto) {
    return this.worksService.create(req.user.id, createWorkDto);
  }

  // 后台接口 - 获取我的作品（唯一一条）
  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMine(@Request() req) {
    return this.worksService.findByUserId(req.user.id);
  }

  // 前台接口 - 通过用户名获取作品（唯一一条）
  @Get('by-username/:username')
  findByUsername(@Param('username') username: string) {
    return this.worksService.findByUsername(username);
  }

  // 前台接口 - 获取作品详情
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.worksService.findOne(+id);
  }

  // 后台接口 - 更新作品
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateWorkDto: UpdateWorkDto) {
    return this.worksService.update(req.user.id, +id, updateWorkDto);
  }

  // 后台接口 - 删除作品
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.worksService.remove(req.user.id, +id);
  }
} 