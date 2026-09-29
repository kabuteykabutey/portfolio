-- ==========================================================================
-- BRIAN.DEV PORTFOLIO - TURSO SQLITE DATABASE SCHEMA & SEED DATA
-- You can run this in your Turso Shell or Dashboard to initialize all tables
-- Note: The Netlify Function also automatically initializes these tables on first run!
-- ==========================================================================

-- 1. GUESTBOOK SIGNATURES TABLE
CREATE TABLE IF NOT EXISTS guestbook_signatures (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  signature TEXT NOT NULL,
  is_approved INTEGER NOT NULL DEFAULT 1
);

-- 2. BLOG POSTS TABLE
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

-- 3. CONTACT MESSAGES INBOX TABLE
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0
);

-- SEED SAMPLE GUESTBOOK SIGNATURES
INSERT OR IGNORE INTO guestbook_signatures (id, created_at, name, role, signature, is_approved)
VALUES 
  ('sig-1', '2026-09-10T12:00:00Z', 'Alex Rivera', 'Frontend Engineer', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60"><path d="M10,40 Q40,5 70,35 T130,25 T170,30" fill="none" stroke="%23121212" stroke-width="3" stroke-linecap="round"/></svg>', 1),
  ('sig-2', '2026-09-12T14:30:00Z', 'Sarah Chen', 'AI Researcher & Founder', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60"><path d="M20,30 C50,5 60,55 90,20 C120,5 140,50 160,28" fill="none" stroke="%232563eb" stroke-width="3.5" stroke-linecap="round"/><circle cx="168" cy="28" r="3" fill="%232563eb"/></svg>', 1),
  ('sig-3', '2026-09-15T09:15:00Z', 'Kofi Mensah', 'Full Stack Engineer', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60"><path d="M25,48 L50,15 L75,48 L100,20 L155,30" fill="none" stroke="%238b5cf6" stroke-width="3" stroke-linecap="round"/></svg>', 1);

-- SEED SAMPLE BLOG POSTS
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
