# LOGO使用说明

## 如何添加你的公司LOGO

### 方法1：直接替换文件（推荐）

1. 准备你的LOGO文件，命名为 `logo.png`
2. 将文件放置到 `public/` 目录下
3. 刷新页面，LOGO会自动显示

**推荐规格：**
- 格式：PNG（支持透明背景）
- 尺寸：高度建议 96-120px，宽度按比例自适应
- 文件大小：< 200KB

### 方法2：修改HTML路径

如果你的LOGO文件名不是 `logo.png`，可以编辑 `public/index.html`：

```html
<!-- 第31行左右，修改 src 路径 -->
<img src="/your-logo-name.png" alt="公司LOGO" class="company-logo">
```

### 方法3：使用外部链接

```html
<!-- 使用CDN或外部URL -->
<img src="https://your-domain.com/assets/logo.png" alt="公司LOGO" class="company-logo">
```

## LOGO占位符说明

当LOGO文件不存在时，页面会显示一个蓝色渐变的占位符，上面写着"您的LOGO"和"请替换 /public/logo.png"。

这个占位符只在开发环境显示，提醒你添加真实LOGO。

## 样式调整

如果需要调整LOGO大小或样式，编辑 `public/css/style.css`：

```css
/* 第183行左右 */
.company-logo {
  height: 48px;        /* 调整高度 */
  width: auto;         /* 保持宽高比 */
  max-width: 200px;    /* 最大宽度限制 */
  object-fit: contain;
}
```

## 暗色模式适配

如果你的LOGO在暗色背景下不够清晰，可以添加样式：

```css
[data-theme="dark"] .company-logo {
  filter: brightness(1.2);  /* 暗色模式下增加亮度 */
}
```

或者准备两个版本的LOGO，通过JS切换：

```javascript
// 在 public/js/ui.js 的 applyTheme() 方法中添加
const logo = document.querySelector('.company-logo');
if (this.theme === 'dark') {
  logo.src = '/logo-dark.png';
} else {
  logo.src = '/logo.png';
}
```

## SVG格式LOGO

如果你的LOGO是SVG格式（推荐），可以直接内联到HTML中以获得更好的控制：

```html
<!-- 替换 <img> 标签为 SVG -->
<div class="logo-placeholder">
  <svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
    <!-- 你的SVG路径 -->
  </svg>
</div>
```

SVG的好处：
- 无损缩放
- 体积更小
- 可以直接用CSS控制颜色
- 支持动画效果

## 常见问题

**Q: LOGO显示模糊？**
- 使用2倍或3倍分辨率的图片（如高度96px显示，实际使用192px的图片）
- 或者使用SVG矢量格式

**Q: LOGO颜色和背景冲突？**
- 使用带透明背景的PNG
- 或根据主题切换LOGO版本

**Q: 想要LOGO带链接？**
```html
<a href="/" class="logo-placeholder">
  <img src="/logo.png" alt="公司LOGO" class="company-logo">
</a>
```

---

部署后别忘了替换LOGO！✨
