import express from 'express';

const router = express.Router();

function isValidIpv4(ip) {
  const parts = ip.split('.');
  return parts.length === 4 && parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const value = Number(part);
    return value >= 0 && value <= 255;
  });
}

function normalizeIpv4(value) {
  if (!value) return null;

  const raw = String(value).trim();
  const mappedIpv4 = raw.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  const plainIpv4 = raw.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/);
  const ip = mappedIpv4?.[1] || plainIpv4?.[1];

  return ip && isValidIpv4(ip) ? ip : null;
}

function getClientIpv4(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedCandidates = Array.isArray(forwardedFor)
    ? forwardedFor.flatMap((value) => value.split(','))
    : String(forwardedFor || '').split(',');

  const candidates = [
    ...forwardedCandidates,
    req.headers['x-real-ip'],
    req.socket.remoteAddress
  ];

  for (const candidate of candidates) {
    const ip = normalizeIpv4(candidate);
    if (ip) return ip;
  }

  return 'unknown';
}

/**
 * GET /api/meta
 * 返回客户端IP、ISP/ASN/地理位置、服务器节点信息
 * 使用ip-api.com免费接口解析地理位置（无需本地数据库，部署更简单）
 */
router.get('/meta', async (req, res) => {
  const clientIp = getClientIpv4(req);

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
