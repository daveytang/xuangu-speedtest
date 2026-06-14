import crypto from 'crypto';

const COOKIE_NAME = 'speedtest_auth';
const COOKIE_MAX_AGE_SECONDS = 5 * 60;
const PUBLIC_ASSET_PATHS = new Set(['/favicon.ico', '/logo.png', '/js/login.js']);

function getPassword() {
  return process.env.ACCESS_PASSWORD || '6666';
}

function getTokenSecret() {
  return process.env.ACCESS_TOKEN_SECRET || getPassword();
}

function createAuthToken() {
  return crypto
    .createHmac('sha256', getTokenSecret())
    .update(getPassword())
    .digest('hex');
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, pair) => {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex === -1) return cookies;

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (key) {
      cookies[key] = decodeURIComponent(value);
    }

    return cookies;
  }, {});
}

function isSecureRequest(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  return req.secure || forwardedProto === 'https' || process.env.AUTH_COOKIE_SECURE === 'true';
}

function buildCookie(req, value, maxAgeSeconds) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`
  ];

  if (isSecureRequest(req)) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function isAuthenticated(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];

  return token ? safeEqual(token, createAuthToken()) : false;
}

export function handleLogin(req, res) {
  const password = req.body?.password ?? '';

  if (!safeEqual(password, getPassword())) {
    return res.status(401).json({ ok: false, error: '密码错误' });
  }

  res.setHeader('Set-Cookie', buildCookie(req, createAuthToken(), COOKIE_MAX_AGE_SECONDS));
  return res.json({ ok: true });
}

export function handleLogout(req, res) {
  res.setHeader('Set-Cookie', buildCookie(req, '', 0));
  res.json({ ok: true });
}

export function requireAuth(req, res, next) {
  if (PUBLIC_ASSET_PATHS.has(req.path) || req.path.startsWith('/fonts/')) {
    return next();
  }

  if (isAuthenticated(req)) {
    return next();
  }

  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: '需要密码访问' });
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl || '/')}`);
  }

  return res.status(401).send('需要密码访问');
}
