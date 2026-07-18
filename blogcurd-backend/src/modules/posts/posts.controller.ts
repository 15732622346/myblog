import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, UnauthorizedException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPostDto: CreatePostDto, @Request() req) {
    return this.postsService.create(createPostDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Request() req,
    @Query('keyword') keyword?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.postsService.findAll(req.user.id, {
      keyword,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      categoryId: categoryId ? +categoryId : undefined,
    });
  }

  @Get('public')
  findAllPublic(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return this.postsService.findAllPublic(+page, +limit);
  }

  @Get('public/by-user/:userId')
  findPublicByUser(
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('title') title?: string,
    @Query('category_id') category_id?: string,
  ) {
    return this.postsService.findPublicByUser(
      +userId, 
      +page, 
      +limit,
      title,
      category_id ? +category_id : undefined
    );
  }

  @Get('public/by-username/:username')
  async findPublicByUsername(
    @Param('username') username: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('title') title?: string,
    @Query('category') category?: string,
  ) {
    return this.postsService.findPublicByUsername(
      username,
      +page,
      +limit,
      title,
      category ? +category : undefined
    );
  }

  @Get('public/categories/:username')
  async findPublicCategoriesByUsername(
    @Param('username') username: string
  ) {
    return this.postsService.findPublicCategoriesByUsername(username);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req) {
    return this.postsService.findOne(+id, req.user.id);
  }

  @Get('public/:id')
  findPublicOne(@Param('id') id: string) {
    return this.postsService.findPublicOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updatePostDto: Partial<CreatePostDto>,
    @Request() req
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('用户认证失败');
    }
    
    return this.postsService.update(+id, updatePostDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('用户认证失败');
    }
    
    return this.postsService.remove(+id, req.user.id);
  }
} 