const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...vals] = trimmed.split('=');
    if (key && vals.length) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  });
}

const { handler } = require('./netlify/functions/api');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // 1. API Route -> Dispatch to Netlify Function
  if (pathname.startsWith('/api/') || pathname === '/api') {
    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', async () => {
      try {
        const event = {
          httpMethod: req.method,
          path: pathname,
          headers: req.headers,
          body: rawBody || null,
          queryStringParameters: Object.fromEntries(parsedUrl.searchParams.entries())
        };

        const result = await handler(event);

        const headers = result.headers || {};
        for (const [key, value] of Object.entries(headers)) {
          res.setHeader(key, value);
        }

        res.statusCode = result.statusCode || 200;
        res.end(result.body || '');
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Server error', details: err.message }));
      }
    });
    return;
  }

  // 2. Static File Serving
  let filePath = path.join(ROOT, pathname);

  if (pathname === '/admin') {
    filePath = path.join(ROOT, 'admin.html');
  } else if (pathname === '/' || !path.extname(pathname)) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath)) {
      filePath = path.join(ROOT, 'index.html');
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Portfolio dev server running at: http://localhost:${PORT}`);
  console.log(`👉 Main Portfolio: http://localhost:${PORT}/`);
  console.log(`👉 Admin Portal:  http://localhost:${PORT}/admin`);
  console.log(`👉 Backend Health: http://localhost:${PORT}/api/health`);
});
