/* ==========================================================================
   MAIN APPLICATION CONTROLLER & USER INTERACTIONS
   Minimalist + Modern + Bento Grid Animations
   ========================================================================== */

// Global Toast Notification System
window.showToast = function (message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `neo-toast ${type}`;

  const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : '⚡';
  toast.innerHTML = `<span style="font-size: 1.1rem;">${icon}</span><span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px) scale(0.95)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
};

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // SCROLL REVEAL (SUBTLE ANIMATIONS)
  // ==========================================================================
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('revealed'));
  }

  // ==========================================================================
  // MOBILE NAVIGATION DRAWER TOGGLE
  // ==========================================================================
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navLinks = document.getElementById('nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('active');
      mobileToggle.textContent = isOpen ? '✕' : '☰';
      mobileToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close menu when clicking any nav link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileToggle.textContent = '☰';
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close if clicked outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !mobileToggle.contains(e.target) && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        mobileToggle.textContent = '☰';
      }
    });
  }

  // ==========================================================================
  // ACTIVE NAVIGATION LINK HIGHLIGHTING ON SCROLL
  // ==========================================================================
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navItems = document.querySelectorAll('.nav-link');

  function updateActiveNav() {
    const scrollY = window.pageYOffset;

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navItems.forEach(item => {
          item.classList.remove('active');
          if (item.getAttribute('href') === `#${sectionId}`) {
            item.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  // ==========================================================================
  // CONTACT FORM SUBMISSION & SPAM PROTECTION
  // ==========================================================================
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Honeypot spam check
      const honey = document.getElementById('contact-honey');
      if (honey && honey.value) {
        contactForm.reset();
        window.showToast('Message sent!', 'success');
        return;
      }

      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const subject = document.getElementById('contact-subject').value.trim();
      const message = document.getElementById('contact-message').value.trim();

      if (!name || !email || !message) {
        window.showToast('Please fill out all required contact fields!', 'error');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        window.showToast('Please enter a valid email address!', 'error');
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⚡ Sending...';

      const payload = {
        name,
        email,
        subject: subject || 'Portfolio Contact Inquiry',
        message
      };

      try {
        // 1. Save to Supabase Cloud Database
        if (window.portfolioDB) {
          await window.portfolioDB.saveContactMessage(payload);
        }

        // 2. Transmit to external endpoint if configured
        if (window.CONTACT_ENDPOINT) {
          await fetch(window.CONTACT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        window.showToast(`✨ Thanks ${name}! Brian received your message and will respond promptly.`, 'success');
        contactForm.reset();
      } catch (err) {
        window.showToast('Message saved! Brian will contact you shortly.', 'info');
        contactForm.reset();
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // ==========================================================================
  // COPY EMAIL TO CLIPBOARD
  // ==========================================================================
  const copyEmailBtns = document.querySelectorAll('.copy-email-btn');
  copyEmailBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = 'briankabutey10@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        window.showToast(`📋 Copied "${email}" to clipboard!`, 'success');
      }).catch(() => {
        window.showToast(`Email: ${email}`, 'info');
      });
    });
  });

  // ==========================================================================
  // BACK TO TOP
  // ==========================================================================
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // ==========================================================================
  // MARQUEE PAUSE ON HOVER
  // ==========================================================================
  const marquee = document.querySelector('.marquee-content');
  if (marquee) {
    marquee.addEventListener('mouseenter', () => {
      marquee.style.animationPlayState = 'paused';
    });
    marquee.addEventListener('mouseleave', () => {
      marquee.style.animationPlayState = 'running';
    });
  }

  // ==========================================================================
  // MODERN INTERACTIVE LOGO (BRIAN.DEV)
  // ==========================================================================
  const siteLogo = document.getElementById('site-logo') || document.querySelector('.logo-stamp');
  if (siteLogo) {
    const dotColors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];
    let colorIdx = 0;

    siteLogo.addEventListener('click', (e) => {
      e.preventDefault();

      if ('vibrate' in navigator) {
        try { navigator.vibrate(15); } catch (err) { }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Cycle dot accent color
      colorIdx = (colorIdx + 1) % dotColors.length;
      const logoDot = siteLogo.querySelector('.logo-dot');
      if (logoDot) {
        logoDot.style.color = dotColors[colorIdx];
        logoDot.style.textShadow = `0 0 12px ${dotColors[colorIdx]}`;
        setTimeout(() => {
          if (logoDot) logoDot.style.textShadow = 'none';
        }, 600);
      }
    });
  }

  // ==========================================================================
  // UNIVERSAL MODERN TACTILE PRESS FEEDBACK
  // ==========================================================================
  const buttonSelector = [
    '.btn',
    '.neo-btn',
    'button',
    '.social-pill',
    '.footer-social-btn',
    '.filter-btn',
    '.mobile-toggle',
    '.back-to-top',
    '.modal-close-btn',
    '.read-btn',
    '.color-option',
    '.nav-link',
    '.copy-email-btn'
  ].join(', ');

  document.addEventListener('pointerdown', (e) => {
    const targetBtn = e.target.closest(buttonSelector);
    if (!targetBtn) return;

    targetBtn.classList.add('btn-pressed');

    if (e.pointerType === 'touch' && 'vibrate' in navigator) {
      try { navigator.vibrate(10); } catch (err) { }
    }

    const removePress = () => {
      setTimeout(() => {
        targetBtn.classList.remove('btn-pressed');
      }, 100);
      window.removeEventListener('pointerup', removePress);
      window.removeEventListener('pointercancel', removePress);
    };

    window.addEventListener('pointerup', removePress, { once: true });
    window.addEventListener('pointercancel', removePress, { once: true });
  }, { passive: true });
});
// ==========================================================================
// AURORA MOUSE PARALLAX & DYNAMIC INTERACTIVE PARTICLES
// ==========================================================================
(function initAuroraAndInteractivity() {
  const auroraElements = document.querySelectorAll('.aurora');
  const cursorGlow = document.getElementById('cursor-glow');
  const particleCanvas = document.getElementById('aurora-particles');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let glowX = mouseX;
  let glowY = mouseY;
  let targetAuroraX = 0;
  let targetAuroraY = 0;
  let currentAuroraX = 0;
  let currentAuroraY = 0;
  let animFrameId = null;

  // Track global mouse position
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (cursorGlow && !cursorGlow.classList.contains('active')) {
      cursorGlow.classList.add('active');
    }

    targetAuroraX = (e.clientX / window.innerWidth - 0.5) * 55;
    targetAuroraY = (e.clientY / window.innerHeight - 0.5) * 55;

    if (!animFrameId) {
      animFrameId = requestAnimationFrame(updateInteractiveLoop);
    }
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    if (cursorGlow) {
      cursorGlow.classList.remove('active');
    }
  });

  function updateInteractiveLoop() {
    // 1. Smooth Aurora Parallax
    currentAuroraX += (targetAuroraX - currentAuroraX) * 0.08;
    currentAuroraY += (targetAuroraY - currentAuroraY) * 0.08;

    auroraElements.forEach((el, index) => {
      const factor = (index + 1) * 0.6;
      el.style.setProperty('--mx', `${(currentAuroraX * factor).toFixed(2)}px`);
      el.style.setProperty('--my', `${(currentAuroraY * factor).toFixed(2)}px`);
    });

    // 2. Smooth Cursor Glow Trailing
    if (cursorGlow && window.innerWidth > 991) {
      glowX += (mouseX - glowX) * 0.18;
      glowY += (mouseY - glowY) * 0.18;
      cursorGlow.style.transform = `translate3d(${glowX.toFixed(1)}px, ${glowY.toFixed(1)}px, 0)`;
    }

    // Keep loop going if still moving towards target
    const diff = Math.abs(targetAuroraX - currentAuroraX) + Math.abs(targetAuroraY - currentAuroraY);
    const glowDiff = Math.abs(mouseX - glowX) + Math.abs(mouseY - glowY);

    if (diff > 0.05 || glowDiff > 0.5) {
      animFrameId = requestAnimationFrame(updateInteractiveLoop);
    } else {
      animFrameId = null;
    }
  }

  // ==========================================================================
  // CARD SPOTLIGHT & 3D PERSPECTIVE TILT
  // ==========================================================================
  const interactiveCards = document.querySelectorAll(
    '.bento-card, .project-card, .repo-card, .blog-card, .signature-pad-card, .hero-main-card'
  );

  interactiveCards.forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Radial spotlight coordinates
      card.style.setProperty('--card-x', `${x.toFixed(1)}px`);
      card.style.setProperty('--card-y', `${y.toFixed(1)}px`);

      // 3D Tilt on non-touch devices
      if (e.pointerType !== 'touch' && window.innerWidth > 991) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (((y - centerY) / centerY) * -6).toFixed(2);
        const rotateY = (((x - centerX) / centerX) * 6).toFixed(2);

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-7px) scale3d(1.015, 1.015, 1.015)`;
      }
    }, { passive: true });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
      card.style.setProperty('--card-x', '-999px');
      card.style.setProperty('--card-y', '-999px');
    });
  });

  // ==========================================================================
  // MAGNETIC BUTTONS EFFECT
  // ==========================================================================
  if (window.innerWidth > 991) {
    const magneticBtns = document.querySelectorAll('.btn-primary, .btn-outline, .repo-arrow-btn, .logo-stamp');

    magneticBtns.forEach(btn => {
      btn.addEventListener('pointermove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate3d(${(x * 0.22).toFixed(1)}px, ${(y * 0.22).toFixed(1)}px, 0)`;
      }, { passive: true });

      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // ==========================================================================
  // AMBIENT COSMIC STARFIELD PARTICLES
  // ==========================================================================
  if (particleCanvas) {
    const ctx = particleCanvas.getContext('2d');
    let width = (particleCanvas.width = window.innerWidth);
    let height = (particleCanvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = particleCanvas.width = window.innerWidth;
      height = particleCanvas.height = window.innerHeight;
    }, { passive: true });

    const numParticles = Math.min(65, Math.floor(window.innerWidth / 22));
    const particles = [];
    const colors = ['#6366f1', '#a855f7', '#06b6d4', '#ffffff', '#ec4899'];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.8 + 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.65 + 0.2,
        baseAlpha: Math.random() * 0.65 + 0.2,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        pulseSpeed: Math.random() * 0.02 + 0.005
      });
    }

    function renderParticles() {
      if (document.hidden) {
        requestAnimationFrame(renderParticles);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Pulse alpha
        p.alpha = p.baseAlpha + Math.sin(Date.now() * p.pulseSpeed) * 0.25;

        // Cursor proximity reaction
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          const force = (130 - dist) / 130;
          p.x -= (dx / dist) * force * 1.5;
          p.y -= (dy / dist) * force * 1.5;
          p.alpha = Math.min(1, p.alpha + force * 0.5);
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.1, p.alpha);
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();

        // Connect nearby particles with subtle faint constellation threads
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distP = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (distP < 85) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#818cf8';
            ctx.globalAlpha = (1 - distP / 85) * 0.12;
            ctx.stroke();
          }
        }
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      requestAnimationFrame(renderParticles);
    }

    renderParticles();
  }
})();