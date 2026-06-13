# 玄古测速

一个基于 `Node.js + Express + 原生前端` 的网络测速站点，支持下载、上传、延迟、抖动、丢包率检测，并提供单屏响应式仪表盘界面，适合自建测速页、线路质量检测页或节点展示页。

## 项目特点

- 真实测速链路：下载、上传、Ping 都基于真实网络请求，不是模拟数值
- 指标完整：支持下载、上传、延迟、抖动、丢包率和连接信息展示
- 响应式单屏：桌面端、平板端、移动端都尽量在单屏内完成核心信息展示
- 中止测速：测速过程中支持 `Esc` 中止，并打通前后端取消链路
- 轻量实现：前端使用原生 `HTML + CSS + JS`，没有额外框架运行时
- 易于部署：支持本地运行、Docker 部署和 Nginx 反向代理

## 当前界面

- 深色控制台风格主界面
- 左侧圆环读数 + 下方操作按钮
- 右侧 5 项核心指标卡片
- 底部连接信息带
- 移动端保留核心状态标签与操作入口

## 技术栈

- 前端：原生 `HTML`、`CSS`、`ES Modules`
- 后端：`Node.js`、`Express`
- 安全与性能：`compression`、`express-rate-limit`
- 地理信息：`ip-api.com`

## 功能概览

### 前端

- 仪表盘圆环实时展示当前测速阶段和读数
- 下载、上传、延迟、抖动、丢包率实时更新
- 连接信息展示当前 IP、运营商、测试节点
- 测速中按钮状态切换，支持重新测速
- 键盘 `Esc` 中止当前测速

### 后端 API

- `GET /api/ping`
  - 返回极简时间戳响应，用于 RTT 测量
- `GET /api/download?bytes=<n>`
  - 流式返回随机数据，用于下载测速
  - 单次最大 `1 GiB`
- `POST /api/upload`
  - 流式消费上传数据，用于上传测速
  - 单次最大 `512 MiB`
- `GET /api/meta`
  - 返回客户端 IP、运营商、地理信息和节点名称

## 项目结构

```text
.
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── gauge.js
│   │   ├── main.js
│   │   ├── measure.js
│   │   ├── net.js
│   │   ├── particles.js
│   │   └── ui.js
│   ├── index.html
│   └── logo.png
├── server/
│   ├── middleware/
│   │   └── rateLimit.js
│   ├── routes/
│   │   ├── download.js
│   │   ├── meta.js
│   │   ├── ping.js
│   │   └── upload.js
│   └── index.js
├── Dockerfile
├── docker-compose.yml
├── nginx.conf.example
├── DEPLOYMENT.md
└── README.md
```

## 快速开始

### 环境要求

- Node.js `>= 18`
- npm `>= 9`

### 本地开发

```bash
npm install
npm run dev
```

默认访问：

```text
http://localhost:3000
```

如果你想自定义端口，可以这样启动：

```bash
# PowerShell
$env:PORT=4173
npm run dev
```

### 生产启动

```bash
npm install
npm start
```

## Docker 部署

```bash
docker-compose up -d
docker-compose logs -f
```

停止服务：

```bash
docker-compose down
```

## 环境变量

支持的常用环境变量如下：

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 服务监听端口 |
| `NODE_ENV` | `development` | 运行环境 |
| `NODE_NAME` | `默认节点` | 页面中显示的测试节点名称 |

## 测速实现说明

### 延迟、抖动、丢包率

- 通过多次请求 `GET /api/ping` 统计 RTT
- 使用样本聚合得到 `Ping` 与 `Jitter`
- 采样过程中同步计算 `Packet Loss`

### 下载测速

- 通过 `GET /api/download` 获取流式随机数据
- 服务端禁用 API 压缩，避免干扰测速结果
- 前端对采样结果做稳定化处理，减少过度乐观读数

### 上传测速

- 前端采用更稳定的 `XHR` 分块上传方案
- 服务端按流式方式消费请求体，不写磁盘
- 前后端支持中止测速，避免按钮状态和网络请求脱节

## 安全与限制

- API 路径启用速率限制
- `/api/meta` 单独放宽，不参与同样的测速限流策略
- 静态资源开启缓存，API 明确关闭缓存
- 服务端设置基础安全响应头与 CSP
- 下载上限 `1 GiB`，上传上限 `512 MiB`

## 定制说明

### 站点名称和文案

- 修改 `public/index.html`

### 页面样式

- 修改 `public/css/style.css`

### Logo

- 替换 `public/logo.png`
- 如需保底回退资源，也可以同时准备 `public/logo.svg`

### 节点名称

- 通过环境变量 `NODE_NAME` 配置

## 开发命令

```bash
npm run dev
npm start
npm run lint
npm run format
```

## 相关文档

- `DEPLOYMENT.md`：部署说明
- `DESIGN_OVERVIEW.md`：设计说明
- `LOGO_GUIDE.md`：Logo 使用说明
- `CUSTOMIZATION_CHECKLIST.md`：定制检查项

## 适用场景

- 自建测速站
- 海外节点质量检测页
- 代理线路展示页
- 企业网络诊断页

## License

MIT
