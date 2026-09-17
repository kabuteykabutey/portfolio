/* ==========================================================================
   INTERACTIVE BLOG POSTING & FEED SYSTEM
   ========================================================================== */

(function () {
  const STORAGE_KEY = 'brian_portfolio_blog_posts';

  const defaultPosts = [
    {
      id: 'post-1',
      title: 'Bridging Python & LLM APIs into Everyday Web Apps',
      category: 'AI Integration',
      categoryClass: 'badge-purple',
      date: 'Sep 14, 2026',
      readTime: '4 min read',
      excerpt: 'How integrating lightweight Python endpoints with modern AI agents creates responsive, self-adapting applications without bloated infrastructure.',
      content: `
        <p>Artificial Intelligence is no longer just research lab code—it's become a fundamental design material for modern web and mobile apps. In my recent freelance projects, one pattern has consistently proven itself: pairing high-performance Python microservices with client-side reactive frontends.</p>
        <p>By delegating prompt orchestration and structured JSON schema validations to Python (using libraries like FastAPI and Pydantic), web apps achieve deterministic, reliable AI responses. Meanwhile, client-side interfaces remain snappy and decoupled.</p>
        <h4>Key Takeaways for Developers:</h4>
        <ul>
          <li><strong>Stream early:</strong> Always prefer streaming token responses to reduce perceived latency.</li>
          <li><strong>Schema enforcement:</strong> Don't let raw text into your databases—use function calling / structured outputs.</li>
          <li><strong>Fail gracefully:</strong> Always build deterministic fallbacks when AI services encounter rate-limits.</li>
        </ul>
      `
    },
    {
      id: 'post-2',
      title: 'Why Neo-Brutalism is the Perfect Antidote to Sterile Tech UI',
      category: 'Web Dev',
      categoryClass: 'badge-yellow',
      date: 'Sep 02, 2026',
      readTime: '3 min read',
      excerpt: 'Tired of identical minimalist corporate templates? Neo-Brutalism uses raw geometry, punchy contrasts, and deliberate tactile energy to stand out.',
      content: `
        <p>Over the last decade, web design converged towards identical rounded corners, faint 1px gray borders, and muted pastel palettes. Neo-Brutalism throws all of that out the window in favor of high visual confidence.</p>
        <p>With thick 3px black strokes, crisp 0-blur drop shadows, and unapologetic neon accents, buttons feel like physical, clickable stamps. It respects user intelligence while injecting fun and identity into the digital canvas.</p>
        <p>As a developer, building Neo-Brutalist interfaces is also a masterclass in CSS fundamentals—precise box models, custom properties, and responsive grid choreography.</p>
      `
    },
    {
      id: 'post-3',
      title: 'My Journey from Vanilla JavaScript into the React Universe',
      category: 'React',
      categoryClass: 'badge-pink',
      date: 'Aug 21, 2026',
      readTime: '5 min read',
      excerpt: 'Having deep DOM and Vanilla JS fundamentals transforms how you learn React. Here is what clicked for me regarding hooks, state, and unidirectional data flow.',
      content: `
        <p>Before jumping into component frameworks, I spent significant time understanding pure JavaScript: closures, asynchronous event loops, DOM mutation patterns, and Canvas manipulation.</p>
        <p>When you understand what the browser is actually doing under the hood, React doesn't feel like black magic. The shift from imperative DOM commands to declarative state rendering makes complete sense once your application complexity grows beyond a handful of interactive widgets.</p>
        <p>I'm currently building complex component libraries and interactive dashboards, diving deep into custom hooks and optimistic UI updates.</p>
      `
    }
  ];

  // DOM Elements
  const blogGrid = document.getElementById('blog-grid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const newPostBtn = document.getElementById('open-new-post-modal');
  const modalBackdrop = document.getElementById('blog-modal-backdrop');
  const modalCloseBtn = document.getElementById('blog-modal-close');
  const newPostForm = document.getElementById('new-post-form');
  const readPostModal = document.getElementById('read-post-modal-backdrop');
  const readPostClose = document.getElementById('read-post-modal-close');
  const readPostTitle = document.getElementById('read-post-title');
  const readPostMeta = document.getElementById('read-post-meta');
  const readPostContent = document.getElementById('read-post-content');

  let currentCategory = 'all';

  function loadPosts() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPosts));
      return defaultPosts;
    }
    try {
      return JSON.parse(saved);
    } catch (e) {
      return defaultPosts;
    }
  }

  function getCategoryBadgeClass(category) {
    switch ((category || '').toLowerCase()) {
      case 'ai integration':
      case 'ai': return 'badge-purple';
      case 'python': return 'badge-yellow';
      case 'react': return 'badge-pink';
      case 'database': return 'badge-green';
      default: return 'badge-cyan';
    }
  }

  function renderPosts() {
    if (!blogGrid) return;
    const posts = loadPosts();

    const filtered = currentCategory === 'all' 
      ? posts 
      : posts.filter(p => (p.category || '').toLowerCase() === currentCategory.toLowerCase());

    if (filtered.length === 0) {
      blogGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--white); border: var(--border-thick); box-shadow: var(--shadow-sm);">
          <p style="font-family: var(--font-display); font-weight: 800; font-size: 1.2rem;">No articles found in this category.</p>
          <button class="neo-btn neo-btn-yellow" id="reset-filter-btn" style="margin-top: 1rem;">View All Articles</button>
        </div>
      `;
      const resetBtn = document.getElementById('reset-filter-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          currentCategory = 'all';
          filterBtns.forEach(b => b.classList.toggle('active', b.dataset.category === 'all'));
          renderPosts();
        });
      }
      return;
    }

    blogGrid.innerHTML = filtered.map(post => `
      <article class="blog-card" data-id="${post.id}">
        <div class="blog-card-header">
          <span class="neo-badge ${post.categoryClass || getCategoryBadgeClass(post.category)}">
            ${escapeHtml(post.category)}
          </span>
          <span style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700;">
            ${escapeHtml(post.date)}
          </span>
        </div>
        <div class="blog-card-body">
          <h3 class="blog-card-title">${escapeHtml(post.title)}</h3>
          <p class="blog-card-excerpt">${escapeHtml(post.excerpt)}</p>
        </div>
        <div class="blog-card-footer">
          <button class="read-btn" data-action="read" data-id="${post.id}">
            Read Full Article →
          </button>
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: #555;">
            ${escapeHtml(post.readTime || '3 min read')}
          </span>
        </div>
      </article>
    `).join('');

    // Attach read click listeners
    blogGrid.querySelectorAll('[data-action="read"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openArticle(id);
      });
    });
  }

  function openArticle(id) {
    const posts = loadPosts();
    const post = posts.find(p => p.id === id);
    if (!post || !readPostModal) return;

    readPostTitle.textContent = post.title;
    readPostMeta.innerHTML = `
      <span class="neo-badge ${post.categoryClass || getCategoryBadgeClass(post.category)}">${escapeHtml(post.category)}</span>
      <span style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700;">Published: ${escapeHtml(post.date)} • ${escapeHtml(post.readTime || '3 min read')}</span>
    `;
    readPostContent.innerHTML = post.content || `<p>${escapeHtml(post.excerpt)}</p>`;

    readPostModal.classList.add('active');
  }

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category') || 'all';
      renderPosts();
    });
  });

  // Modal Open / Close for New Post
  if (newPostBtn && modalBackdrop) {
    newPostBtn.addEventListener('click', () => {
      modalBackdrop.classList.add('active');
    });
  }

  if (modalCloseBtn && modalBackdrop) {
    modalCloseBtn.addEventListener('click', () => {
      modalBackdrop.classList.remove('active');
    });
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.classList.remove('active');
      }
    });
  }

  // Read Modal Close
  if (readPostClose && readPostModal) {
    readPostClose.addEventListener('click', () => {
      readPostModal.classList.remove('active');
    });
  }

  if (readPostModal) {
    readPostModal.addEventListener('click', (e) => {
      if (e.target === readPostModal) {
        readPostModal.classList.remove('active');
      }
    });
  }

  // Submit New Post Form
  if (newPostForm) {
    newPostForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = document.getElementById('post-title').value.trim();
      const category = document.getElementById('post-category').value;
      const excerpt = document.getElementById('post-excerpt').value.trim();
      const content = document.getElementById('post-content').value.trim();

      if (!title || !excerpt || !content) {
        if (window.showToast) {
          window.showToast('Please fill out all required fields!', 'error');
        }
        return;
      }

      // Estimate read time
      const wordCount = (excerpt + ' ' + content).split(/\s+/).length;
      const readMinutes = Math.max(1, Math.ceil(wordCount / 180));

      const newPost = {
        id: 'user-post-' + Date.now(),
        title: title,
        category: category,
        categoryClass: getCategoryBadgeClass(category),
        date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date()),
        readTime: `${readMinutes} min read`,
        excerpt: excerpt,
        content: content.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')
      };

      const posts = loadPosts();
      posts.unshift(newPost);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));

      newPostForm.reset();
      modalBackdrop.classList.remove('active');
      renderPosts();

      if (window.showToast) {
        window.showToast('🚀 New blog post published successfully!', 'success');
      }
    });
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial render
  document.addEventListener('DOMContentLoaded', renderPosts);
})();
