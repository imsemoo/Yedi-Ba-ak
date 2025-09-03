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

  (function () {
    // ===== Helpers =====
    const qs = (s, r = document) => r.querySelector(s);
    const qsa = (s, r = document) => [...r.querySelectorAll(s)];
    const fmt = (n) => Number(n || 0).toLocaleString('en-US');
    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
    const pct = (s, t) => clamp(t > 0 ? (s / t) * 100 : 0, 0, 100);
    const debounce = (fn, d = 200) => {
      let id; return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), d); };
    };
    const toast = (() => {
      let el;
      return (msg, timeout = 1800) => {
        if (!el) {
          el = document.createElement('div');
          el.className = 'toast';
          document.body.appendChild(el);
        }
        el.textContent = msg;
        el.classList.add('is-show');
        setTimeout(() => el.classList.remove('is-show'), timeout);
      };
    })();

    // ===== DOM =====
    const listEl = qs('#donationsList');
    const countEl = qs('#donationsCount');
    const countryName = qs('.donations__country-name');
    const countryFlag = qs('.donations__flag');
    const tpl = qs('#donationCardTpl');
    const chipsMount = qs('#countriesControlMount');

    // ===== Data (kept as-is) =====
    const DATA = {
      countries: [
        { code: 'PS', name: 'Palestine', flag: 'assets/images/flags/ps.webp', lon: 35.2, lat: 31.9 },
        { code: 'EG', name: 'Egypt', flag: 'assets/images/flags/eg.webp', lon: 30.0, lat: 26.0 },
        { code: 'TR', name: 'Turkey', flag: 'assets/images/flags/tr.webp', lon: 35.0, lat: 39.0 },
        { code: 'MA', name: 'Morocco', flag: 'assets/images/flags/ma.webp', lon: -7.0, lat: 31.0 },
        { code: 'IN', name: 'India', flag: 'assets/images/flags/in.webp', lon: 78.9, lat: 20.5 },
        { code: 'ID', name: 'Indonesia', flag: 'assets/images/flags/id.webp', lon: 113.0, lat: -0.8 },
      ],
      campaigns: {
        PS: [
          { title: '1000 Tent Aid Campaign for Gaza', img: 'assets/images/agenda/slide-1.png', donors: 6, total: 20000, support: 2920, country: 'Palestine', flag: 'assets/icons/flag-palestine.svg' },
          { title: 'Emergency Food Support', img: 'assets/images/agenda/slide-4.png', donors: 14, total: 15000, support: 12030, country: 'Palestine', flag: 'assets/images/flags/ps.webp' },
        ],
        EG: [
          { title: 'Dialysis Machines Support', img: 'assets/images/agenda/slide-2.png', donors: 7, total: 20000, support: 5460, country: 'Egypt', flag: 'assets/images/flags/eg.webp' },
        ],
        TR: [
          { title: 'Winter Clothes for Orphans', img: 'assets/images/agenda/slide-3.png', donors: 10, total: 22000, support: 1100, country: 'Turkey', flag: 'assets/images/flags/tr.webp' },
        ],
        MA: [
          { title: 'Earthquake Rebuild Houses', img: 'assets/images/agenda/slide-3.png', donors: 16, total: 26000, support: 11544, country: 'Morocco', flag: 'assets/icons/flag-morocco.svg' },
        ],
        IN: [
          { title: 'Medical Aid for Flood Victims', img: 'assets/images/agenda/slide-1.png', donors: 12, total: 18000, support: 6840, country: 'India', flag: 'assets/images/flags/in.webp' },
          { title: 'Food Packages for Villages', img: 'assets/images/agenda/slide-2.png', donors: 8, total: 12000, support: 4200, country: 'India', flag: 'assets/images/flags/in.webp' },
        ],
        ID: [
          { title: 'Clean Water Wells', img: 'assets/images/agenda/slide-4.png', donors: 9, total: 12000, support: 8616, country: 'Indonesia', flag: 'assets/images/flags/id.webp' },
        ]
      }
    };

    // ===== Card builder =====
    function buildCard(item) {
      const node = tpl.content.firstElementChild.cloneNode(true);
      const img = node.querySelector('.donation-card__media img');
      img.src = item.img; img.alt = item.title;

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

      // Demo actions
      node.querySelector('[aria-label="Add to wishlist"]').addEventListener('click', () => toast('Added to wishlist'));
      node.querySelector('[aria-label="Share"]').addEventListener('click', async () => {
        try {
          if (navigator.share) {
            await navigator.share({ title: item.title, text: 'Support this campaign', url: location.href });
            toast('Shared successfully');
          } else {
            await navigator.clipboard.writeText(`${item.title} — ${location.href}`);
            toast('Link copied to clipboard');
          }
        } catch { /* no-op */ }
      });
      node.querySelector('[aria-label="Add to cart"]').addEventListener('click', () => toast('Added to cart'));
      return node;
    }

    // ===== Render campaigns for a country =====
    function renderCountry(code) {
      const c = DATA.countries.find(x => x.code === code);
      const list = DATA.campaigns[code] || [];
      countryName.textContent = c?.name || '—';
      if (c?.flag) countryFlag.src = c.flag;

      listEl.setAttribute('aria-busy', 'true');
      listEl.innerHTML = '';
      list.forEach(i => listEl.appendChild(buildCard(i)));
      countEl.textContent = String(list.length);
      listEl.setAttribute('aria-busy', 'false');
    }

    // ===== Leaflet init =====
    const map = L.map('map', {
      worldCopyJump: true,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 6, minZoom: 2,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
    }).addTo(map);

    // Markers + bounds
    const markers = {};
    const latlngs = [];
    const defaultStyle = { radius: 6, color: '#fff', weight: 2, fillColor: 'var(--color-primary)', fillOpacity: 1 };
    const activeStyle = { radius: 7, color: '#fff', weight: 2, fillColor: 'var(--color-orange)', fillOpacity: 1 };

    DATA.countries.forEach(c => {
      const latlng = [c.lat, c.lon];
      latlngs.push(latlng);
      const m = L.circleMarker(latlng, defaultStyle)
        .bindTooltip(c.name, { permanent: false, direction: 'right', offset: [8, 0] })
        .on('click', () => select(c.code, { pan: true, save: true, from: 'marker' }))
        .on('mouseover', () => highlight(c.code, true))
        .on('mouseout', () => highlight(null))
        .addTo(map);
      // store code for quick access
      m._code = c.code;
      markers[c.code] = m;
    });

    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds.pad(0.3));

    // ===== Floating Countries Control =====
    const CountriesControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        const div = L.DomUtil.create('div', 'leaflet-control countries-control');
        const head = document.createElement('div');
        head.className = 'countries-control__head';
        head.innerHTML = `<strong>Countries</strong>`;
        const grid = document.createElement('div');
        grid.className = 'countries-control__grid';

        // build chips
        DATA.countries.forEach(c => {
          const count = (DATA.campaigns[c.code] || []).length;
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'country-chip';
          chip.dataset.code = c.code;
          chip.setAttribute('aria-pressed', 'false');
          chip.innerHTML = `
          <img class="country-chip__flag" src="${c.flag}" alt="">
          <span class="country-chip__name">${c.name}</span>
          <span class="country-chip__count">(${count})</span>
        `;
          chip.addEventListener('click', () => select(c.code, { pan: true, save: true, from: 'chip' }));
          chip.addEventListener('mouseenter', () => highlight(c.code, true));
          chip.addEventListener('mouseleave', () => highlight(null));
          grid.appendChild(chip);
        });

        div.appendChild(head);
        div.appendChild(grid);

        // prevent map drag when using control
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        return div;
      }
    });
    const control = new CountriesControl();
    map.addControl(control);

    // Move control into custom mount (optional, keeps layout tidy)
    if (chipsMount) {
      const controlEl = document.querySelector('.countries-control')?.parentElement;
      if (controlEl && chipsMount) chipsMount.appendChild(controlEl);
    }

    // ===== Selection & Highlighting =====
    let current = null;

    function setActiveMarker(code) {
      Object.values(markers).forEach(m => {
        m.setStyle(defaultStyle);
        const el = m._path || m._renderer?._container?.querySelector(`[stroke][fill]`);
        m._path?.classList.remove('is-active');
      });
      const mk = markers[code];
      if (mk) {
        mk.setStyle(activeStyle);
        mk._path?.classList.add('is-active');
      }
    }

    function updateChips(code) {
      qsa('.country-chip').forEach(chip => {
        const is = chip.dataset.code === code;
        chip.setAttribute('aria-current', is ? 'true' : 'false');
        chip.setAttribute('aria-pressed', is ? 'true' : 'false');
      });
    }

    const flyToDebounced = debounce((latlng) => {
      map.flyTo(latlng, clamp(map.getZoom(), 3, 5), { duration: .7, easeLinearity: .25 });
    }, 10);

    function select(code, opts = { pan: false, save: false, from: 'unknown' }) {
      const mk = markers[code];
      if (!mk) return;

      // sync visuals
      setActiveMarker(code);
      updateChips(code);
      renderCountry(code);

      // pan/fly
      if (opts.pan) flyToDebounced(mk.getLatLng());

      // state + deep link + persist
      current = code;
      history.replaceState(null, '', `#${code}`);
      if (opts.save) localStorage.setItem('donations:last', code);
    }

    function highlight(code, hover = false) {
      // hover preview on markers and chips
      qsa('.country-chip').forEach(chip => {
        chip.style.outline = chip.dataset.code === code ? '2px solid var(--color-primary)' : '';
      });
      Object.entries(markers).forEach(([k, m]) => {
        if (k === code) {
          m.setStyle({ ...activeStyle, fillOpacity: 1 });
        } else if (k !== current) {
          m.setStyle({ ...defaultStyle, fillOpacity: .9 });
        }
      });
      if (hover && code && markers[code]) {
        // subtle guided pan without committing selection
        // (comment out next line if you don't want hover pan)
        // flyToDebounced(markers[code].getLatLng());
      }
    }

    // ===== Keyboard navigation (↑/↓ select, Enter apply) =====
    function indexOfCurrent() {
      return Math.max(0, DATA.countries.findIndex(c => c.code === current));
    }
    document.addEventListener('keydown', (e) => {
      const key = e.key;
      if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(key)) return;
      const i = indexOfCurrent();
      if (key === 'ArrowDown') {
        const n = (i + 1) % DATA.countries.length;
        const code = DATA.countries[n].code;
        updateChips(code);
        setActiveMarker(code);
        renderCountry(code);
        current = code;
        e.preventDefault();
      }
      if (key === 'ArrowUp') {
        const p = (i - 1 + DATA.countries.length) % DATA.countries.length;
        const code = DATA.countries[p].code;
        updateChips(code);
        setActiveMarker(code);
        renderCountry(code);
        current = code;
        e.preventDefault();
      }
      if (key === 'Enter') {
        const mk = markers[current];
        if (mk) select(current, { pan: true, save: true, from: 'keyboard' });
        e.preventDefault();
      }
    });

    // ===== Initial selection (hash -> localStorage -> default) =====
    const initial =
      (location.hash || '').replace('#', '').toUpperCase() ||
      localStorage.getItem('donations:last') ||
      'PS';
    select(initial, { pan: false, save: false, from: 'init' });

    // ===== Panel hover ↔ Map tooltip sync =====
    listEl.addEventListener('mouseover', (e) => {
      const card = e.target.closest('.donation-card');
      if (!card) return;
      const code = current;
      const m = markers[code];
      if (m) m.openTooltip();
    });
    listEl.addEventListener('mouseleave', () => {
      Object.values(markers).forEach(m => m.closeTooltip());
    });



  })();

})();
