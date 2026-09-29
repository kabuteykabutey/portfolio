const { createClient } = require('@libsql/client');
const crypto = require('crypto');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'brian-portfolio-fallback-secret-key-2026';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@brian.dev').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'brian123';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || null;

// ==============================================================================
// 1. TIGHTENED CORS HELPER
// ==============================================================================
function getAllowedOrigin(event) {
  const origin = event.headers.origin || event.headers.Origin || '';
  const allowedCustom = process.env.ALLOWED_ORIGIN; // e.g. https://yourcustomdomain.com

  // 1. Allow localhost / 127.0.0.1 for local development
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return origin;
  }

  // 2. Allow any Netlify preview or production subdomain
  if (/^https:\/\/[a-zA-Z0-9-_]+\.netlify\.app$/.test(origin)) {
    return origin;
  }

  // 3. Allow explicitly configured custom domain
  if (allowedCustom && origin === allowedCustom) {
    return origin;
  }

  // Fallback: If same-origin / server-side invocation without origin header
  return allowedCustom || origin || '*';
}

function jsonResponse(statusCode, data, origin = '*') {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Vary': 'Origin'
    },
    body: JSON.stringify(data)
  };
}

// ==============================================================================
// 2. RATE LIMITING (Sliding window by client IP)
// ==============================================================================
const rateLimitMap = new Map();

function getClientIp(event) {
  return (
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['client-ip'] ||
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

function checkRateLimit(ip, bucket, maxRequests, windowMs) {
  const key = `${ip}:${bucket}`;
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };

  // Reset bucket if expired
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  record.count += 1;
  rateLimitMap.set(key, record);

  // Periodically prune stale keys to prevent memory leak
  if (rateLimitMap.size > 2000) {
    for (const [k, val] of rateLimitMap.entries()) {
      if (now > val.resetAt) rateLimitMap.delete(k);
    }
  }

  return record.count <= maxRequests;
}

// ==============================================================================
// 3. SECURE PASSWORD HASHING & TIMING-SAFE VERIFICATION
// ==============================================================================
function verifyPassword(inputPassword, storedPassword, storedHash) {
  // Option A: If a salted scrypt hash is configured (format: salt:hash)
  if (storedHash && storedHash.includes(':')) {
    const [salt, keyHex] = storedHash.split(':');
    const keyBuf = Buffer.from(keyHex, 'hex');
    const derived = crypto.scryptSync(inputPassword, salt, 64);
    return crypto.timingSafeEqual(keyBuf, derived);
  }

  // Option B: Timing-safe comparison with plain stored password
  // (Prevents timing attacks that expose password length/characters)
  const inputHash = crypto.createHash('sha256').update(inputPassword).digest();
  const storedHashBuf = crypto.createHash('sha256').update(storedPassword).digest();
  return crypto.timingSafeEqual(inputHash, storedHashBuf);
}

// ==============================================================================
// 4. FORM INPUT VALIDATION HELPERS
// ==============================================================================
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 100) return false;
  return EMAIL_REGEX.test(email.trim());
}

// ==============================================================================
// 5. TOKEN HELPERS (HS256 JWT using native Node.js crypto)
// ==============================================================================
function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// ==============================================================================
// 6. DATABASE CONNECTION & SCHEMA INITIALIZATION
// ==============================================================================
let dbClient = null;
let initialized = false;

function getDb() {
  if (!dbClient) {
    const url = process.env.TURSO_DATABASE_URL || 'file:local_portfolio.db';
    const authToken = process.env.TURSO_AUTH_TOKEN;
    dbClient = createClient({ url, authToken });
  }
  return dbClient;
}

