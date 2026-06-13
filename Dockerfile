# 多阶段构建
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖清单
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 生产镜像
FROM node:18-alpine

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_NAME="默认节点"

WORKDIR /app

# 从builder复制依赖和代码
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 3000

CMD ["node", "server/index.js"]
