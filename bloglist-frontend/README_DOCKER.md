# 使用Docker容器运行Nginx代理

## 概述

这份文档说明如何在开发环境中使用Docker容器运行Nginx作为反向代理，以便于集成内网穿透和域名访问模式。

## 优势

1. **环境隔离** - Docker容器提供了隔离的环境，不会污染您的主机系统
2. **可移植性** - 配置好的Docker容器可以在任何支持Docker的系统上运行
3. **版本控制** - 可以精确控制Nginx的版本
4. **易于启动和停止** - 使用Docker命令可以轻松管理Nginx服务

## 前提条件

1. 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. 确保Docker服务已启动

## 文件说明

- `docker-compose.dev.yml` - Docker Compose配置文件
- `nginx.conf.dev` - Nginx配置文件（Docker版本）
- `start_dev_with_docker.bat` - 启动脚本
- `.env.production.domain` - 域名访问模式的环境配置

## 使用方法

### 自动启动（推荐）

最简单的方法是运行提供的启动脚本：

```
.\start_dev_with_docker.bat
```

这个脚本会：
1. 检查Docker是否安装
2. 应用域名模式的环境配置
3. 启动Docker容器中的Nginx
4. 启动后端API服务
5. 启动博客管理后台
6. 启动博客展示前台

### 手动启动

如果你想手动控制每个步骤，可以按以下步骤操作：

1. 复制域名配置：
   ```
   copy /Y bloglist\frontend\.env.production.domain bloglist\frontend\.env.development
   ```

2. 启动Docker中的Nginx：
   ```
   cd bloglist/frontend
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. 启动后端API服务：
   ```
   cd blogcurd/backend
   npm run start:dev
   ```

4. 启动博客管理后台：
   ```
   cd blogcurd/frontend
   npm run dev
   ```

5. 启动博客展示前台：
   ```
   cd bloglist/frontend
   npm run dev
   ```

## 访问地址

- 博客前台: http://localhost/
- 博客管理后台: http://localhost/admin/
- API服务: http://localhost/api
- 文件服务: http://localhost/files

## 关闭服务

要停止Docker中的Nginx服务，请运行：

```
docker-compose -f bloglist/frontend/docker-compose.dev.yml down
```

## 故障排查

### 1. 端口冲突

如果出现端口冲突（通常是80端口被占用），请检查：

- 本地IIS服务是否占用了80端口
- 其他Web服务器如Apache是否正在运行
- 其他应用程序是否占用了80端口

修改方法：编辑`docker-compose.dev.yml`文件，将端口映射从`"80:80"`改为`"其他端口:80"`，比如`"8080:80"`。

### 2. Docker连接问题

如果Nginx无法访问宿主机上的服务，请检查：

- Docker Desktop是否开启了"允许其他系统访问"选项
- 防火墙是否阻止了Docker容器访问宿主机

### 3. Linux系统特殊注意

在Linux系统上使用时，请确保：

- 已正确安装了docker-compose
- 使用sudo运行命令（如有必要）
- 检查SELinux设置是否影响容器的网络访问 