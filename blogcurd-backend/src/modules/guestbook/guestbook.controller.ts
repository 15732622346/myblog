import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, NotFoundException, Ip, HttpException, HttpStatus, Logger, Query } from '@nestjs/common';
import { GuestbookService } from './guestbook.service';
import { CreateGuestbookMessageDto } from './dto/create-guestbook-message.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetGuestbookQueryDto } from './dto/get-guestbook-query.dto';

@Controller('guestbook')
export class GuestbookController {
  private readonly logger = new Logger(GuestbookController.name);

  constructor(private readonly guestbookService: GuestbookService) {}

  @Post(':username')
  async createMessage(
    @Param('username') username: string,
    @Body() createGuestbookMessageDto: CreateGuestbookMessageDto,
    @Ip() ip: string,
  ) {
    // 直接打印到控制台
    console.log('\n\n=========== 留言请求详情（控制台输出）===========');
    console.log(`时间: ${new Date().toISOString()}`);
    console.log(`用户名: ${username}`);
    console.log(`IP地址: ${ip}`);
    console.log(`请求体原始内容: `, createGuestbookMessageDto);
    console.log(`content字段: ${createGuestbookMessageDto.content}`);
    console.log(`visitor_name字段: ${createGuestbookMessageDto.visitor_name}`);
    console.log(`visitor_name是否存在: ${createGuestbookMessageDto.hasOwnProperty('visitor_name')}`);
    console.log(`visitor_name类型: ${typeof createGuestbookMessageDto.visitor_name}`);
    console.log('====================================================\n\n');
    
    // 继续使用logger记录（会记录到日志文件）
    this.logger.debug(`===== 留言请求详情 =====`);
    this.logger.debug(`创建留言: username=${username}, content=${createGuestbookMessageDto.content}, ip=${ip}`);
    try {
      // 检查该IP今天对此用户的留言数量
      const todayMessageCount = await this.guestbookService.countTodayMessagesByIpAndUsername(
        ip, 
        username
      );
      
      // 如果已经达到5条留言限制，则拒绝请求
      if (todayMessageCount >= 5) {
        this.logger.warn(`IP ${ip} 对用户 ${username} 的留言已达到今日上限`);
        throw new HttpException('您今天的留言已达上限（5条）', HttpStatus.TOO_MANY_REQUESTS);
      }

      // 查找用户
      const user = await this.guestbookService.findUserByUsername(username);
      if (!user) {
        this.logger.warn(`用户 ${username} 不存在，无法添加留言`);
        throw new NotFoundException('用户不存在，无法添加留言');
      }

      // 设置访客IP地址，仅当未提供时
      const messageDto = { 
        ...createGuestbookMessageDto,
      };
      
      // 只有当未提供visitor_name或值为空时，才使用IP地址
      if (!createGuestbookMessageDto.visitor_name) {
        messageDto.visitor_name = ip;
      }
      
      // 创建留言
      const result = await this.guestbookService.createMessage(messageDto, user.id);
      this.logger.debug(`留言创建成功: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`留言创建失败: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new NotFoundException('用户不存在，无法添加留言');
    }
  }

  @Get(':username')
  async findMessagesByUsername(
    @Param('username') username: string,
    @Query() query: GetGuestbookQueryDto,
  ) {
    this.logger.debug(`获取用户留言: username=${username}, page=${query.page}, limit=${query.limit}`);
    try {
      const result = await this.guestbookService.findMessagesByUsername(username, query.page, query.limit);
      this.logger.debug(`获取用户留言成功`);
      return result;
    } catch (error) {
      this.logger.error(`获取用户留言失败: ${error.message}`);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteMessage(@Param('id') id: string, @Request() req) {
    this.logger.debug(`删除留言: id=${id}, userId=${req.user.id}`);
    try {
      const result = await this.guestbookService.deleteMessage(+id, req.user.id);
      this.logger.debug(`删除留言成功: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`删除留言失败: ${error.message}`);
      throw error;
    }
  }

  @Get('my/messages')
  @UseGuards(JwtAuthGuard)
  async findMyMessages(@Request() req) {
    this.logger.debug(`获取我的留言: userId=${req.user.id}`);
    try {
      const result = await this.guestbookService.findMessagesByUserId(req.user.id);
      this.logger.debug(`获取我的留言成功，共 ${result.length} 条`);
      return result;
    } catch (error) {
      this.logger.error(`获取我的留言失败: ${error.message}`);
      throw error;
    }
  }
}