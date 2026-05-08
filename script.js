/* ============================================================
   YAHYA TOURS — script.js  |  Shared across all pages
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initThemeToggle();
  initScrollReveal();
  initParticles();
  if (document.getElementById('contactForm')) initContactForm();
  if (document.querySelector('.faq-item'))    initFAQ();
  if (document.getElementById('ratingBars')) animateRatingBars();
  if (document.getElementById('hero'))        heroLoad();
});

/* ── Hero zoom on load ── */
function heroLoad() {
  setTimeout(() => document.getElementById('hero').classList.add('loaded'), 100);
}

/* ── Navbar ── */
function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!navbar) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('mobile-open');
      document.body.style.overflow = navLinks.classList.contains('mobile-open') ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('mobile-open');
        document.body.style.overflow = '';
      });
    });
  }

  const page = location.pathname.split('/').pop() || 'index.html';
  if (navLinks) {
    navLinks.querySelectorAll('a[data-page]').forEach(a => {
      if (a.dataset.page === page) a.classList.add('active');
    });
  }
}

/* ── Scroll Reveal ── */
function initScrollReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal'));
      const delay    = siblings.indexOf(entry.target) * 85;
      setTimeout(() => entry.target.classList.add('visible'), delay);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ── Gold Particle Canvas ── */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  let W, H, rafId, paused = false;

  function resize() {
    // Use devicePixelRatio capped at 1.5 to avoid overdraw on HiDPI
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', debounce(resize, 300), { passive: true });

  // Pause when tab is not visible
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused && !rafId) loop();
  });

  const GOLD = '#C9A84C', TAN = '#907659';

  class Particle {
    constructor() { this.init(true); }
    init(scatter) {
      this.x  = Math.random() * W;
      this.y  = scatter ? Math.random() * H : H + 5;
      this.r  = Math.random() * 1.4 + .25;
      this.op = Math.random() * .5 + .08;
      this.vy = -(Math.random() * .45 + .12);
      this.vx = (Math.random() - .5) * .18;
      this.c  = Math.random() > .45 ? GOLD : TAN;
    }
    step() {
      this.y  += this.vy;
      this.x  += this.vx;
      this.op -= .001;
      if (this.y < -8 || this.op <= 0) this.init(false);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle   = this.c;
      ctx.globalAlpha = Math.max(0, this.op);
      ctx.fill();
    }
  }

  // Reduced count: 55 is plenty for the visual effect
  const particles = Array.from({ length: 55 }, () => new Particle());

  function loop() {
    if (paused) { rafId = null; return; }
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < particles.length; i++) {
      particles[i].step();
      particles[i].draw();
    }
    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(loop);
  }
  loop();
}

/* ── Contact Form ── */
function initContactForm() {
  const form  = document.getElementById('contactForm');
  const toast = document.getElementById('toast');
  if (!form) return;

  const btnText = form.querySelector('.btn-text');
  const btnLoad = form.querySelector('.btn-loading');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name    = form.querySelector('[name="name"]').value.trim();
    const email   = form.querySelector('[name="email"]').value.trim();
    const phone   = form.querySelector('[name="phone"]')?.value.trim() || '';
    const tour    = form.querySelector('[name="tour"]')?.value || '';
    const date    = form.querySelector('[name="date"]')?.value || '';
    const group   = form.querySelector('[name="group"]')?.value || '';
    const message = form.querySelector('[name="message"]').value.trim();

    if (!name || !email) {
      form.style.animation = 'shake .4s ease';
      form.addEventListener('animationend', () => form.style.animation = '', { once: true });
      return;
    }

    if (btnText) btnText.style.display = 'none';
    if (btnLoad) btnLoad.style.display = 'inline';

    const lines = [`Name: ${name}`, `Email: ${email}`];
    if (phone)   lines.push(`Phone: ${phone}`);
    if (tour)    lines.push(`Tour of interest: ${tour}`);
    if (date)    lines.push(`Preferred date: ${date}`);
    if (group)   lines.push(`Group size: ${group}`);
    if (message) lines.push(`\nMessage:\n${message}`);

    const subject = encodeURIComponent(`Tour Inquiry — ${name}`);
    const body    = encodeURIComponent(lines.join('\n'));

    setTimeout(() => {
      window.location.href = `mailto:yahya@yahyatours.com?subject=${subject}&body=${body}`;
      if (btnText) btnText.style.display = '';
      if (btnLoad) btnLoad.style.display = 'none';
      form.reset();
      if (toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4500);
      }
    }, 800);
  });
}

/* ── FAQ Accordion ── */
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-q').addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* ── Animate rating bars on scroll ── */
function animateRatingBars() {
  const block = document.getElementById('ratingBars');
  if (!block) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      block.querySelectorAll('.bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.pct + '%';
      });
      io.disconnect();
    });
  }, { threshold: .3 });
  io.observe(block);
}

/* ── Theme Toggle ── */
function initThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  _syncThemeIcon(btn);
  btn.addEventListener('click', () => {
    const html = document.documentElement;
    if (html.dataset.theme === 'light') {
      delete html.dataset.theme;
      localStorage.removeItem('yahya-theme');
    } else {
      html.dataset.theme = 'light';
      localStorage.setItem('yahya-theme', 'light');
    }
    _syncThemeIcon(btn);
  });
}

function _syncThemeIcon(btn) {
  const light = document.documentElement.dataset.theme === 'light';
  btn.querySelector('.theme-icon').textContent = light ? '☾' : '☀';
  btn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
}

/* ── Utility ── */
function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
