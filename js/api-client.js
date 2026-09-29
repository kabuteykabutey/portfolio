/* ==========================================================================
   PORTFOLIO API CLIENT & DATA ACCESS LAYER
   Connects to custom Netlify Serverless API (/api/*) backed by Turso
   Includes robust offline / LocalStorage fallback
   ========================================================================== */

(function () {
  const API_BASE = '/api';

  const STORAGE_KEYS = {
    signatures: 'brian_portfolio_guestbook',
    posts: 'brian_portfolio_blog_posts',
    messages: 'brian_portfolio_contact_messages',
    token: 'brian_portfolio_admin_token',
    user: 'brian_portfolio_admin_user'
  };

  // Helper for fetch with auth header
  async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errMessage = `HTTP ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.error) errMessage = errData.error;
      } catch (e) {}
      throw new Error(errMessage);
    }

    return response.json();
  }

  // Unified Database Interface (window.portfolioDB)
  window.portfolioDB = {
    isLive: () => true,

    // --- Guestbook Signatures ---
    async getSignatures() {
      try {
        const data = await apiRequest('/signatures');
        if (Array.isArray(data)) {
          localStorage.setItem(STORAGE_KEYS.signatures, JSON.stringify(data));
          return data;
        }
      } catch (e) {
        console.warn('API getSignatures failed, using local cache:', e);
      }
      try {
        const local = localStorage.getItem(STORAGE_KEYS.signatures);
        return local ? JSON.parse(local) : [];
      } catch (e) {
        return [];
      }
    },

    async saveSignature(entry) {
      try {
        const saved = await apiRequest('/signatures', {
          method: 'POST',
          body: JSON.stringify(entry)
        });
        if (saved && saved.id) {
          entry = saved;
        }
      } catch (e) {
        console.warn('API saveSignature failed, saving locally:', e);
        entry.id = 'sig-' + Date.now();
        entry.date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      // Sync local cache
      try {
        const list = await this.getSignatures();
        const exists = list.some(s => s.id === entry.id);
        if (!exists) list.unshift(entry);
        localStorage.setItem(STORAGE_KEYS.signatures, JSON.stringify(list));
      } catch (e) {}

      return entry;
    },

    async deleteSignature(id) {
      try {
        await apiRequest(`/signatures/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.warn('API deleteSignature failed, deleting locally:', e);
      }
      try {
        const list = (await this.getSignatures()).filter(s => s.id !== id);
        localStorage.setItem(STORAGE_KEYS.signatures, JSON.stringify(list));
      } catch (e) {}
    },

    // --- Blog Posts ---
    async getPosts() {
      try {
        const data = await apiRequest('/posts');
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(data));
          return data;
        }
      } catch (e) {
        console.warn('API getPosts failed, using local cache:', e);
      }
      try {
        const local = localStorage.getItem(STORAGE_KEYS.posts);
        return local ? JSON.parse(local) : [];
      } catch (e) {
        return [];
      }
    },

    async savePost(post) {
      try {
        const res = await apiRequest('/posts', {
          method: 'POST',
          body: JSON.stringify(post)
        });
        if (res && res.post) {
          post = res.post;
        }
      } catch (e) {
        console.warn('API savePost failed, saving locally:', e);
      }

      try {
        const posts = (await this.getPosts()).filter(p => p.id !== post.id);
        posts.unshift(post);
        localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(posts));
      } catch (e) {}

      return post;
    },

    async deletePost(id) {
      try {
        await apiRequest(`/posts/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.warn('API deletePost failed, deleting locally:', e);
      }
      try {
        const posts = (await this.getPosts()).filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(posts));
      } catch (e) {}
    },

    // --- Contact Messages ---
    async saveContactMessage(msg) {
      const payload = {
        ...msg,
        id: 'msg-' + Date.now(),
        created_at: new Date().toISOString()
      };

      try {
        const res = await apiRequest('/messages', {
          method: 'POST',
          body: JSON.stringify(msg)
        });
        if (res && res.id) payload.id = res.id;
      } catch (e) {
        console.warn('API saveContactMessage failed, saving locally:', e);
      }

      try {
        const local = localStorage.getItem(STORAGE_KEYS.messages);
        const list = local ? JSON.parse(local) : [];
        list.unshift(payload);
        localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(list));
      } catch (e) {}

      return payload;
    },

    async getContactMessages() {
      try {
        const data = await apiRequest('/messages');
        if (Array.isArray(data)) return data;
      } catch (e) {
        console.warn('API getContactMessages failed, loading locally:', e);
      }
      try {
        const local = localStorage.getItem(STORAGE_KEYS.messages);
        return local ? JSON.parse(local) : [];
      } catch (e) {
        return [];
      }
    }
  };

  // Unified Auth Interface (window.portfolioAuth)
  window.portfolioAuth = {
    async login(email, password) {
      try {
        const data = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        if (data.token && data.user) {
          localStorage.setItem(STORAGE_KEYS.token, data.token);
          localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
          return data.user;
        }
      } catch (e) {
        // Fallback for demo credentials if API offline
        if (email.trim().toLowerCase() === 'admin@brian.dev' && password === 'brian123') {
          const localUser = { email: 'admin@brian.dev', role: 'admin', id: 'local-admin' };
          localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(localUser));
          return localUser;
        }
        throw e;
      }
    },

    async logout() {
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.user);
    },

    async getCurrentUser() {
      const token = localStorage.getItem(STORAGE_KEYS.token);
      const userStr = localStorage.getItem(STORAGE_KEYS.user);
      if (token) {
        try {
          const res = await apiRequest('/auth/me');
          if (res && res.user) {
            return res.user;
          }
        } catch (e) {
          localStorage.removeItem(STORAGE_KEYS.token);
          localStorage.removeItem(STORAGE_KEYS.user);
          return null;
        }
      }
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (e) {
          return null;
        }
      }
      return null;
    }
  };
})();
