import express from 'express';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import pingRouter from './routes/ping.js';
import downloadRouter from './routes/download.js';
import uploadRouter from './routes/upload.js';
import metaRouter from './routes/meta.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { handleLogin, handleLogout, isAuthenticated, requireAuth } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '尝试次数过多，请稍后再试' }
});

function getSafeNextUrl(next) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader(
    'Content-Security-Policy',
    'default-src \'self\'; font-src \'self\'; style-src \'self\' \'unsafe-inline\'; script-src \'self\'; connect-src \'self\'; img-src \'self\' data:;'
  );
  next();
});

app.use(express.json({ limit: '1kb', type: 'application/json' }));

app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

app.get('/login', (req, res) => {
  if (isAuthenticated(req)) {
    return res.redirect(getSafeNextUrl(req.query.next));
  }

  return res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.post('/api/auth/login', authRateLimit, handleLogin);
app.post('/api/auth/logout', handleLogout);
app.use(requireAuth);

// Compression for static files only, NOT for /api routes
app.use(compression({
  filter: (req, res) => {
    // Never compress API routes (breaks speed test)
    if (req.path.startsWith('/api/')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Static files with caching
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
  etag: true,
  lastModified: true
}));

// API routes with rate limiting
app.use('/api', rateLimitMiddleware);
app.use('/api', pingRouter);
app.use('/api', downloadRouter);
app.use('/api', uploadRouter);
app.use('/api', metaRouter);

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`🌊 玄古测速 running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('⚡ SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('✨ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚡ SIGINT received, closing server gracefully...');
  server.close(() => {
    console.log('✨ Server closed');
    process.exit(0);
  });
});
