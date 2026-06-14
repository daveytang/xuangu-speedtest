# 部署检查清单

部署前请确认以下配置：

## 1. 环境变量

在 `docker-compose.yml` 或服务器环境中设置：

```bash
NODE_ENV=production
PORT=3000
NODE_NAME=北京节点  # 自定义节点名称
ACCESS_PASSWORD=6666  # 访问密码，部署后建议改成内部密码
```

## 2. Nginx配置关键点

✅ 测速路径必须：
- `gzip off` - 关闭压缩
- `proxy_buffering off` - 禁用缓冲
- `proxy_request_buffering off` - 禁用请求缓冲
- `client_max_body_size 600M` - 允许大文件上传

✅ 超时设置：
- `proxy_send_timeout 120s`
- `proxy_read_timeout 120s`

## 3. 防火墙

确保端口开放：
```bash
# 如果使用ufw
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 如果使用firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 4. SSL证书（推荐）

使用Let's Encrypt免费证书：

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书并自动配置Nginx
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 5. 性能优化

### 对于高流量场景：

1. **增加速率限制**：编辑 `server/middleware/rateLimit.js`
2. **使用本地GeoIP库**：替换 `server/routes/meta.js` 中的ip-api.com调用
3. **启用HTTP/2**：Nginx配置中添加 `http2`
4. **CDN加速静态资源**：将 `public/` 目录托管到CDN

### VPS资源监控：

```bash
# 查看容器资源使用
docker stats xuangu-speedtest

# 查看日志
docker logs -f xuangu-speedtest
```

## 6. 安全加固

✅ 已实现：
- 速率限制（60秒内最多30次请求）
- 资源上限保护（下载1GB，上传512MB）
- CSP安全策略
- CORS同源限制

建议额外添加：
- Fail2ban防暴力请求
- Cloudflare DDoS防护
- 定期更新依赖包

## 7. 监控与日志

```bash
# 查看Nginx访问日志
tail -f /var/log/nginx/xuangu-speedtest-access.log

# 查看Nginx错误日志
tail -f /var/log/nginx/xuangu-speedtest-error.log

# 查看应用日志
docker logs -f xuangu-speedtest
```

## 8. 备份

建议定期备份：
- Nginx配置文件
- Docker Compose配置
- 自定义环境变量

## 9. 测试清单

部署后测试：

```bash
# 测试ping接口
curl https://your-domain.com/api/ping

# 测试meta接口
curl https://your-domain.com/api/meta

# 测试下载接口（小包）
curl https://your-domain.com/api/download?bytes=1048576 -o /dev/null

# 浏览器完整测速
# 访问 https://your-domain.com 并进行完整测速
```

## 10. 常见问题

**Q: 测速速度远低于实际带宽？**
- 检查Nginx是否开启了gzip（必须关闭）
- 检查VPS出口带宽是否受限
- 尝试增加并行连接数（编辑 `public/js/measure.js`）

**Q: 上传测速失败？**
- 检查 `client_max_body_size` 是否足够大
- 检查 `proxy_request_buffering` 是否已关闭

**Q: 速率限制触发过于频繁？**
- 调整 `server/middleware/rateLimit.js` 中的 `max` 值

---

部署完成后，请访问你的域名进行测试！🎉
