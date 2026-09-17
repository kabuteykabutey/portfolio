/* ==========================================================================
   MAIN APPLICATION CONTROLLER & USER INTERACTIONS
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
  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.25s ease-out';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => {
      toast.remove();
    }, 250);
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
  // Mobile Navigation Toggle
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navLinks = document.getElementById('nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      mobileToggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
    });

    // Close menu when clicking link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileToggle.textContent = '☰';
      });
    });
  }

  // Active Navigation Link Highlighting on Scroll
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

  // Contact Form Submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Spam Bot Honeypot Check
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

      // Email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        window.showToast('Please enter a valid email address!', 'error');
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⚡ TRANSMITTING...';

      const payload = {
        name,
        email,
        subject: subject || 'Portfolio Contact Inquiry',
        message
      };

      try {
        // 1. Save to Database / Admin Inbox
        if (window.portfolioDB) {
          await window.portfolioDB.saveContactMessage(payload);
        }

        // 2. Transmit to external endpoint (Formspree/Resend/Webhook) if configured
        if (window.CONTACT_ENDPOINT) {
          await fetch(window.CONTACT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        window.showToast(`🔥 Thanks ${name}! Brian received your message and will respond shortly.`, 'success');
        contactForm.reset();
      } catch (err) {
        window.showToast('Message saved to inbox! Brian will contact you shortly.', 'info');
        contactForm.reset();
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Copy Email to Clipboard Feature
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

  // Back to Top Button
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Marquee pause on hover
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
  // BRIAN.DEV INTERACTIVE REACTIVE LOGO
  // ==========================================================================
  const siteLogo = document.getElementById('site-logo') || document.querySelector('.logo-stamp');
  if (siteLogo) {
    const logoThemes = [
      'linear-gradient(135deg, #c28b00 0%, #0c7c8c 50%, #9b2242 100%)', // Rich Amber, Teal, Berry
      'linear-gradient(135deg, #7928ca 0%, #ff0080 50%, #ff4d4d 100%)', // Synthwave Magenta & Crimson
      'linear-gradient(135deg, #059669 0%, #0284c7 50%, #6366f1 100%)', // Emerald, Cyan & Indigo
      'linear-gradient(135deg, #ea580c 0%, #eab308 50%, #10b981 100%)', // Radiant Sunset & Mint
      'linear-gradient(135deg, #0284c7 0%, #8b5cf6 50%, #ec4899 100%)'  // Electric Sky, Violet & Pink
    ];
    let currentThemeIdx = 0;

    function triggerLogoReaction(e) {
      if (e) e.preventDefault();

      // Haptic feedback on supported mobile devices
      if ('vibrate' in navigator) {
        try { navigator.vibrate([18, 30, 22]); } catch (err) {}
      }

      // Smooth scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Re-trigger bounce pop animation
      siteLogo.classList.remove('logo-reacting');
      void siteLogo.offsetWidth; // Force reflow
      siteLogo.classList.add('logo-reacting');

      // Cycle background gradient theme
      currentThemeIdx = (currentThemeIdx + 1) % logoThemes.length;
      siteLogo.style.background = logoThemes[currentThemeIdx];
      siteLogo.style.backgroundSize = '200% 200%';

      // Spawn colorful spark particles around the logo
      const rect = siteLogo.getBoundingClientRect();
      const clickX = e && e.clientX ? e.clientX - rect.left : rect.width / 2;
      const clickY = e && e.clientY ? e.clientY - rect.top : rect.height / 2;
      
      const sparkChars = ['✦', '★', '⚡', '●', '▲', '✨'];
      const sparkColors = ['#facc15', '#00f0ff', '#ff3366', '#22c55e', '#a855f7'];

      for (let i = 0; i < 6; i++) {
        const spark = document.createElement('span');
        spark.className = 'logo-sparkle';
        spark.textContent = sparkChars[i % sparkChars.length];
        spark.style.color = sparkColors[i % sparkColors.length];
        spark.style.left = `${clickX}px`;
        spark.style.top = `${clickY}px`;

        const angle = (i / 6) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
        const distance = 30 + Math.random() * 35;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - 10;
        const rot = (Math.random() * 180 - 90) + 'deg';

        spark.style.setProperty('--spark-tx', `${tx}px`);
        spark.style.setProperty('--spark-ty', `${ty}px`);
        spark.style.setProperty('--spark-rot', rot);

        siteLogo.appendChild(spark);
        setTimeout(() => spark.remove(), 750);
      }

      setTimeout(() => {
        siteLogo.classList.remove('logo-reacting');
      }, 500);
    }

    siteLogo.addEventListener('click', triggerLogoReaction);
  }

  // ==========================================================================
  // UNIVERSAL TACTILE BUTTON TAP & PRESS FEEDBACK
  // ==========================================================================
  const buttonSelector = [
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

    // Haptic tick on touch devices
    if (e.pointerType === 'touch' && 'vibrate' in navigator) {
      try { navigator.vibrate(12); } catch (err) {}
    }

    const removePress = () => {
      setTimeout(() => {
        targetBtn.classList.remove('btn-pressed');
      }, 120);
      window.removeEventListener('pointerup', removePress);
      window.removeEventListener('pointercancel', removePress);
    };

    window.addEventListener('pointerup', removePress, { once: true });
    window.addEventListener('pointercancel', removePress, { once: true });
  }, { passive: true });
});
