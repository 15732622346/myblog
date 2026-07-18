import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Post } from '../posts/entities/post.entity';
import { Category } from '../categories/entities/category.entity';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfilesRepository: Repository<UserProfile>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}
  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }
  async findByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { username },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }
  async getPublicUserProfile(username: string) {
    // 查找用户基本信息
    const user = await this.usersRepository.findOne({
      where: { username },
      select: ['id', 'username'], // 只选择必要的字段
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 查找用户的个人资料
    const profile = await this.userProfilesRepository.findOne({
      where: { user_id: user.id },
    });

    // 处理头像URL，保证返回的路径在公网环境可用
    const avatarUrl = profile?.avatar
      ? this.normalizeAvatarUrl(profile.avatar)
      : '';
    // 返回公开信息
    return {
      id: user.id,
      username: user.username,
      nickname: profile?.nickname || username,
      bio: profile?.bio || '',
      avatar: avatarUrl,
    };
  }
  async getProfile(userId: number) {
    const user = await this.findOne(userId);
    let profile = await this.userProfilesRepository.findOne({
      where: { user_id: userId },
    });
    if (!profile) {
      // 如果用户没有 profile，创建一个默认的
      profile = this.userProfilesRepository.create({
        user_id: userId,
        theme_preference: 'light',
        default_post_status: 'draft',
        email_notification: false,
      });
      await this.userProfilesRepository.save(profile);
    }
    return {
      ...user,
      ...profile,
      password: undefined,
    };
  }
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const user = await this.findOne(userId);
    let profile = await this.userProfilesRepository.findOne({
      where: { user_id: userId },
    });
    if (!profile) {
      profile = this.userProfilesRepository.create({
        user_id: userId,
      });
    }
    // 更新 email
    if (updateProfileDto.email) {
      user.email = updateProfileDto.email;
      await this.usersRepository.save(user);
    }
    // 更新 profile
    Object.assign(profile, updateProfileDto);
    await this.userProfilesRepository.save(profile);
    return this.getProfile(userId);
  }
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.findOne(userId);
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('当前密码错误');
    }
    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.usersRepository.save(user);
  }
  async updateAvatar(userId: number, avatarUrl: string) {
    console.log('===== 开始更新用户头像 =====');
    console.log(`用户ID: ${userId}`);
    console.log(`头像URL: ${avatarUrl}`);

    // [新增] 检查URL是否为默认图片
    if (avatarUrl && avatarUrl.includes('default-image.jpg')) {
      console.warn(`[警告] 检测到头像URL包含default-image.jpg`);
      console.warn(`[警告] 这可能表示使用了默认图片而非上传的图片`);
      console.warn(`[警告] 完整的头像URL: ${avatarUrl}`);
    }

    const normalizedAvatarUrl = this.normalizeAvatarUrl(avatarUrl);
    // [新增] 检查URL结构
    if (avatarUrl) {
      console.log(`[DEBUG] 头像URL分析:`);
      console.log(`[DEBUG] - URL长度: ${avatarUrl.length}`);
      console.log(`[DEBUG] - URL类型: ${typeof avatarUrl}`);
      console.log(`[DEBUG] - 是否包含 'proxy': ${avatarUrl.includes('proxy')}`);
      console.log(
        `[DEBUG] - 是否包含用户ID: ${avatarUrl.includes(`/${userId}_`)}`,
      );
      console.log(
        `[DEBUG] - 预期结构: /api/files/proxy/blog-avatars/avatars/${userId}_TIMESTAMP.ext`,
      );

      const urlParts = avatarUrl.split('/');
      console.log(`[DEBUG] - URL分段: ${JSON.stringify(urlParts)}`);

      if (urlParts.length >= 4) {
        console.log(`[DEBUG] - 存储桶: ${urlParts[3] || 'N/A'}`);
        if (urlParts[3] !== 'blog-avatars') {
          console.warn(
            `[警告] 存储桶不是预期的 'blog-avatars'，而是 '${urlParts[3]}'`,
          );
        }
      }
    }

    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['profile'],
      });

      if (!user) {
        console.error(`未找到用户: ID=${userId}`);
        throw new NotFoundException('User not found');
      }

      console.log(`找到用户: ${user.username} (ID=${user.id})`);
      console.log(`当前用户资料: ${JSON.stringify(user.profile || 'null')}`);

      // [新增] 检查用户当前头像
      if (user.profile && user.profile.avatar) {
        console.log(`[DEBUG] 当前头像URL: ${user.profile.avatar}`);
        if (user.profile.avatar.includes('default-image.jpg')) {
          console.log(`[DEBUG] 当前用户使用的是默认头像`);
        }
      } else {
        console.log(`[DEBUG] 用户当前没有头像记录`);
      }

      const storedAvatarUrl = normalizedAvatarUrl || avatarUrl;
      if (!user.profile) {
        // 如果用户没有 profile，创建一个新的
        console.log('用户没有资料记录，创建新的资料记录');
        user.profile = this.userProfilesRepository.create({
          avatar: storedAvatarUrl,
        });
        console.log('新建资料记录:', user.profile);
      } else {
        console.log(
          `更新现有头像: ${user.profile.avatar || 'null'} -> ${storedAvatarUrl}`,
        );
        user.profile.avatar = storedAvatarUrl;
      }

      // 保存用户信息
      console.log('保存更新后的用户信息');
      const updatedUser = await this.usersRepository.save(user);
      console.log('用户信息保存成功');

      // 验证头像是否真的更新了
      if (
        updatedUser.profile &&
        updatedUser.profile.avatar === storedAvatarUrl
      ) {
        console.log('头像URL已成功更新');
      } else {
        console.warn(
          '头像URL可能未正确更新，保存的值:',
          updatedUser.profile ? updatedUser.profile.avatar : 'null',
        );
      }

      console.log('===== 用户头像更新完成 =====');
      return updatedUser;
    } catch (error) {
      console.error('===== 更新用户头像时出错 =====');
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
      throw error;
    }
  }
  async getUserStatistics(userId: number) {
    const user = await this.findOne(userId);

    // 获取用户的文章数和分类数
    const [postCount, categoryCount] = await Promise.all([
      this.postsRepository.count({ where: { user_id: userId } }),
      this.categoriesRepository.count({ where: { user_id: userId } }),
    ]);
    return {
      postCount,
      categoryCount,
      created_at: user.created_at,
      last_login: user.profile?.last_login || new Date(),
    };
  }
  private normalizeAvatarUrl(avatar?: string): string {
    if (!avatar) {
      return '';
    }
    let normalized = avatar.trim();
    if (!normalized) {
      return '';
    }
    if (normalized.startsWith('undefined/')) {
      normalized = normalized.replace('undefined/', '');
    }
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      try {
        const parsed = new URL(normalized);
        const pathWithQuery = `${parsed.pathname}${parsed.search || ''}`;
        const allowedHosts = new Set<string>();
        const serverUrl = process.env.SERVER_URL;
        if (serverUrl) {
          try {
            allowedHosts.add(new URL(serverUrl).host);
          } catch (error) {
            // ignore invalid SERVER_URL
          }
        }
        const minioEndpoint = process.env.MINIO_ENDPOINT;
        if (minioEndpoint) {
          try {
            allowedHosts.add(new URL(`http://${minioEndpoint}`).host);
          } catch (error) {
            allowedHosts.add(minioEndpoint);
          }
        }
        ['127.0.0.1', 'localhost', '192.168.253.128'].forEach((host) =>
          allowedHosts.add(host),
        );
        if (pathWithQuery.startsWith('/api/files/proxy/')) {
          return pathWithQuery;
        }
        if (
          allowedHosts.has(parsed.hostname) &&
          pathWithQuery.startsWith('/')
        ) {
          return pathWithQuery;
        }
        return normalized;
      } catch (error) {
        return normalized;
      }
    }
    if (normalized.startsWith('/api/files/proxy/')) {
      return normalized;
    }
    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }
    return normalized;
  }
}
