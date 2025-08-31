/* =========================================================
   Theme JS
   - Hero slider (Swiper) + tabs sync
   - AOS / Lightbox init
   - Header behaviors: sticky shadow, offcanvas menu, dropdowns
   - Footer year
   ========================================================= */

// Respect user's motion preference (used by Swiper & AOS)
const prefersReduced = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- 1) Footer: dynamic year ---------- */
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 2) HERO: Swiper slider ---------- */
  const swiperEl = document.querySelector('.hero__swiper');
  let heroSwiper = null;

  if (swiperEl && window.Swiper) {
    heroSwiper = new Swiper('.hero__swiper', {
      loop: false,
      autoplay: prefersReduced ? false : { delay: 4000, disableOnInteraction: false },
      speed: 600,
      pagination: { el: '.hero .swiper-pagination', clickable: true },
      navigation: { nextEl: '.hero .next', prevEl: '.hero .prev' },
      a11y: { enabled: true }
    });
  }

  /* ---------- 3) HERO: Tabs ⇄ Slides sync ---------- */
  const tabs = Array.from(document.querySelectorAll('.hero-tab'));

  // Reflect active slide on the tab list for accessibility (aria-pressed)
  const setActiveTab = (index) => {
    tabs.forEach((t, i) => t.setAttribute('aria-pressed', String(i === index)));
  };

  // Click/keyboard on a tab jumps to that slide
  tabs.forEach((btn) => {
    const go = () => {
      const idx = Number(btn.dataset.slide);
      if (heroSwiper) heroSwiper.slideTo(idx, 500);
    };
    btn.addEventListener('click', go);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });

  if (heroSwiper) {
    heroSwiper.on('slideChange', () => setActiveTab(heroSwiper.activeIndex));
    setActiveTab(heroSwiper.activeIndex);
  }

  /* ---------- 4) AOS & Lightbox (optional, if present) ---------- */
  if (window.AOS) {
    AOS.init({ once: true, disable: prefersReduced });
  }
  if (window.lightbox && lightbox.option) {
    lightbox.option({ resizeDuration: 200, wrapAround: true });
  }

  /* ---------- 5) Header behaviors ---------- */
  (function headerBehaviors() {
    const header = document.querySelector('.site-header');
    const navToggle = document.getElementById('nav-toggle');
    const offcanvas = document.getElementById('offcanvas');
    const offOverlay = document.querySelector('.offcanvas__overlay');
    const offClose = document.querySelector('.offcanvas__close');

    // Sticky shadow after small scroll
    const onScroll = () => {
      if (!header) return;
      const scrolled = window.scrollY > 8;
      header.setAttribute('data-scrolled', scrolled ? 'true' : 'false');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Body scroll lock helpers (for offcanvas)
    const lockBody = () => {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    };
    const unlockBody = () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };

    // Open/close offcanvas menu
    const openOffcanvas = () => {
      if (!offcanvas || !offOverlay) return;
      offcanvas.hidden = false;
      offOverlay.hidden = false;
      offcanvas.setAttribute('aria-hidden', 'false');
      offOverlay.setAttribute('aria-hidden', 'false');
      navToggle && navToggle.setAttribute('aria-expanded', 'true');
      lockBody();
      // Focus first focusable element inside the panel
      const first = offcanvas.querySelector('button, [href], input, select, textarea');
      if (first) first.focus();
    };

    const closeOffcanvas = () => {
      if (!offcanvas || !offOverlay) return;
      offcanvas.hidden = true;
      offOverlay.hidden = true;
      offcanvas.setAttribute('aria-hidden', 'true');
      offOverlay.setAttribute('aria-hidden', 'true');
      navToggle && navToggle.setAttribute('aria-expanded', 'false');
      unlockBody();
      navToggle && navToggle.focus();
    };

    if (navToggle) {
      navToggle.addEventListener('click', () => {
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        expanded ? closeOffcanvas() : openOffcanvas();
      });
      // Keyboard activation
      navToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navToggle.click(); }
      });
    }
    offClose && offClose.addEventListener('click', closeOffcanvas);
    offOverlay && offOverlay.addEventListener('click', closeOffcanvas);

    // ESC closes offcanvas and any open dropdown
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (offcanvas && !offcanvas.hidden) closeOffcanvas();
      document.querySelectorAll('.has-dropdown .dropdown-toggle[aria-expanded="true"]').forEach((btn) => {
        btn.setAttribute('aria-expanded', 'false');
        const dd = btn.parentElement && btn.parentElement.querySelector('.dropdown');
        if (dd) dd.setAttribute('aria-hidden', 'true');
      });
    });

    // Desktop dropdowns (toggle on click; close on outside click)
    document.querySelectorAll('.has-dropdown .dropdown-toggle').forEach((btn) => {
      const parent = btn.parentElement;
      const dropdown = parent && parent.querySelector('.dropdown');
      if (!dropdown) return;
      dropdown.setAttribute('aria-hidden', 'true');

      const toggle = () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        dropdown.setAttribute('aria-hidden', String(open));
      };

      btn.addEventListener('click', toggle);
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });

      // Close on outside click
      document.addEventListener('click', (ev) => {
        if (!parent.contains(ev.target)) {
          btn.setAttribute('aria-expanded', 'false');
          dropdown.setAttribute('aria-hidden', 'true');
        }
      });
    });

    // Offcanvas collapsible submenus
    document.querySelectorAll('.collapse-toggle').forEach((t) => {
      t.addEventListener('click', () => {
        const expanded = t.getAttribute('aria-expanded') === 'true';
        const next = t.nextElementSibling;
        if (!next) return;
        t.setAttribute('aria-expanded', String(!expanded));
        next.hidden = expanded;
      });
      t.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t.click(); }
      });
    });
  })();
});
