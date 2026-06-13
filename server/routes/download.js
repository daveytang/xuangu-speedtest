import express from 'express';
import { Readable } from 'stream';

const router = express.Router();

// 预生成1MB的随机数据块，循环使用以避免CPU瓶颈
const CHUNK_SIZE = 1024 * 1024; // 1 MiB
const randomChunk = Buffer.allocUnsafe(CHUNK_SIZE);
for (let i = 0; i < CHUNK_SIZE; i++) {
  randomChunk[i] = Math.floor(Math.random() * 256);
}

/**
 * GET /api/download?bytes=<n>
 * 流式返回n字节的随机数据
 * 关闭压缩（通过Content-Encoding: identity确保）
 * 支持Range请求和中断
 * 单次最大1GB
 */
router.get('/download', (req, res) => {
  const bytesParam = parseInt(req.query.bytes, 10);

  // 参数校验
  if (!bytesParam || bytesParam <= 0) {
    return res.status(400).json({ error: '参数错误：bytes必须为正整数' });
  }

  // 上限保护：1 GiB
  const MAX_BYTES = 1024 * 1024 * 1024;
  const bytes = Math.min(bytesParam, MAX_BYTES);

  // 禁用压缩（关键！）
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', bytes);
  res.setHeader('Content-Encoding', 'identity');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Accept-Ranges', 'bytes');

  let bytesSent = 0;

  // 创建可读流，循环发送随机块
  const stream = new Readable({
    read() {
      if (bytesSent >= bytes) {
        this.push(null); // 结束流
        return;
      }

      const remaining = bytes - bytesSent;
      const toSend = Math.min(remaining, CHUNK_SIZE);

      // 发送预生成的随机块的一部分
      this.push(randomChunk.subarray(0, toSend));
      bytesSent += toSend;
    }
  });

  // 处理客户端中断
  req.on('close', () => {
    stream.destroy();
  });

  stream.pipe(res);
});

export default router;
