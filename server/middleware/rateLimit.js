import rateLimit from 'express-rate-limit';

const RATE_LIMIT_MAX = process.env.NODE_ENV === 'production' ? 400 : 1200;

// 速率限制：同IP 60秒窗口内的请求上限
// 按IP计数，存储在内存中
export const rateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000, // 60 seconds
  max: RATE_LIMIT_MAX, // 本地高带宽联调会产生大量短请求，生产环境仍保留更严格上限
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  // 只对测速接口限流，meta接口可以更宽松
  skip: (req) => req.path === '/meta'
});
