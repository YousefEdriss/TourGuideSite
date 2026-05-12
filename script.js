/* ============================================================
   YAHYA TOURS — script.js
   ============================================================ */

/* ── Supabase client ── */
const SUPA_URL = 'https://apuzdtktacehquqstuhz.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXpkdGt0YWNlaHF1cXN0dWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDI2OTMsImV4cCI6MjA5NDE3ODY5M30.i-kukwJPAdgue4jURlMecqMdON0LjMIjTZdKYEipFYk';
const sb = (typeof supabase !== 'undefined') ? supabase.createClient(SUPA_URL, SUPA_KEY) : null;

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initThemeToggle();
  initScrollReveal();
  initParticles();
  if (document.getElementById('contactForm'))        initContactForm();
  if (document.querySelector('.faq-item'))           initFAQ();
  if (document.getElementById('ratingBars'))         animateRatingBars();
  if (document.getElementById('hero'))               heroLoad();
  if (document.getElementById('reviewsGrid'))        loadReviews('reviewsGrid', null);
  if (document.getElementById('reviewsPreviewGrid')) loadReviews('reviewsPreviewGrid', 3);
  if (document.getElementById('reviewForm'))         initReviewForm();
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
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', debounce(resize, 300), { passive: true });

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

/* ── Load Reviews from Supabase ── */
async function loadReviews(containerId, limit) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!sb) {
    container.innerHTML = '<p class="reviews-loading">Reviews unavailable — Supabase not loaded.</p>';
    return;
  }

  let query = sb.from('reviews').select('*').order('created_at', { ascending: false });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    container.innerHTML = '<p class="reviews-loading">No reviews yet — be the first!</p>';
    return;
  }

  const avClasses = ['av-teal', 'av-terra', 'av-brown', 'av-tan'];

  container.innerHTML = data.map((r, i) => {
    const initials = r.name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const avClass  = avClasses[i % avClasses.length];
    const filled   = Math.min(5, Math.max(0, r.stars || 5));
    const stars    = '★'.repeat(filled) + '☆'.repeat(5 - filled);
    const date     = new Date(r.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    return `
      <div class="review-card reveal">
        <div class="review-quote-mark">"</div>
        <div class="review-stars">${stars}</div>
        <p class="review-text">${escHtml(r.text)}</p>
        <div class="review-foot">
          <div class="review-avatar ${avClass}">${escHtml(initials)}</div>
          <div>
            <div class="review-name">${escHtml(r.name)}</div>
            <div class="review-origin">${escHtml(r.origin)} · ${date}</div>
          </div>
        </div>
      </div>`;
  }).join('');

  /* Update rating bar counts if on the full reviews page */
  const countEl = document.querySelector('.rating-count');
  if (countEl) {
    countEl.textContent = `Based on ${data.length} review${data.length !== 1 ? 's' : ''}`;
    updateRatingBars(data);
  }

  initScrollReveal();
}

function updateRatingBars(data) {
  const counts = [0, 0, 0, 0, 0]; /* index 0 = 1★ … index 4 = 5★ */
  data.forEach(r => { const s = Math.min(5, Math.max(1, r.stars || 5)); counts[s - 1]++; });
  const total = data.length || 1;
  document.querySelectorAll('.bar-row').forEach(row => {
    const lbl   = row.querySelector('.bar-lbl');
    const fill  = row.querySelector('.bar-fill');
    const count = row.querySelector('.bar-count');
    if (!lbl || !fill || !count) return;
    const star = parseInt(lbl.textContent);
    const n    = counts[star - 1];
    fill.dataset.pct = Math.round((n / total) * 100);
    count.textContent = n;
  });
  animateRatingBars();
}

/* ── Review Submit Form ── */
function initReviewForm() {
  if (!sb) return;
  const form   = document.getElementById('reviewForm');
  const picker = document.getElementById('starPicker');
  const hidden = document.getElementById('r-stars');
  if (!form || !picker || !hidden) return;

  let selectedStars = 5;
  const spans = Array.from(picker.querySelectorAll('span'));

  function lightUpTo(n) {
    spans.forEach((s, i) => s.classList.toggle('lit', i < n));
  }
  lightUpTo(5);

  spans.forEach((s, i) => {
    s.addEventListener('mouseover', () => lightUpTo(i + 1));
    s.addEventListener('click', () => {
      selectedStars = i + 1;
      hidden.value  = selectedStars;
      lightUpTo(selectedStars);
    });
  });
  picker.addEventListener('mouseleave', () => lightUpTo(selectedStars));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name   = form.querySelector('[name="name"]').value.trim();
    const origin = form.querySelector('[name="origin"]').value.trim();
    const text   = form.querySelector('[name="text"]').value.trim();
    if (!name || !origin || !text) {
      form.style.animation = 'shake .4s ease';
      form.addEventListener('animationend', () => form.style.animation = '', { once: true });
      return;
    }

    const btnText = form.querySelector('.btn-text');
    const btnLoad = form.querySelector('.btn-loading');
    if (btnText) btnText.style.display = 'none';
    if (btnLoad) btnLoad.style.display = 'inline';

    const { error } = await sb.from('reviews').insert({ name, origin, text, stars: selectedStars });

    if (btnText) btnText.style.display = '';
    if (btnLoad) btnLoad.style.display = 'none';

    if (!error) {
      form.reset();
      selectedStars = 5;
      hidden.value  = 5;
      lightUpTo(5);
      showToast('Your review has been published! Thank you.');
      await loadReviews('reviewsGrid', null);
    } else {
      showToast('Something went wrong. Please try again.');
    }
  });
}

/* ── Contact Form ── */
function initContactForm() {
  const form = document.getElementById('contactForm');
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
      showToast('Message sent! Yahya will reply within 24 hours.');
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
        bar.style.width = (bar.dataset.pct || 0) + '%';
      });
      io.disconnect();
    });
  }, { threshold: .3 });
  io.observe(block);
}

/* ── Theme Toggle (light default → toggle dark) ── */
function initThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  _syncThemeIcon(btn);
  btn.addEventListener('click', () => {
    const html = document.documentElement;
    if (html.dataset.theme === 'dark') {
      delete html.dataset.theme;
      localStorage.removeItem('yahya-theme');
    } else {
      html.dataset.theme = 'dark';
      localStorage.setItem('yahya-theme', 'dark');
    }
    _syncThemeIcon(btn);
  });
}

function _syncThemeIcon(btn) {
  const dark = document.documentElement.dataset.theme === 'dark';
  btn.querySelector('.theme-icon').textContent = dark ? '☀' : '☾';
  btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}

/* ── Show Toast ── */
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4500);
}

/* ── HTML escape ── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Utility ── */
function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
