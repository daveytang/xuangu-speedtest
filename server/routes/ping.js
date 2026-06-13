import express from 'express';

const router = express.Router();

/**
 * GET /api/ping
 * 极简响应，返回服务器时间戳，用于RTT测量
 * 关闭所有缓存
 */
router.get('/ping', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.json({ t: Date.now() });
});

export default router;
