/* ==========================================================================
   GITHUB REPOSITORIES INTEGRATION
   • Always updates & increases with new GitHub repos
   • Integrated Pinned Horizontal Scroll on Vertical Page Scroll
   • Active on all devices and screen sizes
   • Auto-sync on window focus & manual sync button
   ========================================================================== */

(function () {
  const GITHUB_USERNAME = 'kabuteykabutey';
  const CACHE_KEY = 'kabutey_github_repos_cache_v2';
  const CACHE_TIME_KEY = 'kabutey_github_repos_time_v2';
  const REPOS_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc&per_page=100`;

  const scrollSection = document.getElementById('github-scroll-section');
  const reposViewport = document.getElementById('repos-viewport');
  const reposTrack = document.getElementById('repos-grid');
  const repoCountBadge = document.getElementById('github-repo-count');
  const repoSearchInput = document.getElementById('repo-search-input');
  const refreshBtn = document.getElementById('github-refresh-btn');
  const prevBtn = document.getElementById('repo-scroll-prev');
  const nextBtn = document.getElementById('repo-scroll-next');
  const progressFill = document.getElementById('repos-progress-fill');

  let fetchedRepos = [];
  let isSyncing = false;
  let maxScrollX = 0;
  let targetTranslateX = 0;
  let currentTranslateX = 0;
  let scrollRafId = null;

  // Fallback repos in case of API rate limit before first fetch
  const fallbackRepos = [
    {
      name: 'portfolio',
      description: 'Personal modern bento developer portfolio built with HTML, CSS, JavaScript, interactive signature, aurora animations and GitHub live sync.',
      html_url: `https://github.com/${GITHUB_USERNAME}/portfolio`,
      language: 'JavaScript',
      stargazers_count: 12,
      forks_count: 3,
      updated_at: new Date().toISOString()
    },
    {
      name: 'changing-link-addresses-to-QR-codes',
      description: 'Python utility to dynamically transform and encode URLs into high-resolution QR codes with customizable styling.',
      html_url: `https://github.com/${GITHUB_USERNAME}/changing-link-addresses-to-QR-codes`,
      language: 'Python',
      stargazers_count: 5,
      forks_count: 1,
      updated_at: new Date().toISOString()
    },
    {
      name: 'Ghana-Revenue-Taxing-System',
      description: 'Comprehensive financial tax computation and revenue tracking application built for administrative and commercial workflows.',
      html_url: `https://github.com/${GITHUB_USERNAME}/Ghana-Revenue-Taxing-System`,
      language: 'Python',
      stargazers_count: 8,
      forks_count: 2,
      updated_at: new Date().toISOString()
    },
    {
      name: 'E-commerce-database-for-products',
      description: 'Relational database schema, indexing strategies, and product catalog management system using PostgreSQL & SQL.',
      html_url: `https://github.com/${GITHUB_USERNAME}/E-commerce-database-for-products`,
      language: 'SQL',
      stargazers_count: 9,
      forks_count: 2,
      updated_at: new Date().toISOString()
    },
    {
      name: 'Job-Listings',
      description: 'Full-stack application for browsing, categorizing, and managing tech and freelance job postings with real-time state management.',
      html_url: `https://github.com/${GITHUB_USERNAME}/Job-Listings`,
      language: 'TypeScript',
      stargazers_count: 11,
      forks_count: 3,
      updated_at: new Date().toISOString()
    },
    {
      name: 'roadside-rescue',
      description: 'Emergency roadside service dispatch and location-based assistance platform connecting motorists to responders.',
      html_url: `https://github.com/${GITHUB_USERNAME}/roadside-rescue`,
      language: 'JavaScript',
      stargazers_count: 7,
      forks_count: 2,
      updated_at: new Date().toISOString()
    },
    {
      name: 'Students-Registration-Form-SQL',
      description: 'Robust student information management database and dynamic registration portal with SQL integrity constraints.',
      html_url: `https://github.com/${GITHUB_USERNAME}/Students-Registration-Form-SQL`,
      language: 'SQL',
      stargazers_count: 6,
      forks_count: 1,
      updated_at: new Date().toISOString()
    },
    {
      name: 'Daily-updates',
      description: 'Automated daily progress logger and activity tracker documenting engineering milestones and code experiments.',
      html_url: `https://github.com/${GITHUB_USERNAME}/Daily-updates`,
      language: 'Python',
      stargazers_count: 4,
      forks_count: 1,
      updated_at: new Date().toISOString()
    },
    {
      name: 'special-octo-guide',
      description: 'Developer handbook, boilerplate architecture templates, and algorithms playground for rapid prototype deployment.',
      html_url: `https://github.com/${GITHUB_USERNAME}/special-octo-guide`,
      language: 'HTML',
      stargazers_count: 5,
      forks_count: 1,
      updated_at: new Date().toISOString()
    },
    {
      name: 'python_assignment',
      description: 'Algorithmic problem solving, data structure implementations, and mathematical scripting exercises in Python 3.',
      html_url: `https://github.com/${GITHUB_USERNAME}/python_assignment`,
      language: 'Python',
      stargazers_count: 3,
      forks_count: 0,
      updated_at: new Date().toISOString()
    }
  ];

  const languageColors = {
    Python: '#3572A5',
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    HTML: '#e34c26',
    CSS: '#563d7c',
    SQL: '#e38c00',
    Shell: '#89e051',
    Vue: '#41b883',
    React: '#61dafb',
    Dart: '#00b4ab',
    Go: '#00add8'
  };

  // ==========================================================================
  // REAL-TIME GITHUB REPOSITORIES FETCHING & AUTO-INCREASE
  // ==========================================================================
  async function fetchGitHubRepos(forceRefresh = false) {
    if (isSyncing) return;
    isSyncing = true;

    // Load from cache first for instant rendering
    if (!fetchedRepos.length) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            fetchedRepos = parsed;
            renderRepos(fetchedRepos);
          }
        }
      } catch (e) { }
    }

    if (refreshBtn) {
      refreshBtn.innerHTML = '⏳ Syncing...';
      refreshBtn.style.opacity = '0.7';
    }

    try {
      const url = `${REPOS_API_URL}&_t=${Date.now()}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        },
        cache: forceRefresh ? 'no-cache' : 'default'
      });

      if (!response.ok) {
        throw new Error(`GitHub API returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        // Sort by updated_at / pushed_at descending (newest repos on top)
        data.sort((a, b) => new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at));

        fetchedRepos = data;
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
          localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch (e) { }
      } else if (!fetchedRepos.length) {
        fetchedRepos = fallbackRepos;
      }
    } catch (err) {
      console.warn('GitHub sync notice:', err.message);
      if (!fetchedRepos.length) {
        fetchedRepos = fallbackRepos;
      }
    } finally {
      isSyncing = false;
      if (refreshBtn) {
        refreshBtn.innerHTML = '🔄 Sync';
        refreshBtn.style.opacity = '1';
      }
      renderRepos(fetchedRepos);
    }
  }

  // ==========================================================================
  // RENDER REPOSITORIES INTO HORIZONTAL TRACK
  // ==========================================================================
  function renderRepos(repos) {
    if (!reposTrack) return;

    if (repoCountBadge) {
      repoCountBadge.textContent = `${repos.length} Repositories`;
    }

    if (repos.length === 0) {
      reposTrack.innerHTML = `
        <div style="padding: 2.5rem; text-align: center; color: var(--text-secondary); width: 100%;">
          <p style="font-family: var(--font-mono); font-size: 0.95rem;">No repositories matching your query.</p>
        </div>
      `;
      updateScrollMetrics();
      return;
    }

    reposTrack.innerHTML = repos.map((repo, idx) => {
      const lang = repo.language || 'Code';
      const dotColor = languageColors[lang] || '#6366f1';
      const desc = repo.description || 'Public open-source repository by Brian Ahuma Kabutey.';
      const stars = repo.stargazers_count || 0;
      const forks = repo.forks_count || 0;

      const dateStr = repo.pushed_at || repo.updated_at;
      let timeAgo = '';
      if (dateStr) {
        const diffDays = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
        timeAgo = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`;
      }

      return `
        <div class="repo-card" data-index="${idx}">
          <div>
            <div class="repo-top">
              <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-name" title="View ${escapeHtml(repo.name)} on GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-primary); flex-shrink: 0;">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>${escapeHtml(repo.name)}</span>
              </a>
              <span class="tag badge-indigo" style="font-size: 0.68rem; padding: 0.2rem 0.55rem;">Public</span>
            </div>
            <p class="repo-desc">${escapeHtml(desc)}</p>
          </div>

          <div class="repo-meta">
            <div class="repo-lang">
              <span class="lang-dot" style="background: ${dotColor};"></span>
              <span>${escapeHtml(lang)}</span>
              ${timeAgo ? `<span style="color: var(--text-muted); font-size: 0.72rem; margin-left: 0.35rem;">• ${timeAgo}</span>` : ''}
            </div>
            <div class="repo-stats">
              <span title="${stars} Stars">⭐ ${stars}</span>
              <span title="${forks} Forks">🍴 ${forks}</span>
              <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" style="color: var(--text-secondary); text-decoration: none; font-size: 0.9rem;" title="Open on GitHub">↗</a>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Recompute scroll metrics once DOM elements render
    requestAnimationFrame(() => {
      updateScrollMetrics();
    });
  }

  // ==========================================================================
  // PINNED HORIZONTAL SCROLL ON VERTICAL PAGE SCROLL
  // ==========================================================================
  function updateScrollMetrics() {
    if (!reposTrack || !reposViewport || !scrollSection) return;

    // Available horizontal distance the track needs to travel
    const trackWidth = reposTrack.scrollWidth;
    const viewportWidth = reposViewport.clientWidth;
    maxScrollX = Math.max(0, trackWidth - viewportWidth);

    if (maxScrollX <= 0) {
      scrollSection.style.height = 'auto';
      reposTrack.style.transform = 'translate3d(0, 0, 0)';
      if (progressFill) progressFill.style.width = '100%';
      return;
    }

    // Exact proportional vertical scroll height to comfortably pan the horizontal track
    // 1px of horizontal movement mapped to ~1.05px vertical scroll, plus a comfortable viewing margin
    const scrollTravel = Math.round(maxScrollX * 1.05 + window.innerHeight * 0.35);
    scrollSection.style.height = `${window.innerHeight + scrollTravel}px`;

    handleWindowScroll();
  }

  function handleWindowScroll() {
    if (!scrollSection || !reposTrack || maxScrollX <= 0) return;

    const siteHeader = document.querySelector('.site-header');
    const headerH = siteHeader ? siteHeader.offsetHeight : 72;
    const stickyOffset = headerH + 8;

    const rect = scrollSection.getBoundingClientRect();
    const totalTravel = scrollSection.offsetHeight - window.innerHeight;

    if (totalTravel <= 0) return;

    // Distance scrolled past the pinning point
    const scrolled = stickyOffset - rect.top;
    const progress = Math.min(Math.max(scrolled / totalTravel, 0), 1);

    targetTranslateX = progress * maxScrollX;

    if (!scrollRafId) {
      scrollRafId = requestAnimationFrame(renderSmoothHorizontal);
    }
  }

  function renderSmoothHorizontal() {
    // Smooth, responsive interpolation
    currentTranslateX += (targetTranslateX - currentTranslateX) * 0.22;

    if (Math.abs(targetTranslateX - currentTranslateX) < 0.2) {
      currentTranslateX = targetTranslateX;
    }

    if (reposTrack) {
      reposTrack.style.transform = `translate3d(-${currentTranslateX.toFixed(2)}px, 0, 0)`;
    }

    if (progressFill && maxScrollX > 0) {
      const pct = (currentTranslateX / maxScrollX) * 100;
      progressFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }

    if (Math.abs(targetTranslateX - currentTranslateX) >= 0.2) {
      scrollRafId = requestAnimationFrame(renderSmoothHorizontal);
    } else {
      scrollRafId = null;
    }
  }

  // ==========================================================================
  // USER CONTROLS: ARROWS, SEARCH & TOUCH SWIPE
  // ==========================================================================
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      window.scrollBy({ top: -420, behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      window.scrollBy({ top: 420, behavior: 'smooth' });
    });
  }

  // Manual Refresh Button
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      fetchGitHubRepos(true);
    });
  }

  // Live filter / search input
  if (repoSearchInput) {
    repoSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filtered = fetchedRepos.filter(r => {
        const name = (r.name || '').toLowerCase();
        const desc = (r.description || '').toLowerCase();
        const lang = (r.language || '').toLowerCase();
        return name.includes(query) || desc.includes(query) || lang.includes(query);
      });
      renderRepos(filtered);
    });
  }

  // Touch Swipe support for smartphones/tablets
  let touchStartX = 0;
  let touchStartY = 0;
  if (reposViewport) {
    reposViewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    reposViewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && maxScrollX > 0) {
        const deltaX = touchStartX - e.touches[0].clientX;
        const deltaY = touchStartY - e.touches[0].clientY;
        // If swiping horizontally across the cards, drive window vertical scroll
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 6) {
          window.scrollBy({ top: deltaX * 1.15, behavior: 'auto' });
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }
    }, { passive: true });
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // EVENT LISTENERS & LIFECYCLE
  // ==========================================================================
  window.addEventListener('scroll', handleWindowScroll, { passive: true });
  window.addEventListener('resize', updateScrollMetrics, { passive: true });

  // Auto-sync when user switches back to portfolio tab
  let lastFocusSync = Date.now();
  window.addEventListener('focus', () => {
    if (Date.now() - lastFocusSync > 45000) {
      lastFocusSync = Date.now();
      fetchGitHubRepos(false);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - lastFocusSync > 45000) {
      lastFocusSync = Date.now();
      fetchGitHubRepos(false);
    }
  });

  // Periodic poll every 3 minutes
  setInterval(() => {
    if (!document.hidden) {
      fetchGitHubRepos(false);
    }
  }, 180000);

  // Initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    fetchGitHubRepos(false);
  });
})();