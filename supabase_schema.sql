-- ==========================================================================
-- BRIAN.DEV PORTFOLIO - SUPABASE DATABASE SCHEMA & SECURITY POLICIES
-- Run this SQL in your Supabase Project -> SQL Editor to initialize all tables
-- ==========================================================================

-- 1. GUESTBOOK SIGNATURES TABLE
CREATE TABLE IF NOT EXISTS public.guestbook_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  signature TEXT NOT NULL, -- Base64 PNG data URL or SVG
  is_approved BOOLEAN DEFAULT true NOT NULL
);

-- Enable RLS for Guestbook
ALTER TABLE public.guestbook_signatures ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved signatures
CREATE POLICY "Public can view approved signatures"
  ON public.guestbook_signatures
  FOR SELECT
  USING (is_approved = true);

-- Anyone can submit a signature
CREATE POLICY "Public can insert signatures"
  ON public.guestbook_signatures
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated admin can update/delete signatures
CREATE POLICY "Admin can manage all signatures"
  ON public.guestbook_signatures
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- 2. BLOG POSTS TABLE
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  category_class TEXT DEFAULT 'badge-cyan',
  date TEXT NOT NULL,
  read_time TEXT DEFAULT '3 min read',
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true NOT NULL
);

-- Enable RLS for Blog
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Public can view published posts"
  ON public.blog_posts
  FOR SELECT
  USING (is_published = true);

-- Only authenticated admin can manage blog posts
CREATE POLICY "Admin can manage all posts"
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- 3. CONTACT MESSAGES INBOX TABLE
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL
);

-- Enable RLS for Contact Messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can send a message
CREATE POLICY "Public can insert contact messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated admin can view or manage messages
CREATE POLICY "Admin can view and manage messages"
  ON public.contact_messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- SEED INITIAL SAMPLE DATA (If empty)
INSERT INTO public.guestbook_signatures (name, role, signature)
VALUES 
  ('Alex Rivera', 'Frontend Engineer', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60"><path d="M10,40 Q40,5 70,35 T130,25 T170,30" fill="none" stroke="%23121212" stroke-width="3" stroke-linecap="round"/></svg>'),
  ('Sarah Chen', 'AI Researcher & Founder', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60"><path d="M20,30 C50,5 60,55 90,20 C120,5 140,50 160,28" fill="none" stroke="%232563eb" stroke-width="3.5" stroke-linecap="round"/><circle cx="168" cy="28" r="3" fill="%232563eb"/></svg>'),
  ('Kofi Mensah', 'Full Stack Engineer', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60"><path d="M25,48 L50,15 L75,48 L100,20 L155,30" fill="none" stroke="%238b5cf6" stroke-width="3" stroke-linecap="round"/></svg>')
ON CONFLICT DO NOTHING;

INSERT INTO public.blog_posts (id, title, category, category_class, date, read_time, excerpt, content)
VALUES 
  (
    'post-1',
    'Bridging Python & LLM APIs into Everyday Web Apps',
    'AI Integration',
    'badge-purple',
    'Sep 14, 2026',
    '4 min read',
    'How integrating lightweight Python endpoints with modern AI agents creates responsive, self-adapting applications without bloated infrastructure.',
    '<p>Artificial Intelligence is no longer just research lab code—it has become a fundamental design material for modern web and mobile apps. In my recent freelance projects, pairing high-performance Python microservices with client-side reactive frontends creates deterministic, reliable AI responses.</p><p>By delegating prompt orchestration and structured JSON schema validations to Python (using libraries like FastAPI and Pydantic), client-side interfaces remain snappy and decoupled.</p><h4>Key Takeaways for Developers:</h4><ul><li><strong>Stream early:</strong> Always prefer streaming token responses to reduce perceived latency.</li><li><strong>Schema enforcement:</strong> Do not let raw text into your databases—use function calling / structured outputs.</li><li><strong>Fail gracefully:</strong> Always build deterministic fallbacks when AI services encounter rate-limits.</li></ul>'
  ),
  (
    'post-2',
    'Why Neo-Brutalism is the Perfect Antidote to Sterile Tech UI',
    'Web Dev',
    'badge-yellow',
    'Sep 02, 2026',
    '3 min read',
    'Tired of identical minimalist corporate templates? Neo-Brutalism uses raw geometry, punchy contrasts, and deliberate tactile energy to stand out.',
    '<p>Over the last decade, web design converged towards identical rounded corners, faint 1px gray borders, and muted pastel palettes. Neo-Brutalism throws all of that out the window in favor of high visual confidence.</p><p>With thick 3px black strokes, crisp 0-blur drop shadows, and unapologetic neon accents, buttons feel like physical, clickable stamps. It respects user intelligence while injecting fun and identity into the digital canvas.</p><p>As a developer, building Neo-Brutalist interfaces is also a masterclass in CSS fundamentals—precise box models, custom properties, and responsive grid choreography.</p>'
  ),
  (
    'post-3',
    'My Journey from Vanilla JavaScript into the React Universe',
    'React',
    'badge-pink',
    'Aug 21, 2026',
    '5 min read',
    'Having deep DOM and Vanilla JS fundamentals transforms how you learn React. Here is what clicked for me regarding hooks, state, and unidirectional data flow.',
    '<p>Before jumping into component frameworks, I spent significant time understanding pure JavaScript: closures, asynchronous event loops, DOM mutation patterns, and Canvas manipulation.</p><p>When you understand what the browser is actually doing under the hood, React does not feel like black magic. The shift from imperative DOM commands to declarative state rendering makes complete sense once your application complexity grows beyond a handful of interactive widgets.</p><p>I am currently building complex component libraries and interactive dashboards, diving deep into custom hooks and optimistic UI updates.</p>'
  )
ON CONFLICT DO NOTHING;
