/* ==========================================================================
   SUPABASE CLIENT CONFIGURATION & DATA ACCESS LAYER
   Supports live Supabase Cloud database with seamless LocalStorage fallback
   ========================================================================== */

(function () {
  const rawUrl = window.SUPABASE_URL || 'https://czqmsmkwrnmpqmylpwrt.supabase.co';
  const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

  const SUPABASE_CONFIG = {
    url: cleanUrl,
    anonKey: window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6cW1zbWt3cm5tcHFteWxwd3J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NzE1OTMsImV4cCI6MjEwNTI0NzU5M30.u2ILGYYt7WYLcIJPIZhZwZU7SyPE2HX_qTQswPSlYKc'
  };

  // Local storage keys for fallback mode
  const STORAGE_KEYS = {
    signatures: 'brian_portfolio_guestbook',
    posts: 'brian_portfolio_blog_posts',
    messages: 'brian_portfolio_contact_messages'
  };

  let supabaseClient = null;
  const isConfigured = 
    Boolean(SUPABASE_CONFIG.url) && 
    Boolean(SUPABASE_CONFIG.anonKey) && 
    !SUPABASE_CONFIG.url.includes('YOUR_PROJECT_ID') &&
    !SUPABASE_CONFIG.anonKey.includes('YOUR_ANON_KEY');

  if (isConfigured && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    } catch (err) {
      console.warn('Supabase initialization failed, falling back to LocalStorage:', err);
      supabaseClient = null;
    }
  }

  // ==========================================================================
  // UNIFIED DATABASE INTERFACE (window.portfolioDB)
  // ==========================================================================
  window.portfolioDB = {
    isLive: () => Boolean(supabaseClient),

    // --- Guestbook Signatures ---
    async getSignatures() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('guestbook_signatures')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false });

          if (!error && data) {
            return data.map(item => ({
              id: item.id,
              name: item.name,
              role: item.role,
              signature: item.signature,
              date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            }));
          }
        } catch (e) {
          console.warn('Supabase fetch failed, using fallback:', e);
        }
      }

      // Fallback to localStorage
      try {
        const local = localStorage.getItem(STORAGE_KEYS.signatures);
        return local ? JSON.parse(local) : [];
      } catch (e) {
        return [];
      }
    },

    async saveSignature(entry) {
      // 1. Try Supabase
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('guestbook_signatures')
            .insert([{
              name: entry.name,
              role: entry.role || null,
              signature: entry.signature,
              is_approved: true
            }])
            .select()
            .single();

          if (!error && data) {
            entry.id = data.id;
          }
        } catch (e) {
          console.warn('Supabase insert failed, saving locally:', e);
        }
      }

      // 2. Also keep local copy
      try {
        const list = await this.getSignatures();
        list.unshift({
          ...entry,
          id: entry.id || 'sig-' + Date.now(),
          date: entry.date || 'Just now'
        });
        localStorage.setItem(STORAGE_KEYS.signatures, JSON.stringify(list));
      } catch (e) {}

      return entry;
    },

    async deleteSignature(id) {
      if (supabaseClient) {
        try {
          await supabaseClient.from('guestbook_signatures').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase delete failed:', e);
        }
      }
      try {
        const list = (await this.getSignatures()).filter(s => s.id !== id);
        localStorage.setItem(STORAGE_KEYS.signatures, JSON.stringify(list));
      } catch (e) {}
    },

    // --- Blog Posts ---
    async getPosts() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('blog_posts')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            return data.map(p => ({
              id: p.id,
              title: p.title,
              category: p.category,
              categoryClass: p.category_class || 'badge-cyan',
              date: p.date,
              readTime: p.read_time,
              excerpt: p.excerpt,
              content: p.content
            }));
          }
        } catch (e) {
          console.warn('Supabase getPosts failed, using fallback:', e);
        }
      }

      // Fallback
      try {
        const local = localStorage.getItem(STORAGE_KEYS.posts);
        return local ? JSON.parse(local) : [];
      } catch (e) {
        return [];
      }
    },

    async savePost(post) {
      if (supabaseClient) {
        try {
          await supabaseClient.from('blog_posts').upsert([{
            id: post.id || 'post-' + Date.now(),
            title: post.title,
            category: post.category,
            category_class: post.categoryClass || 'badge-cyan',
            date: post.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            read_time: post.readTime || '3 min read',
            excerpt: post.excerpt,
            content: post.content,
            is_published: true
          }]);
        } catch (e) {
          console.warn('Supabase savePost failed:', e);
        }
      }

      // Update local storage
      try {
        const posts = (await this.getPosts()).filter(p => p.id !== post.id);
        posts.unshift(post);
        localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(posts));
      } catch (e) {}

      return post;
    },

    async deletePost(id) {
      if (supabaseClient) {
        try {
          await supabaseClient.from('blog_posts').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase deletePost failed:', e);
        }
      }
      try {
        const posts = (await this.getPosts()).filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(posts));
      } catch (e) {}
    },

    // --- Contact Form Messages ---
    async saveContactMessage(msg) {
      const payload = {
        ...msg,
        id: 'msg-' + Date.now(),
        created_at: new Date().toISOString()
      };

      if (supabaseClient) {
        try {
          await supabaseClient.from('contact_messages').insert([{
            name: msg.name,
            email: msg.email,
            subject: msg.subject || 'General Inquiry',
            message: msg.message,
            is_read: false
          }]);
        } catch (e) {
          console.warn('Supabase contact save failed:', e);
        }
      }

      // Also persist locally in admin inbox
      try {
        const local = localStorage.getItem(STORAGE_KEYS.messages);
        const list = local ? JSON.parse(local) : [];
        list.unshift(payload);
        localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(list));
      } catch (e) {}

      return payload;
    },

    async getContactMessages() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) return data;
        } catch (e) {}
      }

      try {
        const local = localStorage.getItem(STORAGE_KEYS.messages);
        return local ? JSON.parse(local) : [];
      } catch (e) {
        return [];
      }
    }
  };

  // ==========================================================================
  // UNIFIED AUTH INTERFACE (window.portfolioAuth)
  // ==========================================================================
  window.portfolioAuth = {
    async login(email, password) {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });
        if (error) throw error;
        return data.user;
      } else {
        // Local Demo Admin Authentication
        // Default local credentials for offline/testing mode:
        // admin@brian.dev / brian123
        if (email.trim().toLowerCase() === 'admin@brian.dev' && password === 'brian123') {
          const localUser = { email: 'admin@brian.dev', role: 'admin', id: 'local-admin-1' };
          sessionStorage.setItem('brian_admin_session', JSON.stringify(localUser));
          return localUser;
        }
        throw new Error('Invalid credentials. (Demo Mode: use admin@brian.dev / brian123)');
      }
    },

    async logout() {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      sessionStorage.removeItem('brian_admin_session');
    },

    async getCurrentUser() {
      if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session ? session.user : null;
      }
      try {
        const local = sessionStorage.getItem('brian_admin_session');
        return local ? JSON.parse(local) : null;
      } catch (e) {
        return null;
      }
    }
  };
})();
