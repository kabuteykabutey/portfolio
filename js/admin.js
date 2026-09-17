/* ==========================================================================
   ADMIN PORTAL LOGIC & CONTENT MANAGEMENT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const authGate = document.getElementById('auth-gate');
  const dashboard = document.getElementById('admin-dashboard');
  const loginForm = document.getElementById('admin-login-form');
  const logoutBtn = document.getElementById('admin-logout-btn');

  // Dashboard elements
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const sections = document.querySelectorAll('.admin-section');
  
  const postsList = document.getElementById('admin-posts-list');
  const sigsList = document.getElementById('admin-signatures-list');
  const msgsList = document.getElementById('admin-messages-list');

  const badgePosts = document.getElementById('badge-posts-count');
  const badgeSigs = document.getElementById('badge-sigs-count');
  const badgeMsgs = document.getElementById('badge-msgs-count');

  // Post Editor elements
  const postEditorCard = document.getElementById('post-editor-card');
  const addPostBtn = document.getElementById('admin-add-post-btn');
  const cancelPostBtn = document.getElementById('cancel-post-btn');
  const postForm = document.getElementById('admin-post-form');
  const editPostId = document.getElementById('edit-post-id');
  const postTitleInput = document.getElementById('post-title-input');
  const postCategorySelect = document.getElementById('post-category-select');
  const postReadtimeInput = document.getElementById('post-readtime-input');
  const postExcerptInput = document.getElementById('post-excerpt-input');
  const postContentInput = document.getElementById('post-content-input');
  const editorTitle = document.getElementById('editor-title');

  // 1. Check current session
  async function checkAuth() {
    const user = await window.portfolioAuth.getCurrentUser();
    if (user) {
      authGate.style.display = 'none';
      dashboard.style.display = 'block';
      logoutBtn.style.display = 'inline-flex';
      loadAllData();
    } else {
      authGate.style.display = 'block';
      dashboard.style.display = 'none';
      logoutBtn.style.display = 'none';
    }
  }

  // 2. Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('admin-email').value;
      const password = document.getElementById('admin-password').value;

      try {
        const user = await window.portfolioAuth.login(email, password);
        window.showToast('✅ Welcome back, Brian!', 'success');
        checkAuth();
      } catch (err) {
        window.showToast('⚠️ ' + (err.message || 'Login failed'), 'error');
      }
    });
  }

  // 3. Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await window.portfolioAuth.logout();
      window.showToast('Logged out successfully', 'info');
      checkAuth();
    });
  }

  // 4. Tab Navigation
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.classList.add('active');
    });
  });

  // 5. Load All Dashboard Data
  async function loadAllData() {
    loadPosts();
    loadSignatures();
    loadMessages();
  }

  // --- BLOG POSTS ---
  async function loadPosts() {
    const posts = await window.portfolioDB.getPosts();
    badgePosts.textContent = posts.length;

    if (posts.length === 0) {
      postsList.innerHTML = '<p style="color: #a1a1aa;">No posts published yet.</p>';
      return;
    }

    postsList.innerHTML = posts.map(p => `
      <div class="item-row" data-id="${p.id}">
        <div class="item-info">
          <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.25rem;">
            <span class="neo-badge ${p.categoryClass || 'badge-cyan'}">${escapeHtml(p.category)}</span>
            <span style="font-family: var(--font-mono); font-size: 0.75rem; color: #71717a;">${escapeHtml(p.date)}</span>
          </div>
          <strong style="font-size: 1.05rem; color: #f4f4f5;">${escapeHtml(p.title)}</strong>
          <p style="color: #a1a1aa; font-size: 0.85rem; margin: 0.25rem 0 0;">${escapeHtml(p.excerpt)}</p>
        </div>
        <div class="item-actions">
          <button class="neo-btn btn-edit edit-post-btn" data-id="${p.id}">Edit ✏️</button>
          <button class="neo-btn btn-danger delete-post-btn" data-id="${p.id}">Delete 🗑️</button>
        </div>
      </div>
    `).join('');

    // Attach listeners
    postsList.querySelectorAll('.delete-post-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this article?')) {
          await window.portfolioDB.deletePost(id);
          window.showToast('Article deleted', 'info');
          loadPosts();
        }
      });
    });

    postsList.querySelectorAll('.edit-post-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const post = posts.find(p => p.id === id);
        if (post) openEditor(post);
      });
    });
  }

  // Add / Edit Post Editor
  if (addPostBtn) {
    addPostBtn.addEventListener('click', () => openEditor());
  }

  if (cancelPostBtn) {
    cancelPostBtn.addEventListener('click', () => {
      postEditorCard.style.display = 'none';
      postForm.reset();
      editPostId.value = '';
    });
  }

  function openEditor(post = null) {
    postEditorCard.style.display = 'block';
    if (post) {
      editorTitle.textContent = 'Edit Blog Post';
      editPostId.value = post.id;
      postTitleInput.value = post.title;
      postCategorySelect.value = post.category;
      postReadtimeInput.value = post.readTime || '3 min read';
      postExcerptInput.value = post.excerpt;
      postContentInput.value = post.content;
    } else {
      editorTitle.textContent = 'Create New Blog Post';
      postForm.reset();
      editPostId.value = '';
    }
    postTitleInput.focus();
  }

  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = editPostId.value || 'post-' + Date.now();
      const title = postTitleInput.value.trim();
      const category = postCategorySelect.value;
      const readTime = postReadtimeInput.value.trim() || '3 min read';
      const excerpt = postExcerptInput.value.trim();
      const content = postContentInput.value.trim();

      const categoryClasses = {
        'AI Integration': 'badge-purple',
        'Python': 'badge-yellow',
        'React': 'badge-pink',
        'Web Dev': 'badge-cyan',
        'Databases': 'badge-green'
      };

      const payload = {
        id,
        title,
        category,
        categoryClass: categoryClasses[category] || 'badge-cyan',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        readTime,
        excerpt,
        content
      };

      await window.portfolioDB.savePost(payload);
      window.showToast('🎉 Article saved successfully!', 'success');
      postEditorCard.style.display = 'none';
      postForm.reset();
      loadPosts();
    });
  }

  // --- GUESTBOOK SIGNATURES ---
  async function loadSignatures() {
    const sigs = await window.portfolioDB.getSignatures();
    badgeSigs.textContent = sigs.length;

    if (sigs.length === 0) {
      sigsList.innerHTML = '<p style="color: #a1a1aa;">No signatures recorded yet.</p>';
      return;
    }

    sigsList.innerHTML = sigs.map(s => `
      <div class="item-row" data-id="${s.id}">
        <div class="item-info" style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <img src="${s.signature}" alt="Signature of ${escapeHtml(s.name)}" class="signature-thumb" />
          <div>
            <strong style="color: #f4f4f5; font-size: 1rem;">${escapeHtml(s.name)}</strong>
            ${s.role ? `<div style="font-size: 0.8rem; color: #a1a1aa;">${escapeHtml(s.role)}</div>` : ''}
            <div style="font-family: var(--font-mono); font-size: 0.72rem; color: #71717a;">${escapeHtml(s.date)}</div>
          </div>
        </div>
        <div class="item-actions">
          <button class="neo-btn btn-danger delete-sig-btn" data-id="${s.id}">Delete Signature 🗑️</button>
        </div>
      </div>
    `).join('');

    sigsList.querySelectorAll('.delete-sig-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this visitor signature?')) {
          await window.portfolioDB.deleteSignature(id);
          window.showToast('Signature removed', 'info');
          loadSignatures();
        }
      });
    });
  }

  // --- CONTACT MESSAGES ---
  async function loadMessages() {
    const msgs = await window.portfolioDB.getContactMessages();
    badgeMsgs.textContent = msgs.length;

    if (msgs.length === 0) {
      msgsList.innerHTML = '<p style="color: #a1a1aa;">Inbox is empty. No messages received yet.</p>';
      return;
    }

    msgsList.innerHTML = msgs.map(m => `
      <div class="item-row" style="flex-direction: column; align-items: stretch; gap: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <strong style="color: #facc15; font-size: 1.05rem;">${escapeHtml(m.name)}</strong>
            <a href="mailto:${escapeHtml(m.email)}?subject=Re:%20${encodeURIComponent(m.subject || 'Portfolio Inquiry')}" style="color: #38bdf8; font-size: 0.85rem; margin-left: 0.5rem; text-decoration: underline;">
              ${escapeHtml(m.email)}
            </a>
          </div>
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: #71717a;">
            ${new Date(m.created_at).toLocaleString()}
          </span>
        </div>
        ${m.subject ? `<div style="font-weight: 700; font-size: 0.95rem; color: #e4e4e7;">Subject: ${escapeHtml(m.subject)}</div>` : ''}
        <div style="background: #1c1c20; border: 1px solid #2e2e34; padding: 0.75rem 1rem; border-radius: 4px; font-size: 0.9rem; line-height: 1.5; color: #d4d4d8; white-space: pre-wrap;">${escapeHtml(m.message)}</div>
        <div style="display: flex; justify-content: flex-end;">
          <a href="mailto:${escapeHtml(m.email)}?subject=Re:%20${encodeURIComponent(m.subject || 'Portfolio Inquiry')}" class="neo-btn neo-btn-cyan" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">
            Reply via Email ✉️
          </a>
        </div>
      </div>
    `).join('');
  }

  // Initial check
  checkAuth();
});

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
