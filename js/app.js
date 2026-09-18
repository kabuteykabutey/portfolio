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
        try { navigator.vibrate(15); } catch (err) {}
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
      try { navigator.vibrate(10); } catch (err) {}
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
