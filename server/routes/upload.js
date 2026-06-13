import express from 'express';

const router = express.Router();

/**
 * POST /api/upload
 * 接收任意二进制流，流式消费（不缓存到内存），返回接收字节数和耗时
 * 上限保护：512 MiB
 */
router.post('/upload', (req, res) => {
  const MAX_BYTES = 512 * 1024 * 1024; // 512 MiB
  let bytesReceived = 0;
  const startTime = Date.now();

  // 禁用body-parser，直接流式消费
  req.on('data', (chunk) => {
    bytesReceived += chunk.length;

    // 超限保护
    if (bytesReceived > MAX_BYTES) {
      req.pause();
      res.status(413).json({ error: '上传数据超过512MB限制' });
      req.destroy();
    }
  });

  req.on('end', () => {
    const duration = Date.now() - startTime;
    res.json({
      received: bytesReceived,
      duration_ms: duration
    });
  });

  req.on('error', (err) => {
    console.error('Upload error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: '上传过程出错' });
    }
  });

  // 处理客户端中断
  req.on('close', () => {
    if (!res.headersSent) {
      const duration = Date.now() - startTime;
      res.json({
        received: bytesReceived,
        duration_ms: duration,
        interrupted: true
      });
    }
  });
});

export default router;
