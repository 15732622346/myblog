import { Controller, Get, Post, Body, Put, Param, UseGuards, Request } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createResumeDto: CreateResumeDto, @Request() req) {
    return this.resumesService.create(createResumeDto, req.user.id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMy(@Request() req) {
    return this.resumesService.findByUserId(req.user.id);
  }

  @Get('public/:username')
  findPublicByUsername(@Param('username') username: string) {
    return this.resumesService.findPublicByUsername(username);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  update(@Body() updateResumeDto: Partial<CreateResumeDto>, @Request() req) {
    return this.resumesService.update(req.user.id, updateResumeDto);
  }
} 