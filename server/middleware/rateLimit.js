import rateLimit from 'express-rate-limit';

const RATE_LIMIT_MAX = process.env.NODE_ENV === 'production' ? 400 : 1200;

// #region debug-point A:rate-limit-reporter
const reportDebug = (hypothesisId, location, msg, data = {}) =>
  fetch('http://127.0.0.1:7777/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'speedtest-site-audit',
      runId: 'pre-fix',
      hypothesisId,
      location,
      msg,
      data,
      ts: Date.now()
    })
  }).catch(() => {});
// #endregion

// 速率限制：同IP 60秒内最多10次完整测速
// 按IP计数，存储在内存中
export const rateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000, // 60 seconds
  max: RATE_LIMIT_MAX, // 本地高带宽联调会产生大量短请求，生产环境仍保留更严格上限
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  // 只对测速接口限流，meta接口可以更宽松
  skip: (req) => {
    // #region debug-point A:rate-limit-skip
    reportDebug('A', 'server/middleware/rateLimit.js:skip', '[DEBUG] rate-limit skip evaluated', {
      originalUrl: req.originalUrl,
      path: req.path
    });
    // #endregion
    return req.path === '/meta';
  },
  handler: (req, res, next, options) => {
    // #region debug-point A:rate-limit-hit
    reportDebug('A', 'server/middleware/rateLimit.js:handler', '[DEBUG] rate-limit blocked request', {
      originalUrl: req.originalUrl,
      path: req.path,
      limit: options.max,
      windowMs: options.windowMs
    });
    // #endregion
    res.status(options.statusCode).json(options.message);
  }
});
