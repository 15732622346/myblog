import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto, @Req() req: Request) {
    const userId = (req.user as any).id;
    if (!userId) {
      throw new ForbiddenException('未登录或登录已过期');
    }
    return this.categoriesService.create(createCategoryDto, userId);
  }

  @Get()
  async findAll(@Req() req: Request) {
    const userId = (req.user as any).id;
    if (!userId) {
      throw new ForbiddenException('未登录或登录已过期');
    }
    return this.categoriesService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    if (!userId) {
      throw new ForbiddenException('未登录或登录已过期');
    }
    return this.categoriesService.findOne(+id, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateCategoryDto: Partial<CreateCategoryDto>,
    @Req() req: Request
  ) {
    const userId = (req.user as any).id;
    if (!userId) {
      throw new ForbiddenException('未登录或登录已过期');
    }
    return this.categoriesService.update(+id, updateCategoryDto, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    if (!userId) {
      throw new ForbiddenException('未登录或登录已过期');
    }
    return this.categoriesService.remove(+id, userId);
  }
}