/* ============================================================
   YAHYA TOURS — script.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initReelCarousel();
  initScrollReveal();
  initReviewsCarousel();
  initContactForm();
  initParallax();
});

/* ── Navbar ── */
function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      navLinks.classList.remove('mobile-open');
      hamburger.classList.remove('open');
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('mobile-open');
  });
}

/* ── Reel Carousel ── */
function initReelCarousel() {
  const items        = Array.from(document.querySelectorAll('.reel-item'));
  const track        = document.getElementById('reelTrack');
  const progressFill = document.getElementById('reelProgressFill');
  if (!items.length) return;

  const INTERVAL = 5000;
  let current    = 0;
  let startTs    = null;
  let rafId      = null;
  let paused     = false;

  // Try playing the first video
  tryPlay(items[0]);

  function goTo(idx) {
    const prev = current;
    current = ((idx % items.length) + items.length) % items.length;

    items[prev].classList.remove('active');
    items[current].classList.add('active');

    // ── KEY FIX: scroll ONLY the reel-track element, never the page ──
    const item       = items[current];
    const itemLeft   = item.offsetLeft;
    const trackWidth = track.clientWidth;
    const itemWidth  = item.offsetWidth;
    track.scrollTo({ left: itemLeft - (trackWidth / 2) + (itemWidth / 2), behavior: 'smooth' });

    // Video management
    items.forEach((it, i) => {
      const vid = it.querySelector('video');
      if (!vid) return;
      if (i === current) { tryPlay(it); }
      else               { vid.pause(); }
    });
  }

  function tryPlay(item) {
    const vid = item && item.querySelector('video');
    if (!vid) return;
    const p = vid.play();
    if (p) {
      p.then(() => vid.classList.add('playing'))
       .catch(() => { /* no file — gradient placeholder shows */ });
    }
  }

  // Smooth progress bar via rAF — does NOT touch window.scrollY
  function tick(ts) {
    if (!paused) {
      if (!startTs) startTs = ts;
      const elapsed = ts - startTs;
      const pct     = Math.min((elapsed / INTERVAL) * 100, 100);
      progressFill.style.width = pct + '%';
      if (elapsed >= INTERVAL) {
        startTs = null;
        goTo(current + 1);
      }
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  // Click on a reel item — manual navigation
  items.forEach((item, i) => {
    item.addEventListener('click', () => {
      startTs = null;
      goTo(i);
    });
  });

  // Touch swipe (horizontal only — does not interfere with vertical page scroll)
  let touchX = 0;
  let touchY = 0;
  track.addEventListener('touchstart', e => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    // Only handle horizontal swipes (avoid eating vertical page scroll)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 38) {
      startTs = null;
      goTo(current + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });

  // Pause on reel-bar hover
  const reelBar = document.querySelector('.reel-bar');
  if (reelBar) {
    reelBar.addEventListener('mouseenter', () => { paused = true; });
    reelBar.addEventListener('mouseleave', () => { paused = false; startTs = null; });
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
  }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ── Reviews Carousel ── */
function initReviewsCarousel() {
  const track  = document.getElementById('reviewsTrack');
  const prevEl = document.getElementById('reviewPrev');
  const nextEl = document.getElementById('reviewNext');
  const dotsEl = document.getElementById('reviewDots');
  if (!track) return;

  const cards = Array.from(track.children);
  let cur     = 0;
  let per     = perPage();

  function perPage() {
    return window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3;
  }
  function pages() { return Math.ceil(cards.length / per); }

  function buildDots() {
    dotsEl.innerHTML = '';
    for (let i = 0; i < pages(); i++) {
      const b = document.createElement('button');
      b.className = 'dot' + (i === 0 ? ' active' : '');
      b.setAttribute('aria-label', 'Page ' + (i + 1));
      b.addEventListener('click', () => go(i));
      dotsEl.appendChild(b);
    }
  }

  function go(page) {
    cur = Math.max(0, Math.min(page, pages() - 1));
    const w = cards[0].offsetWidth + 22; // card width + gap
    track.style.transform = `translateX(-${cur * per * w}px)`;
    dotsEl.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === cur));
  }

  prevEl.addEventListener('click', () => { resetTimer(); go(cur - 1); });
  nextEl.addEventListener('click', () => { resetTimer(); go(cur + 1); });

  let timer = setInterval(advance, 6500);
  function advance() { go(cur + 1 < pages() ? cur + 1 : 0); }
  function resetTimer() { clearInterval(timer); timer = setInterval(advance, 6500); }

  window.addEventListener('resize', debounce(() => {
    per = perPage(); buildDots(); go(0);
  }, 220));

  buildDots(); go(0);
}

/* ── Contact Form ── */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const toast = document.getElementById('toast');
  if (!form) return;

  const btnText = form.querySelector('.btn-text');
  const btnLoad = form.querySelector('.btn-loading');

  form.addEventListener('submit', e => {
    e.preventDefault();

    const name    = form.querySelector('[name="name"]').value.trim();
    const email   = form.querySelector('[name="email"]').value.trim();
    const phone   = form.querySelector('[name="phone"]').value.trim();
    const tour    = form.querySelector('[name="tour"]').value;
    const message = form.querySelector('[name="message"]').value.trim();

    if (!name || !email) {
      form.style.animation = 'shake .4s ease';
      form.addEventListener('animationend', () => form.style.animation = '', { once: true });
      return;
    }

    btnText.hidden = true;
    btnLoad.hidden = false;

    const subject = encodeURIComponent(`Tour Inquiry from ${name}`);
    const body    = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}${phone ? '\nPhone: '+phone : ''}${tour ? '\nTour: '+tour : ''}\n\nMessage:\n${message || '(no message)'}`
    );

    setTimeout(() => {
      window.location.href = `mailto:yahya@yahyatours.com?subject=${subject}&body=${body}`;
      btnText.hidden = false;
      btnLoad.hidden = true;
      form.reset();
      if (toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
      }
    }, 700);
  });
}

/* ── Subtle parallax on decorative art elements ── */
function initParallax() {
  const els = document.querySelectorAll('.art-pyramid, .reviews-ambient, .hero-atmosphere');
  if (!els.length) return;
  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    els.forEach(el => {
      el.style.transform = `translateY(${sy * 0.04}px)`;
    });
  }, { passive: true });
}

/* ── Utility ── */
function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