async function ensureSchema(db) {
  if (initialized) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS guestbook_signatures (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT,
      signature TEXT NOT NULL,
      is_approved INTEGER NOT NULL DEFAULT 1
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      category_class TEXT DEFAULT 'badge-cyan',
      date TEXT NOT NULL,
      read_time TEXT DEFAULT '3 min read',
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Seed default posts if empty
  const postCheck = await db.execute('SELECT COUNT(*) as count FROM blog_posts;');
  const postCount = Number(postCheck.rows[0]?.count || 0);

  if (postCount === 0) {
    await db.execute({
      sql: `
        INSERT OR IGNORE INTO blog_posts (id, created_at, title, category, category_class, date, read_time, excerpt, content, is_published)
        VALUES 
          (
            'post-1',
            '2026-09-14T10:00:00Z',
            'Bridging Python & LLM APIs into Everyday Web Apps',
            'AI Integration',
            'badge-purple',
            'Sep 14, 2026',
            '4 min read',
            'How integrating lightweight Python endpoints with modern AI agents creates responsive, self-adapting applications without bloated infrastructure.',
            '<p>Artificial Intelligence is no longer just research lab code—it has become a fundamental design material for modern web and mobile apps. In my recent freelance projects, pairing high-performance Python microservices with client-side reactive frontends creates deterministic, reliable AI responses.</p><p>By delegating prompt orchestration and structured JSON schema validations to Python (using libraries like FastAPI and Pydantic), client-side interfaces remain snappy and decoupled.</p><h4>Key Takeaways for Developers:</h4><ul><li><strong>Stream early:</strong> Always prefer streaming token responses to reduce perceived latency.</li><li><strong>Schema enforcement:</strong> Do not let raw text into your databases—use function calling / structured outputs.</li><li><strong>Fail gracefully:</strong> Always build deterministic fallbacks when AI services encounter rate-limits.</li></ul>',
            1
          ),
          (
            'post-2',
            '2026-09-02T10:00:00Z',
            'Why Neo-Brutalism is the Perfect Antidote to Sterile Tech UI',
            'Web Dev',
            'badge-yellow',
            'Sep 02, 2026',
            '3 min read',
            'Tired of identical minimalist corporate templates? Neo-Brutalism uses raw geometry, punchy contrasts, and deliberate tactile energy to stand out.',
            '<p>Over the last decade, web design converged towards identical rounded corners, faint 1px gray borders, and muted pastel palettes. Neo-Brutalism throws all of that out the window in favor of high visual confidence.</p><p>With thick 3px black strokes, crisp 0-blur drop shadows, and unapologetic neon accents, buttons feel like physical, clickable stamps. It respects user intelligence while injecting fun and identity into the digital canvas.</p><p>As a developer, building Neo-Brutalist interfaces is also a masterclass in CSS fundamentals—precise box models, custom properties, and responsive grid choreography.</p>',
            1
          ),
          (
            'post-3',
            '2026-08-21T10:00:00Z',
            'My Journey from Vanilla JavaScript into the React Universe',
            'React',
            'badge-pink',
            'Aug 21, 2026',
            '5 min read',
            'Having deep DOM and Vanilla JS fundamentals transforms how you learn React. Here is what clicked for me regarding hooks, state, and unidirectional data flow.',
            '<p>Before jumping into component frameworks, I spent significant time understanding pure JavaScript: closures, asynchronous event loops, DOM mutation patterns, and Canvas manipulation.</p><p>When you understand what the browser is actually doing under the hood, React does not feel like black magic. The shift from imperative DOM commands to declarative state rendering makes complete sense once your application complexity grows beyond a handful of interactive widgets.</p><p>I am currently building complex component libraries and interactive dashboards, diving deep into custom hooks and optimistic UI updates.</p>',
            1
          );
      `,
      args: []
    });
  }

  // Seed default signatures if empty
  const sigCheck = await db.execute('SELECT COUNT(*) as count FROM guestbook_signatures;');
  const sigCount = Number(sigCheck.rows[0]?.count || 0);

  if (sigCount === 0) {
    await db.execute({
      sql: `
        INSERT OR IGNORE INTO guestbook_signatures (id, created_at, name, role, signature, is_approved)
        VALUES 
          ('sig-1', '2026-09-10T12:00:00Z', 'Alex Rivera', 'Frontend Engineer', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60"><path d="M10,40 Q40,5 70,35 T130,25 T170,30" fill="none" stroke="%23121212" stroke-width="3" stroke-linecap="round"/></svg>', 1),
          ('sig-2', '2026-09-12T14:30:00Z', 'Sarah Chen', 'AI Researcher & Founder', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60"><path d="M20,30 C50,5 60,55 90,20 C120,5 140,50 160,28" fill="none" stroke="%232563eb" stroke-width="3.5" stroke-linecap="round"/><circle cx="168" cy="28" r="3" fill="%232563eb"/></svg>', 1),
          ('sig-3', '2026-09-15T09:15:00Z', 'Kofi Mensah', 'Full Stack Engineer', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60"><path d="M25,48 L50,15 L75,48 L100,20 L155,30" fill="none" stroke="%238b5cf6" stroke-width="3" stroke-linecap="round"/></svg>', 1);
      `,
      args: []
    });
  }

  initialized = true;
}

// Execute query with automatic schema initialization on demand
async function safeExecute(db, query) {
  try {
    return await db.execute(query);
  } catch (err) {
    if (err.message && (err.message.includes('no such table') || err.message.includes('SQLITE_ERROR'))) {
      await ensureSchema(db);
      return await db.execute(query);
    }
    throw err;
  }
}

// ==============================================================================
// 7. MAIN FUNCTION HANDLER
// ==============================================================================
exports.handler = async function (event) {
  const origin = getAllowedOrigin(event);
  const clientIp = getClientIp(event);

  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, {}, origin);
  }

  // Normalize path
  const normalizedPath = event.path
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '')
    .replace(/\/$/, '') || '/';

  const method = event.httpMethod.toUpperCase();

  // Extract Auth Token
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const currentUser = verifyToken(token);

  // Parse Body
  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return jsonResponse(400, { error: 'Invalid JSON payload format' }, origin);
    }
  }

  try {
    // -------------------------------------------------------------
    // HEALTH CHECK
    // -------------------------------------------------------------
    if (normalizedPath === '/health' && method === 'GET') {
      const isTurso = Boolean(process.env.TURSO_DATABASE_URL);
      if (event.queryStringParameters?.init === 'true') {
        const db = getDb();
        await ensureSchema(db);
      }
      return jsonResponse(200, {
        status: 'ok',
        database: isTurso ? 'Turso libSQL Cloud' : 'Local SQLite',
        configured: isTurso,
        timestamp: new Date().toISOString()
      }, origin);
    }

    // -------------------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------------------
    if (normalizedPath === '/auth/login' && method === 'POST') {
      // Rate Limit: max 5 login attempts per 15 minutes per IP
      if (!checkRateLimit(clientIp, 'login', 5, 15 * 60 * 1000)) {
        return jsonResponse(429, { error: 'Too many login attempts. Please wait 15 minutes before trying again.' }, origin);
      }

      const email = sanitizeString(body.email).toLowerCase();
      const password = body.password || '';

      if (!email || !password) {
        return jsonResponse(400, { error: 'Email and password are required' }, origin);
      }

      // Timing-safe password verification
      const isEmailValid = (email === ADMIN_EMAIL);
      const isPasswordValid = verifyPassword(password, ADMIN_PASSWORD, ADMIN_PASSWORD_HASH);

      if (isEmailValid && isPasswordValid) {
        const token = signToken({
          email: ADMIN_EMAIL,
          role: 'admin',
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return jsonResponse(200, {
          token,
          user: { email: ADMIN_EMAIL, role: 'admin' }
        }, origin);
      }

      return jsonResponse(401, { error: 'Invalid email or password' }, origin);
    }

    if (normalizedPath === '/auth/me' && method === 'GET') {
      if (!currentUser) {
        return jsonResponse(401, { error: 'Unauthorized' }, origin);
      }
      return jsonResponse(200, { user: currentUser }, origin);
    }

    // Connect to database (lazy table initialization handled by safeExecute)
    const db = getDb();

    // -------------------------------------------------------------
    // GUESTBOOK SIGNATURES
    // -------------------------------------------------------------
    if (normalizedPath === '/signatures') {
      if (method === 'GET') {
        const result = await safeExecute(db, {
          sql: 'SELECT * FROM guestbook_signatures WHERE is_approved = 1 ORDER BY created_at DESC;',
          args: []
        });

        const signatures = result.rows.map(row => ({
          id: row.id,
          name: row.name,
          role: row.role || '',
          signature: row.signature,
          date: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }));

        return jsonResponse(200, signatures, origin);
      }

      if (method === 'POST') {
        // Rate limit: max 5 signatures per 10 minutes per IP
        if (!checkRateLimit(clientIp, 'signatures', 5, 10 * 60 * 1000)) {
          return jsonResponse(429, { error: 'Signature rate limit reached. Please wait a few minutes before submitting another signature.' }, origin);
        }

        const name = sanitizeString(body.name);
        const role = sanitizeString(body.role);
        const signature = typeof body.signature === 'string' ? body.signature.trim() : '';

        // Strict input validation
        if (!name || name.length < 2 || name.length > 70) {
          return jsonResponse(400, { error: 'Name must be between 2 and 70 characters.' }, origin);
        }
        if (role && role.length > 70) {
          return jsonResponse(400, { error: 'Role must not exceed 70 characters.' }, origin);
        }
        if (!signature || (!signature.startsWith('data:image/') && !signature.startsWith('<svg'))) {
          return jsonResponse(400, { error: 'Invalid signature drawing format.' }, origin);
        }
        if (signature.length > 80000) {
          return jsonResponse(400, { error: 'Signature image is too large.' }, origin);
        }

        const id = 'sig-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
        const createdAt = new Date().toISOString();

        await safeExecute(db,{
          sql: `
            INSERT INTO guestbook_signatures (id, created_at, name, role, signature, is_approved)
            VALUES (?, ?, ?, ?, ?, 1);
          `,
          args: [id, createdAt, name, role || null, signature]
        });

        return jsonResponse(201, {
          id,
          name,
          role: role || '',
          signature,
          date: new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }, origin);
      }
    }

    if (normalizedPath.startsWith('/signatures/') && method === 'DELETE') {
      if (!currentUser) {
        return jsonResponse(401, { error: 'Admin authentication required' }, origin);
      }
      const id = decodeURIComponent(normalizedPath.replace('/signatures/', '')).slice(0, 100);
      await safeExecute(db,{
        sql: 'DELETE FROM guestbook_signatures WHERE id = ?;',
        args: [id]
      });
      return jsonResponse(200, { success: true, id }, origin);
    }

    // -------------------------------------------------------------
    // BLOG POSTS
    // -------------------------------------------------------------
    if (normalizedPath === '/posts') {
      if (method === 'GET') {
        const result = await safeExecute(db,{
          sql: 'SELECT * FROM blog_posts WHERE is_published = 1 ORDER BY created_at DESC;',
          args: []
        });

        const posts = result.rows.map(row => ({
          id: row.id,
          title: row.title,
          category: row.category,
          categoryClass: row.category_class || 'badge-cyan',
          date: row.date,
          readTime: row.read_time || '3 min read',
          excerpt: row.excerpt,
          content: row.content
        }));

        return jsonResponse(200, posts, origin);
      }

      if (method === 'POST') {
        if (!currentUser) {
          return jsonResponse(401, { error: 'Admin authentication required' }, origin);
        }

        const id = sanitizeString(body.id) || 'post-' + Date.now();
        const title = sanitizeString(body.title);
        const category = sanitizeString(body.category) || 'Web Dev';
        const categoryClass = sanitizeString(body.categoryClass) || 'badge-cyan';
        const date = sanitizeString(body.date) || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const readTime = sanitizeString(body.readTime) || '3 min read';
        const excerpt = sanitizeString(body.excerpt);
        const content = typeof body.content === 'string' ? body.content.trim() : '';

        // Validation
        if (!title || title.length < 3 || title.length > 200) {
          return jsonResponse(400, { error: 'Article title must be between 3 and 200 characters.' }, origin);
        }
        if (!content || content.length < 10) {
          return jsonResponse(400, { error: 'Article content is too short.' }, origin);
        }

        const createdAt = new Date().toISOString();

        await safeExecute(db,{
          sql: `
            INSERT INTO blog_posts (id, created_at, title, category, category_class, date, read_time, excerpt, content, is_published)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ON CONFLICT(id) DO UPDATE SET
              title = excluded.title,
              category = excluded.category,
              category_class = excluded.category_class,
              date = excluded.date,
              read_time = excluded.read_time,
              excerpt = excluded.excerpt,
              content = excluded.content;
          `,
          args: [id, createdAt, title, category, categoryClass, date, readTime, excerpt || '', content]
        });

        return jsonResponse(200, {
          success: true,
          post: { id, title, category, categoryClass, date, readTime, excerpt, content }
        }, origin);
      }
    }

    if (normalizedPath.startsWith('/posts/') && method === 'DELETE') {
      if (!currentUser) {
        return jsonResponse(401, { error: 'Admin authentication required' }, origin);
      }
      const id = decodeURIComponent(normalizedPath.replace('/posts/', '')).slice(0, 100);
      await safeExecute(db,{
        sql: 'DELETE FROM blog_posts WHERE id = ?;',
        args: [id]
      });
      return jsonResponse(200, { success: true, id }, origin);
    }

    // -------------------------------------------------------------
    // CONTACT MESSAGES
    // -------------------------------------------------------------
    if (normalizedPath === '/messages') {
      if (method === 'POST') {
        // Rate limit: max 5 contact messages per 10 minutes per IP
        if (!checkRateLimit(clientIp, 'messages', 5, 10 * 60 * 1000)) {
          return jsonResponse(429, { error: 'Message limit reached. Please wait a few minutes before sending another inquiry.' }, origin);
        }

        const name = sanitizeString(body.name);
        const email = sanitizeString(body.email);
        const subject = sanitizeString(body.subject);
        const message = sanitizeString(body.message);

        // Strict input validation
        if (!name || name.length < 2 || name.length > 70) {
          return jsonResponse(400, { error: 'Please enter a valid name (2 to 70 characters).' }, origin);
        }
        if (!validateEmail(email)) {
          return jsonResponse(400, { error: 'Please enter a valid email address.' }, origin);
        }
        if (subject && subject.length > 150) {
          return jsonResponse(400, { error: 'Subject cannot exceed 150 characters.' }, origin);
        }
        if (!message || message.length < 5 || message.length > 3000) {
          return jsonResponse(400, { error: 'Message must be between 5 and 3000 characters.' }, origin);
        }

        const id = 'msg-' + Date.now();
        const createdAt = new Date().toISOString();

        await safeExecute(db,{
          sql: `
            INSERT INTO contact_messages (id, created_at, name, email, subject, message, is_read)
            VALUES (?, ?, ?, ?, ?, ?, 0);
          `,
          args: [id, createdAt, name, email, subject || 'General Inquiry', message]
        });

        return jsonResponse(201, {
          success: true,
          id,
          created_at: createdAt
        }, origin);
      }

      if (method === 'GET') {
        if (!currentUser) {
          return jsonResponse(401, { error: 'Admin authentication required' }, origin);
        }

        const result = await safeExecute(db,{
          sql: 'SELECT * FROM contact_messages ORDER BY created_at DESC;',
          args: []
        });

        return jsonResponse(200, result.rows, origin);
      }
    }

    if (normalizedPath.startsWith('/messages/') && method === 'DELETE') {
      if (!currentUser) {
        return jsonResponse(401, { error: 'Admin authentication required' }, origin);
      }
      const id = decodeURIComponent(normalizedPath.replace('/messages/', '')).slice(0, 100);
      await safeExecute(db,{
        sql: 'DELETE FROM contact_messages WHERE id = ?;',
        args: [id]
      });
      return jsonResponse(200, { success: true, id }, origin);
    }

    // 404 Route
    return jsonResponse(404, { error: `Endpoint not found: ${method} ${normalizedPath}` }, origin);

  } catch (error) {
    // Disable production debug leak: log error to server console, send generic safe error to user
    console.error('Secure API Error:', error);
    return jsonResponse(500, { error: 'An unexpected internal error occurred. Please try again later.' }, origin);
  }
};
