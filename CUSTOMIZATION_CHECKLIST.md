# 快速定制检查清单

部署前请完成以下定制步骤：

## ✅ 必须完成

### 1. 替换LOGO
- [ ] 将公司LOGO文件放到 `public/logo.svg` 或 `public/logo.png`
- [ ] 推荐格式：SVG矢量图（可缩放）或PNG透明背景
- [ ] 推荐尺寸：高度 96-120px，宽度自适应

**快速测试：**
```bash
# 检查LOGO文件是否存在
ls -lh public/logo.*
```

### 2. 修改站点信息
**编辑 `public/index.html`：**

- [ ] **第7行** - 页面标题
```html
<title>您的公司名 - 网络测速服务</title>
```

- [ ] **第8行** - SEO描述
```html
<meta name="description" content="您的公司简介和服务描述">
```

- [ ] **第32行** - 导航栏标题
```html
<span class="site-title">您的品牌名</span>
```

- [ ] **第74行** - Hero区文案
```html
<p class="hero-tagline">您的品牌口号或服务说明</p>
```

- [ ] **第176行** - Footer版权信息
```html
<p class="footer-text">© 2026 您的公司名 · 服务说明</p>
```

### 3. 设置节点名称
**编辑 `docker-compose.yml` 或设置环境变量：**

```yaml
environment:
  - NODE_NAME=北京节点  # 改为你的实际节点名称
```

## 🎨 可选定制

### 4. 品牌配色
如果需要使用公司品牌色，编辑 `public/css/style.css` 第2-12行：

```css
:root {
  --primary: #2563EB;      /* 主色调 - 改为你的品牌主色 */
  --primary-dark: #1E40AF; /* 深色版本 */
  --primary-light: #60A5FA;/* 浅色版本 */
  --accent: #06B6D4;       /* 强调色 */
}
```

**常用品牌色参考：**
- 科技蓝（默认）: `#2563EB`
- 商务蓝: `#1E40AF`
- 青绿色: `#059669`
- 紫色: `#7C3AED`

### 5. 字体优化（可选）
如果需要更快的中国大陆访问速度，可以将Google Fonts替换为国内CDN：

**编辑 `public/index.html` 第11-13行：**
```html
<!-- 原Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&family=Noto+Sans+SC:wght@400;500&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">

<!-- 可替换为字节跳动CDN -->
<link href="https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
```

或者自托管字体文件。

### 6. 添加备案号（中国大陆必需）
**编辑 `public/index.html` Footer部分：**

```html
<p class="footer-text">
  © 2026 您的公司名 · 服务说明<br>
  <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">
    京ICP备XXXXXXXX号
  </a>
</p>
```

### 7. 添加统计代码（可选）
在 `public/index.html` 的 `</body>` 前添加：

- **百度统计**
- **Google Analytics**
- **友盟统计**
- 等第三方统计代码

## 🚀 部署前验证

### 本地测试
```bash
# 启动服务
npm run dev

# 打开浏览器访问 http://localhost:3000
# 检查以下内容：

✅ LOGO是否正确显示
✅ 页面标题是否已修改
✅ 文案是否符合品牌调性
✅ 配色是否协调
✅ 测速功能是否正常

# 测试暗色模式
# 点击右上角主题切换按钮，检查暗色模式下的视觉效果

# 测试响应式
# 浏览器F12开发者工具 > Toggle device toolbar
# 切换到移动设备视图，检查布局是否正常
```

### Docker测试
```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 检查日志
docker-compose logs -f

# 访问 http://localhost:3000
```

## 📝 部署后检查

- [ ] SSL证书配置正确（HTTPS）
- [ ] Nginx反向代理正常工作
- [ ] 测速功能可用（下载/上传/Ping）
- [ ] 连接信息正确显示（IP/ISP/节点）
- [ ] 移动端访问正常
- [ ] 暗色模式正常切换

## 🆘 常见问题

**Q: LOGO不显示？**
- 检查文件路径是否正确（`public/logo.svg` 或 `public/logo.png`）
- 检查文件权限
- 查看浏览器控制台是否有404错误

**Q: 配色修改后没生效？**
- 清除浏览器缓存（Ctrl+Shift+R 强制刷新）
- 检查CSS语法是否正确

**Q: 测速结果不准确？**
- 确认Nginx已关闭测速路径的gzip（参考 `nginx.conf.example`）
- 检查服务器带宽是否足够
- 查看后端日志是否有错误

---

完成以上步骤后，你的测速网站就可以对外发布了！🎉

需要帮助？查看完整文档：
- [README.md](README.md) - 完整使用指南
- [LOGO_GUIDE.md](LOGO_GUIDE.md) - LOGO定制详解
- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署检查清单
- [DESIGN_OVERVIEW.md](DESIGN_OVERVIEW.md) - 设计说明
