# 博客系统Nginx集成与内网穿透说明

## 概述

这份文档说明如何通过Nginx将博客系统的各个服务集中到一个端口上，便于进行内网穿透，公开博客内容给外部访问。

## 集成方案

本方案主要使用Nginx作为反向代理，将以下服务集中到单一80端口上：

1. **博客展示前台** - 作为网站根路径 `/`
2. **API服务** - 通过路径 `/api` 访问
3. **MinIO文件服务** - 通过路径 `/files` 访问

同时，博客管理后台不对外公开，仅在内网通过特定端口访问。

## 目录与文件说明

- `nginx.conf.blog` - Nginx服务器配置文件
- `deploy_nginx.sh` - Linux服务器上部署Nginx配置的脚本
- `deploy_nginx_from_windows.bat` - Windows环境下部署Nginx配置的批处理脚本
- `.env.production.domain` - 面向域名访问的环境配置文件
- `build_and_deploy_domain.bat` - 构建并部署到域名环境的一体化脚本

## 部署步骤

### 方式一：通过完整部署脚本（推荐）

使用集成的部署脚本一次性完成构建和部署：

1. 编辑 `nginx.conf.blog` 文件，将 `server_name` 替换为您的实际域名
2. 执行构建与部署脚本：
   ```
   .\build_and_deploy_domain.bat
   ```

### 方式二：分步部署

如果您已经部署了博客系统，只想添加Nginx配置：

1. 编辑 `nginx.conf.blog` 文件，将 `server_name` 替换为您的实际域名
2. 执行Nginx配置部署脚本：
   ```
   .\deploy_nginx_from_windows.bat
   ```

## 内网穿透配置

完成上述部署后，您可以通过内网穿透工具（如frp、ngrok等）将服务器的80端口映射到公网，只需要穿透一个端口即可提供完整的博客访问体验。

### 内网穿透示例 (使用frp)

1. 在frpc.ini中添加以下配置：
   ```ini
   [web]
   type = tcp
   local_ip = 127.0.0.1
   local_port = 80
   remote_port = 80
   ```

2. 启动frpc客户端：
   ```
   ./frpc -c frpc.ini
   ```

## 访问地址

完成部署后，可通过以下地址访问各服务：

- **博客前台**: `http://您的域名/`
- **API服务**: `http://您的域名/api`
- **文件服务**: `http://您的域名/files`
- **博客管理后台** (仅内网): `http://192.168.1.100:5714`

## 常见问题

### 1. 图片无法显示

检查 `.env.production.domain` 中的 `VITE_MINIO_URL` 是否正确设置为 `/files`，确保前端代码使用正确的路径访问图片。

### 2. API请求失败

确认 Nginx 配置中的 `/api` 路径代理是否正确，检查后端服务是否正常运行。

### 3. 如何更新配置

如需修改 Nginx 配置，编辑 `nginx.conf.blog` 文件后重新运行部署脚本即可。 
 