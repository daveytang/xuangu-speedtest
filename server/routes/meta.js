import express from 'express';

const router = express.Router();

/**
 * GET /api/meta
 * 返回客户端IP、ISP/ASN/地理位置、服务器节点信息
 * 使用ip-api.com免费接口解析地理位置（无需本地数据库，部署更简单）
 */
router.get('/meta', async (req, res) => {
  // 获取真实客户端IP（考虑反向代理）
  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'unknown';

  // 服务器节点名（从环境变量读取，默认为"默认节点"）
  const nodeName = process.env.NODE_NAME || '默认节点';

  // 解析地理位置和ISP（使用ip-api.com）
  // 注意：ip-api.com限制45次/分钟，生产环境应考虑本地GeoIP库或付费API
  let geoInfo = {
    isp: '未知',
    country: '未知',
    city: '未知',
    asn: '未知'
  };

  // 跳过本地IP的地理查询
  if (clientIp !== 'unknown' && !clientIp.startsWith('127.') && !clientIp.startsWith('::1')) {
    try {
      const geoRes = await fetch(
        `http://ip-api.com/json/${clientIp}?fields=status,country,city,isp,as,query`,
        { signal: AbortSignal.timeout(3000) }
      );

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.status === 'success') {
          geoInfo = {
            isp: geoData.isp || '未知',
            country: geoData.country || '未知',
            city: geoData.city || '未知',
            asn: geoData.as || '未知'
          };
        }
      }
    } catch (err) {
      console.warn('GeoIP lookup failed:', err.message);
      // 静默失败，返回默认值
    }
  }

  res.json({
    ip: clientIp,
    isp: geoInfo.isp,
    location: `${geoInfo.country} ${geoInfo.city}`,
    asn: geoInfo.asn,
    node: nodeName
  });
});

export default router;
