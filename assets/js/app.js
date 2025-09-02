/* =========================================================
   Theme JS (Refactored, Clean Code)
   - Utilities
   - Boot sequence
   - Footer year
   - Hero slider + tabs sync
   - AOS / Lightbox init
   - Header behaviors (sticky, offcanvas, dropdowns)
   - Agenda slider + progress
   ========================================================= */

(() => {
  'use strict';

  /* ======================== Utilities ======================== */
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, type, handler, opts) => el && el.addEventListener(type, handler, opts);
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  const SEL = {
    year: '#currentYear',
    heroSwiper: '.hero__swiper',
    heroPagination: '.hero .swiper-pagination',
    heroPrev: '.hero .prev',
    heroNext: '.hero .next',
    heroTab: '.hero-tab',

    header: '.site-header',
    navToggle: '#nav-toggle',
    offcanvas: '#offcanvas',
    offOverlay: '.offcanvas__overlay',
    offClose: '.offcanvas__close',
    dropdownToggles: '.has-dropdown .dropdown-toggle',
    collapseToggle: '.collapse-toggle',

    agendaSwiper: '.agenda__swiper',
    agendaPagination: '.agenda .swiper-pagination',
    agendaPrev: '.agenda .prev',
    agendaNext: '.agenda .next',
    agendaMeter: '.agenda-card__meter',
    agendaMeterBar: '.agenda-card__meter-bar'
  };

  /* ======================== Boot ======================== */
  on(document, 'DOMContentLoaded', () => {
    initFooterYear();
    const heroSwiper = initHeroSlider();
    initHeroTabsSync(heroSwiper);
    initMotionLibs();
    initHeaderBehaviors();
    initAgendaSlider();
    initAgendaProgress();
    initDonationMapSVG();

  });

  /* ======================== Footer year ======================== */
  function initFooterYear() {
    const el = qs(SEL.year);
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ======================== Hero slider ======================== */
  function initHeroSlider() {
    const el = qs(SEL.heroSwiper);
    if (!el || !window.Swiper) return null;

    return new Swiper(el, {
      loop: false,
      speed: 600,
      autoplay: prefersReduced ? false : { delay: 4000, disableOnInteraction: false },
      pagination: { el: SEL.heroPagination, clickable: true },
      navigation: { nextEl: SEL.heroNext, prevEl: SEL.heroPrev },
      a11y: { enabled: true }
    });
  }

  function initHeroTabsSync(heroSwiper) {
    const tabs = qsa(SEL.heroTab);
    if (!tabs.length) return;

    const setActive = (index) => {
      tabs.forEach((t, i) => t.setAttribute('aria-pressed', String(i === index)));
    };

    const goTo = (btn) => {
      const idx = Number(btn.dataset.slide);
      if (Number.isFinite(idx) && heroSwiper) heroSwiper.slideTo(idx, 500);
    };

    tabs.forEach((btn) => {
      on(btn, 'click', () => goTo(btn));
      on(btn, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(btn); }
      });
    });

    if (heroSwiper) {
      heroSwiper.on('slideChange', () => setActive(heroSwiper.activeIndex));
      setActive(heroSwiper.activeIndex);
    }
  }

  /* ======================== Motion libs ======================== */
  function initMotionLibs() {
    if (window.AOS) AOS.init({ once: true, disable: prefersReduced });
    if (window.lightbox && lightbox.option) {
      lightbox.option({ resizeDuration: 200, wrapAround: true });
    }
  }

  /* ======================== Header behaviors ======================== */
  function initHeaderBehaviors() {
    const header = qs(SEL.header);
    const navToggle = qs(SEL.navToggle);
    const offcanvas = qs(SEL.offcanvas);
    const offOverlay = qs(SEL.offOverlay);
    const offClose = qs(SEL.offClose);

    // Sticky shadow on scroll
    const updateShadow = () => {
      if (!header) return;
      const scrolled = window.scrollY > 8;
      header.setAttribute('data-scrolled', scrolled ? 'true' : 'false');
    };
    on(window, 'scroll', updateShadow, { passive: true });
    updateShadow();

    // Body scroll lock
    const lockBody = () => {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    };
    const unlockBody = () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };

    // Offcanvas open/close
    const openOffcanvas = () => {
      if (!offcanvas || !offOverlay) return;
      offcanvas.hidden = false;
      offOverlay.hidden = false;
      offcanvas.setAttribute('aria-hidden', 'false');
      offOverlay.setAttribute('aria-hidden', 'false');
      navToggle && navToggle.setAttribute('aria-expanded', 'true');
      lockBody();
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
      on(navToggle, 'click', () => {
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        expanded ? closeOffcanvas() : openOffcanvas();
      });
      on(navToggle, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navToggle.click(); }
      });
    }
    on(offClose, 'click', closeOffcanvas);
    on(offOverlay, 'click', closeOffcanvas);

    // ESC closes offcanvas & any open dropdown
    on(document, 'keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (offcanvas && !offcanvas.hidden) closeOffcanvas();
      qsa(SEL.dropdownToggles)
        .filter((btn) => btn.getAttribute('aria-expanded') === 'true')
        .forEach((btn) => closeDropdown(btn));
    });

    // Dropdowns (desktop)
    qsa(SEL.dropdownToggles).forEach((btn) => {
      const parent = btn.parentElement;
      const dropdown = parent && parent.querySelector('.dropdown');
      if (!dropdown) return;
      dropdown.setAttribute('aria-hidden', 'true');

      const toggle = () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        dropdown.setAttribute('aria-hidden', String(open));
      };

      on(btn, 'click', toggle);
      on(btn, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });

      // outside click
      on(document, 'click', (ev) => {
        if (!parent.contains(ev.target)) closeDropdown(btn);
      });
    });

    function closeDropdown(btn) {
      const dd = btn.parentElement && btn.parentElement.querySelector('.dropdown');
      btn.setAttribute('aria-expanded', 'false');
      dd && dd.setAttribute('aria-hidden', 'true');
    }

    // Offcanvas collapsible submenus
    qsa(SEL.collapseToggle).forEach((t) => {
      const toggle = () => {
        const expanded = t.getAttribute('aria-expanded') === 'true';
        const next = t.nextElementSibling;
        if (!next) return;
        t.setAttribute('aria-expanded', String(!expanded));
        next.hidden = expanded;
      };
      on(t, 'click', toggle);
      on(t, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  /* ======================== Agenda slider ======================== */
  /* ======================== Agenda slider ======================== */
  function initAgendaSlider() {
    const el = qs(SEL.agendaSwiper);
    if (!el || !window.Swiper) return null;

    return new Swiper(el, {
      loop: false,
      speed: 500,
      autoplay: prefersReduced ? false : { delay: 4500, disableOnInteraction: false },
      a11y: { enabled: true },
      keyboard: { enabled: true },
      centeredSlides: false,
      spaceBetween: 16,
      slidesPerView: 1.05,
      pagination: { el: SEL.agendaPagination, clickable: true },
      navigation: { nextEl: SEL.agendaNext, prevEl: SEL.agendaPrev },
      breakpoints: {
        576: { slidesPerView: 2, spaceBetween: 16 },
        768: { slidesPerView: 2.5, spaceBetween: 18 },
        992: { slidesPerView: 3, spaceBetween: 20 },
        1200: { slidesPerView: 3, spaceBetween: 22 }
      }
    });
  }

  /* ======================== Agenda progress (auto-calc) ======================== */
  function initAgendaProgress() {
    const fmt = (n) => Number(n || 0).toLocaleString('en-US');
    qsa('.agenda-card').forEach((card) => {
      const meter = qs('.agenda-card__meter', card);
      if (!meter) return;

      // Read amounts (prefer meter dataset, then card dataset)
      const total = Number(meter.dataset.total ?? card.dataset.total ?? 0);
      const support = Number(meter.dataset.support ?? card.dataset.support ?? 0);

      // Compute
      const progress = total > 0 ? clamp((support / total) * 100, 0, 100) : 0;
      const remaining = Math.max(0, total - support);

      // Update progressbar width + A11y
      const bar = qs('.agenda-card__meter-bar', meter);
      if (bar) requestAnimationFrame(() => { bar.style.inlineSize = `${progress.toFixed(1)}%`; });
      meter.setAttribute('aria-valuemin', '0');
      meter.setAttribute('aria-valuemax', '100');
      meter.setAttribute('aria-valuenow', progress.toFixed(1));

      // Update stats text
      const setText = (sel, txt) => { const el = qs(sel, card); if (el) el.textContent = txt; };
      setText('[data-field="required"]', `${fmt(total)} $`);
      setText('[data-field="support"]', `${fmt(support)} $`);
      setText('[data-field="remaining"]', `${fmt(remaining)} $`);

      // Update growth badge (%)
      const growth = qs('.agenda-card__growth', card);
      if (growth) {
        const val = progress.toFixed(1);
        growth.textContent = `%${val}`;
        growth.setAttribute('aria-label', `growth ${val} percent`);
      }
    });
  }


  /* ======================== Donation Map (ECharts) ======================== */
  /* ============================================================================
     Donation Map (SVG, no external dependencies)
     - Render interactive country markers on a static world SVG
     - Projection: Equirectangular (lon/lat → % of map)
     - Clicking a marker updates the right-hand donation panel
     ============================================================================ */
  function initDonationMapSVG() {
    // --- DOM references ---
    const markersWrap = qs('.donations__markers');
    const listEl = qs('#donationsList');
    const countEl = qs('#donationsCount');
    const countryName = qs('.donations__country-name');
    const countryFlag = qs('.donations__flag');
    const tpl = qs('#donationCardTpl');

    if (!markersWrap || !listEl || !countEl || !countryName || !countryFlag || !tpl) return;

    // --- Data: countries with lon/lat + campaigns ---
    const DATA = {
      countries: [
        { code: 'PS', name: 'Palestine', flag: 'assets/icons/flag-palestine.svg', lon: 35.2, lat: 31.9 },
        { code: 'EG', name: 'Egypt', flag: 'assets/icons/flag-egypt.svg', lon: 30.0, lat: 26.0 },
        { code: 'TR', name: 'Turkey', flag: 'assets/icons/flag-turkey.svg', lon: 35.0, lat: 39.0 },
        { code: 'MA', name: 'Morocco', flag: 'assets/icons/flag-morocco.svg', lon: -7.0, lat: 31.0 },
        { code: 'IN', name: 'India', flag: 'assets/icons/flag-india.svg', lon: 78.9, lat: 20.5 },
        { code: 'ID', name: 'Indonesia', flag: 'assets/icons/flag-indonesia.svg', lon: 113.0, lat: -0.8 },
      ],
      campaigns: {
        PS: [
          { title: '1000 Tent Aid Campaign for Gaza', img: 'assets/images/agenda/slide-1.png', donors: 6, total: 20000, support: 2920, country: 'Palestine', flag: 'assets/icons/flag-palestine.svg' },
          { title: 'Emergency Food Support', img: 'assets/images/agenda/slide-4.png', donors: 14, total: 15000, support: 12030, country: 'Palestine', flag: 'assets/icons/flag-palestine.svg' },
        ],
        EG: [
          { title: 'Dialysis Machines Support', img: 'assets/images/agenda/slide-2.png', donors: 7, total: 20000, support: 5460, country: 'Egypt', flag: 'assets/icons/flag-egypt.svg' },
        ],
        TR: [
          { title: 'Winter Clothes for Orphans', img: 'assets/images/agenda/slide-3.png', donors: 10, total: 22000, support: 1100, country: 'Turkey', flag: 'assets/icons/flag-turkey.svg' },
        ],
        MA: [
          { title: 'Earthquake Rebuild Houses', img: 'assets/images/agenda/slide-3.png', donors: 16, total: 26000, support: 11544, country: 'Morocco', flag: 'assets/icons/flag-morocco.svg' },
        ],
        IN: [
          { title: 'Medical Aid for Flood Victims', img: 'assets/images/agenda/slide-1.png', donors: 12, total: 18000, support: 6840, country: 'India', flag: 'assets/icons/flag-india.svg' },
          { title: 'Food Packages for Villages', img: 'assets/images/agenda/slide-2.png', donors: 8, total: 12000, support: 4200, country: 'India', flag: 'assets/icons/flag-india.svg' },
        ],
        ID: [
          { title: 'Clean Water Wells', img: 'assets/images/agenda/slide-4.png', donors: 9, total: 12000, support: 8616, country: 'Indonesia', flag: 'assets/icons/flag-indonesia.svg' },
        ]
      }
    };

    // --- Helpers ---
    const fmt = (n) => Number(n || 0).toLocaleString('en-US');
    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
    const pct = (s, t) => clamp(t > 0 ? (s / t) * 100 : 0, 0, 100);

    // Convert longitude/latitude to % coords (simple equirectangular projection)
    function project(lon, lat) {
      const x = ((lon + 180) / 360) * 100;     // -180..180 → 0..100%
      const y = ((90 - lat) / 180) * 100;      //  90..-90  → 0..100%
      return { x, y };
    }

    // Build campaign card from template
    function buildCard(item) {
      const node = tpl.content.firstElementChild.cloneNode(true);
      node.querySelector('.donation-card__media img').src = item.img;
      node.querySelector('.donation-card__media img').alt = item.title;
      node.querySelector('.donation-card__title').textContent = item.title;
      node.querySelector('.donation-card__donors').textContent = item.donors;
      node.querySelector('.donation-card__country').textContent = item.country;
      node.querySelector('.donation-card__flag').src = item.flag;

      const p = pct(item.support, item.total);
      node.querySelector('.donation-card__percent').textContent = `%${p.toFixed(1)}`;
      node.querySelector('.donation-card__meter').setAttribute('aria-valuenow', p.toFixed(1));
      requestAnimationFrame(() => {
        node.querySelector('.donation-card__meter-bar').style.inlineSize = `${p.toFixed(1)}%`;
      });

      node.querySelector('.donation-card__required').textContent = `${fmt(item.total)} $`;
      node.querySelector('.donation-card__support').textContent = `${fmt(item.support)} $`;
      node.querySelector('.donation-card__remaining').textContent = `${fmt(Math.max(0, item.total - item.support))} $`;
      return node;
    }

    // Render campaigns for a given country code
    function renderCountry(code) {
      const c = DATA.countries.find((x) => x.code === code);
      const list = DATA.campaigns[code] || [];
      countryName.textContent = c?.name || '—';
      if (c?.flag) countryFlag.src = c.flag;
      listEl.setAttribute('aria-busy', 'true');
      listEl.innerHTML = '';
      list.forEach((i) => listEl.appendChild(buildCard(i)));
      countEl.textContent = String(list.length);
      listEl.setAttribute('aria-busy', 'false');
    }

    // --- Render markers ---
    markersWrap.innerHTML = '';
    DATA.countries.forEach((c) => {
      const { x, y } = project(c.lon, c.lat); // project lon/lat → %
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'marker';
      b.style.left = `${x}%`;
      b.style.top = `${y}%`;
      b.setAttribute('data-code', c.code);
      b.setAttribute('data-name', c.name);
      b.setAttribute('aria-label', c.name);
      b.setAttribute('aria-pressed', 'false');

      // Click / keyboard events
      b.addEventListener('click', () => select(c.code));
      b.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          b.click();
        }
      });

      markersWrap.appendChild(b);
    });

    // Update selected state + render panel
    function select(code) {
      qsa('.marker', markersWrap).forEach((m) => {
        const active = m.getAttribute('data-code') === code;
        m.setAttribute('data-active', String(active));
        m.setAttribute('aria-pressed', String(active));
      });
      renderCountry(code);
    }

    // Default selection
    select('PS');
  }


})();
