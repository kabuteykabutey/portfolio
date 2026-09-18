/* ==========================================================================
   GUESTBOOK & FREE-HAND SIGNATURE PAD (HTML5 CANVAS)
   ========================================================================== */

(function () {
  const STORAGE_KEY = 'brian_portfolio_guestbook';

  // DOM Elements
  const canvas = document.getElementById('signature-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const clearBtn = document.getElementById('clear-signature-btn');
  const stampBtn = document.getElementById('stamp-signature-btn');
  const guestNameInput = document.getElementById('guest-name');
  const guestRoleInput = document.getElementById('guest-role');
  const colorOptions = document.querySelectorAll('.color-option');
  const feedContainer = document.getElementById('signatures-feed');
  const totalSignaturesCount = document.getElementById('total-signatures-count');

  // Signature State
  let isDrawing = false;
  let currentColor = '#f4f4f6';
  let currentLineWidth = 3.5;
  let hasDrawn = false;
  let lastX = 0;
  let lastY = 0;

  // Initialize Canvas DPI & Size
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Save previous canvas content if exists
    let tempCanvas = null;
    if (canvas.width > 0 && canvas.height > 0) {
      tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCanvas.getContext('2d').drawImage(canvas, 0, 0);
    }

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Reconfigure stroke properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentLineWidth;

    // Restore previous drawing if resizing
    if (tempCanvas) {
      ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
    }
  }

  // Get Coordinates based on Mouse / Touch Event
  function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  // Drawing Handlers
  function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    hasDrawn = true;
    const coords = getCoordinates(e);
    lastX = coords.x;
    lastY = coords.y;

    ctx.beginPath();
    ctx.arc(lastX, lastY, currentLineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = currentColor;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentLineWidth;
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastX = coords.x;
    lastY = coords.y;
  }

  function stopDrawing(e) {
    if (!isDrawing) return;
    e.preventDefault();
    isDrawing = false;
    ctx.closePath();
  }

  // Clear Canvas
  function clearCanvas() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    hasDrawn = false;
    if (window.showToast) {
      window.showToast('Canvas cleared!', 'info');
    }
  }

  // Color selection
  colorOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      colorOptions.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = btn.getAttribute('data-color') || '#f4f4f6';
    });
  });

  // Attach Canvas Listeners
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing, { passive: false });

  if (clearBtn) {
    clearBtn.addEventListener('click', clearCanvas);
  }

  // Sample Signatures for Initial Presentation
  function getSampleSignatures() {
    return [
      {
        id: 'sample-1',
        name: 'Alex Rivera',
        role: 'Tech Lead @ DevLab',
        date: '2 hours ago',
        // Minimal stylized SVG signature encoded
        signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60"><path d="M15,42 Q40,10 70,30 T110,25 Q135,15 165,35" fill="none" stroke="%23121212" stroke-width="3" stroke-linecap="round"/><path d="M60,20 L130,45" fill="none" stroke="%23ff3366" stroke-width="2.5" stroke-linecap="round"/></svg>'
      },
      {
        id: 'sample-2',
        name: 'Sarah Chen',
        role: 'AI Researcher & Founder',
        date: 'Yesterday',
        signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60"><path d="M20,30 C50,5 60,55 90,20 C120,5 140,50 160,28" fill="none" stroke="%232563eb" stroke-width="3.5" stroke-linecap="round"/><circle cx="168" cy="28" r="3" fill="%232563eb"/></svg>'
      },
      {
        id: 'sample-3',
        name: 'Kofi Mensah',
        role: 'Full Stack Engineer',
        date: '3 days ago',
        signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60"><path d="M25,48 L50,15 L75,48 L100,20 L155,30" fill="none" stroke="%238b5cf6" stroke-width="3" stroke-linecap="round"/></svg>'
      }
    ];
  }

  // Load Saved Signatures
  async function loadSignatures() {
    if (window.portfolioDB) {
      try {
        const dbSigs = await window.portfolioDB.getSignatures();
        if (dbSigs && dbSigs.length > 0) return dbSigs;
      } catch (e) { }
    }
    let saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      const initial = getSampleSignatures();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(saved);
    } catch (e) {
      return getSampleSignatures();
    }
  }

  // Render Signatures
  async function renderSignatures() {
    const list = await loadSignatures();
    if (totalSignaturesCount) {
      totalSignaturesCount.textContent = `${list.length} Signatures`;
    }

    if (!feedContainer) return;

    if (list.length === 0) {
      feedContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; font-family: var(--font-mono);">
          <p>No signatures yet. Be the first to leave your mark!</p>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = list.map(item => `
      <div class="guest-card">
        <div class="guest-meta">
          <div class="guest-meta-name">${escapeHtml(item.name)}</div>
          ${item.role ? `<div class="guest-meta-note">"${escapeHtml(item.role)}"</div>` : ''}
          <div class="guest-meta-time">Signed ${escapeHtml(item.date)}</div>
        </div>
        <div class="guest-signature-preview">
          <img src="${item.signature}" alt="Signature of ${escapeHtml(item.name)}" loading="lazy" />
        </div>
      </div>
    `).join('');
  }

  // Save Signature
  async function handleStampSignature() {
    const name = guestNameInput ? guestNameInput.value.trim() : '';
    const role = guestRoleInput ? guestRoleInput.value.trim() : '';

    if (!name) {
      if (window.showToast) {
        window.showToast('Please enter your name!', 'error');
      } else {
        alert('Please enter your name!');
      }
      guestNameInput.focus();
      return;
    }

    if (!hasDrawn) {
      if (window.showToast) {
        window.showToast('Please draw your signature first!', 'error');
      } else {
        alert('Please draw your signature first!');
      }
      return;
    }

    // Export canvas as PNG data URL
    const signatureDataUrl = canvas.toDataURL('image/png');

    const newEntry = {
      name: name,
      role: role || 'Visitor',
      date: 'Just now',
      signature: signatureDataUrl
    };

    if (stampBtn) {
      stampBtn.disabled = true;
      stampBtn.innerHTML = '⚡ Stamping...';
    }

    if (window.portfolioDB) {
      await window.portfolioDB.saveSignature(newEntry);
    } else {
      const currentList = await loadSignatures();
      currentList.unshift(newEntry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));
    }

    // Reset Form & Canvas
    clearCanvas();
    if (guestNameInput) guestNameInput.value = '';
    if (guestRoleInput) guestRoleInput.value = '';

    if (stampBtn) {
      stampBtn.disabled = false;
      stampBtn.innerHTML = 'Stamp Signature into Guestbook';
    }

    await renderSignatures();

    if (window.showToast) {
      window.showToast('🎉 Signature stamped into the Guestbook!', 'success');
    }
  }

  if (stampBtn) {
    stampBtn.addEventListener('click', handleStampSignature);
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialization
  window.addEventListener('resize', resizeCanvas);
  setTimeout(() => {
    resizeCanvas();
    renderSignatures();
  }, 100);

})();