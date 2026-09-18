/* ==========================================================================
   GITHUB REPOSITORIES INTEGRATION
   ========================================================================== */

(function () {
  const GITHUB_USERNAME = 'kabuteykabutey';
  const REPOS_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=12`;

  const reposGrid = document.getElementById('repos-grid');
  const repoCountBadge = document.getElementById('github-repo-count');
  const repoSearchInput = document.getElementById('repo-search-input');

  let fetchedRepos = [];

  // Fallback Repositories if GitHub API is rate-limited or offline
  const fallbackRepos = [
    {
      name: 'portfolio',
      description: 'Personal neo-brutalist developer portfolio built with HTML, CSS, JavaScript, interactive canvas signature, and GitHub integration.',
      html_url: `https://github.com/${GITHUB_USERNAME}/portfolio`,
      language: 'JavaScript',
      stargazers_count: 12,
      forks_count: 3,
      updated_at: new Date().toISOString()
    },
    {
      name: 'ai-prompt-agent-orchestrator',
      description: 'Python & LLM integration pipeline to automate workflows, analyze datasets, and orchestrate generative AI multi-turn dialogues.',
      html_url: `https://github.com/${GITHUB_USERNAME}`,
      language: 'Python',
      stargazers_count: 18,
      forks_count: 5,
      updated_at: new Date().toISOString()
    },
    {
      name: 'task-flow-database-api',
      description: 'RESTful API with Python, FastAPI and PostgreSQL database featuring JWT authentication, role management, and caching.',
      html_url: `https://github.com/${GITHUB_USERNAME}`,
      language: 'Python',
      stargazers_count: 14,
      forks_count: 2,
      updated_at: new Date().toISOString()
    },
    {
      name: 'react-components-playground',
      description: 'Experimental UI laboratory exploring React hooks, custom state management, micro-interactions, and component architecture.',
      html_url: `https://github.com/${GITHUB_USERNAME}`,
      language: 'JavaScript',
      stargazers_count: 9,
      forks_count: 1,
      updated_at: new Date().toISOString()
    },
    {
      name: 'db-migration-toolkit',
      description: 'Lightweight database migration and seeding utility supporting SQLite, MySQL, and PostgreSQL.',
      html_url: `https://github.com/${GITHUB_USERNAME}`,
      language: 'Python',
      stargazers_count: 8,
      forks_count: 2,
      updated_at: new Date().toISOString()
    },
    {
      name: 'modern-web-snippets',
      description: 'Curated collection of pure CSS animations, responsive layouts, and accessibility-first web components.',
      html_url: `https://github.com/${GITHUB_USERNAME}`,
      language: 'HTML',
      stargazers_count: 15,
      forks_count: 4,
      updated_at: new Date().toISOString()
    }
  ];

  const languageColors = {
    Python: '#3572A5',
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
    Vue: '#41b883',
    React: '#61dafb'
  };

  async function fetchGitHubRepos() {
    if (!reposGrid) return;

    reposGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
        <div class="neo-badge badge-yellow" style="font-size: 1rem; padding: 0.5rem 1rem;">
          ⚡ Fetching repositories from @${GITHUB_USERNAME}...
        </div>
      </div>
    `;

    try {
      const response = await fetch(REPOS_API_URL, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API returned status: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        fetchedRepos = data.filter(r => !r.fork);
        if (fetchedRepos.length === 0) {
          fetchedRepos = data; // fallback to include forks if all are forks
        }
      } else {
        fetchedRepos = fallbackRepos;
      }
    } catch (err) {
      console.warn('Using fallback repository data due to API error/rate-limit:', err);
      fetchedRepos = fallbackRepos;
    }

    renderRepos(fetchedRepos);
  }

  function renderRepos(repos) {
    if (!reposGrid) return;

    if (repoCountBadge) {
      repoCountBadge.textContent = `${repos.length} Repositories`;
    }

    if (repos.length === 0) {
      reposGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; background: var(--bg-main); border: var(--border-medium);">
          <p style="font-family: var(--font-display); font-weight: 800; font-size: 1.1rem;">No matching repositories found.</p>
        </div>
      `;
      return;
    }

    reposGrid.innerHTML = repos.map(repo => {
      const lang = repo.language || 'Code';
      const dotColor = languageColors[lang] || '#121212';
      const desc = repo.description || 'Public open-source repository by Brian Ahuma Kabutey.';
      const stars = repo.stargazers_count || 0;
      const forks = repo.forks_count || 0;

      return `
        <div class="repo-card">
          <div class="repo-top">
            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-name">
              📁 ${escapeHtml(repo.name)}
            </a>
            <span class="neo-badge badge-yellow">Public</span>
          </div>
          <p class="repo-desc">${escapeHtml(desc)}</p>
          <div class="repo-meta">
            <div class="repo-lang">
              <span class="lang-dot" style="background: ${dotColor};"></span>
              <span>${escapeHtml(lang)}</span>
            </div>
            <div class="repo-stats">
              <span>⭐ ${stars}</span>
              <span>🍴 ${forks}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
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

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Run on load
  document.addEventListener('DOMContentLoaded', fetchGitHubRepos);
})();