/* ====================================================================
   Theme JS — Production Grade (No behavior changes)
   Scope:
   - Single helper namespace ($$) + central selectors (SEL)
   - Footer year (#footerYear)
   - Sliders: Hero / Agenda / Impact / Donate / Board
   - Hero Tabs sync (A11y-friendly)
   - Motion libs (AOS / Lightbox) with reduced-motion respect
   - Header behaviors (sticky shadow, offcanvas, dropdowns)
   - Agenda progress (generic meter helper)
   - Donations map (Leaflet) → initDonationMap()
   - Lightweight toast for demo actions
   - Cart & Donate form (scoped, conflict-free)
   - Reusable phone field (intl-tel-input) for dynamic DOM
   ==================================================================== */

(() => {
  "use strict";

  /* ====================================================================
     Phone field (intl-tel-input) — contact/volunteer form (scoped by ID)
     Notes:
     - Initializes only if #volPhone exists and plugin is available.
     - Writes E.164 (+90555...) to #volPhoneE164 and ISO2 to #volPhoneISO2.
     - Performs client-side validity + hint messaging.
     ==================================================================== */
  document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("volPhone");
    if (!input || !window.intlTelInput) return; // Guard

    // Initialize plugin
    const iti = window.intlTelInput(input, {
      initialCountry: "auto",
      geoIpLookup: (cb) => {
        fetch("https://ipapi.co/json/")
          .then((r) => r.json())
          .then((d) => cb(d && d.country_code ? d.country_code : "TR"))
          .catch(() => cb("TR"));
      },
      separateDialCode: true,
      nationalMode: false, // Accept international format
      autoPlaceholder: "aggressive",
      preferredCountries: ["tr", "ps", "sy", "us"],
      // utils.js already loaded via CDN (no need to re-declare)
    });

    // Outputs / hint
    const hint = document.getElementById("volPhoneHint");
    const outE = document.getElementById("volPhoneE164");
    const outIso = document.getElementById("volPhoneISO2");

    function validateAndEmit() {
      hint.textContent = "";
      input.setCustomValidity("");

      if (!input.value.trim()) return; // 'required' handles empty

      if (!iti.isValidNumber()) {
        input.setCustomValidity("Invalid phone number");
        hint.textContent = "Please enter a valid phone number.";
      } else {
        outE.value = iti.getNumber(); // E.164
        outIso.value = iti.getSelectedCountryData().iso2;
      }
    }

    input.addEventListener("input", validateAndEmit);
    input.addEventListener("blur", validateAndEmit);
    input.addEventListener("countrychange", validateAndEmit);

    // Final check on submit
    const form = input.closest("form");
    form &&
      form.addEventListener("submit", function (e) {
        validateAndEmit();
        if (!form.checkValidity()) {
          e.preventDefault();
          input.reportValidity();
        }
      });

    // Expose for debugging
    window.__volunteerPhone = iti;
  });

  /* ====================================================================
     Helpers & Selectors
     - $$: micro-utility namespace (query, events, math, debounce, toast)
     - SEL: selectors reused across modules (centralized for consistency)
     ==================================================================== */
  const $$ = {
    prefersReduced:
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,

    qs: (sel, root = document) => root.querySelector(sel),
    qsa: (sel, root = document) => Array.from(root.querySelectorAll(sel)),
    on: (el, type, handler, opts) =>
      el && el.addEventListener(type, handler, opts),
    clamp: (n, min, max) => Math.min(max, Math.max(min, n)),
    fmtInt: (n) => Number(n || 0).toLocaleString("en-US"),
    fmtMoney: (n) => `$${Number(n || 0).toLocaleString("en-US")}`,
    percent: (support, total) =>
      Math.min(100, Math.max(0, total > 0 ? (support / total) * 100 : 0)),

    debounce(fn, d = 200) {
      let id;
      return (...args) => {
        clearTimeout(id);
        id = setTimeout(() => fn(...args), d);
      };
    },

    // Minimal toast (CSS class .toast required in theme)
    toast: (() => {
      let el;
      return (msg, timeout = 1800) => {
        if (!el) {
          el = document.createElement("div");
          el.className = "toast";
          document.body.appendChild(el);
        }
        el.textContent = msg;
        el.classList.add("is-show");
        setTimeout(() => el.classList.remove("is-show"), timeout);
      };
    })(),
  };

  const SEL = {
    year: "#footerYear",

    // Hero
    heroSwiper: ".hero__swiper",
    heroPagination: ".hero .swiper-pagination",
    heroPrev: ".hero .prev",
    heroNext: ".hero .next",
    heroTab: ".hero-tab",

    // Header / Nav
    header: ".site-header",
    navToggle: "#nav-toggle",
    offcanvas: "#offcanvas",
    offOverlay: ".offcanvas__overlay",
    offClose: ".offcanvas__close",
    dropdownToggles: ".has-dropdown .dropdown-toggle",
    collapseToggle: ".collapse-toggle",

    // Agenda
    agendaSwiper: ".agenda__swiper",
    agendaPagination: ".agenda .swiper-pagination",
    agendaPrev: ".agenda .prev",
    agendaNext: ".agenda .next",
  };

  /* ====================================================================
     Boot sequence — page-level initializations
     Notes:
     - Each init() checks for existence / plugin availability.
     - No side effects if section/plugin is absent.
     ==================================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    initFooterYear();

    const hero = initHeroSlider();
    initHeroTabsSync(hero);

    initMotionLibs();
    initHeaderBehaviors();

    initAgendaSlider();
    initAgendaProgress();

    initImpactSlider();
    initDonateShowcaseSlider();

    initDonationMap(); // Leaflet module
  });

  /* ====================================================================
     Footer Year
     ==================================================================== */
  function initFooterYear() {
    const el = $$.qs(SEL.year);
    if (el) el.textContent = new Date().getFullYear().toString();
  }

  /* ====================================================================
     Sliders (Swiper)
     - All sliders respect reduced motion for autoplay.
     ==================================================================== */
  function initHeroSlider() {
    const el = $$.qs(SEL.heroSwiper);
    if (!el || !window.Swiper) return null;

    return new Swiper(el, {
      loop: false,
      speed: 600,
      autoplay: $$.prefersReduced
        ? false
        : { delay: 4000, disableOnInteraction: false },
      pagination: { el: SEL.heroPagination, clickable: true },
      navigation: { nextEl: SEL.heroNext, prevEl: SEL.heroPrev },
      a11y: { enabled: true },
    });
  }

  function initHeroTabsSync(heroSwiper) {
    const tabs = $$.qsa(SEL.heroTab);
    if (!tabs.length) return;

    const setActive = (index) => {
      tabs.forEach((t, i) =>
        t.setAttribute("aria-pressed", String(i === index))
      );
    };

    const goTo = (btn) => {
      const idx = Number(btn.dataset.slide);
      if (Number.isFinite(idx) && heroSwiper) heroSwiper.slideTo(idx, 500);
    };

    tabs.forEach((btn) => {
      $$.on(btn, "click", () => goTo(btn));
      $$.on(btn, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goTo(btn);
        }
      });
    });

    if (heroSwiper) {
      heroSwiper.on("slideChange", () => setActive(heroSwiper.activeIndex));
      setActive(heroSwiper.activeIndex);
    }
  }

  function initAgendaSlider() {
    const el = $$.qs(SEL.agendaSwiper);
    if (!el || !window.Swiper) return null;

    return new Swiper(el, {
      loop: false,
      speed: 500,
      autoplay: $$.prefersReduced
        ? false
        : { delay: 4500, disableOnInteraction: false },
      a11y: { enabled: true },
      keyboard: { enabled: true },
      centeredSlides: false,
      spaceBetween: 16,
      slidesPerView: 1.05,
      pagination: { el: SEL.agendaPagination, clickable: true },
      navigation: { nextEl: SEL.agendaNext, prevEl: SEL.agendaPrev },
      breakpoints: {
        576: { slidesPerView: 2, spaceBetween: 16 },
        768: { slidesPerView: 2, spaceBetween: 18 },
        992: { slidesPerView: 3, spaceBetween: 20 },
        1200: { slidesPerView: 3, spaceBetween: 22 },
      },
    });
  }

  function initImpactSlider() {
    const el = document.querySelector(".impact__swiper");
    if (!el || !window.Swiper) return null;

    return new Swiper(el, {
      speed: 600,
      loop: false,
      autoplay: $$.prefersReduced
        ? false
        : { delay: 5000, disableOnInteraction: false },
      slidesPerView: 1,
      spaceBetween: 24,
      a11y: { enabled: true },
      pagination: { el: ".impact__pagination", clickable: true },
      keyboard: { enabled: true },
    });
  }

  function initDonateShowcaseSlider() {
    const el = document.querySelector(".donate-swiper");
    if (!el || !window.Swiper) return null;

    return new Swiper(el, {
      speed: 600,
      loop: false,
      autoplay: $$.prefersReduced
        ? false
        : { delay: 4500, disableOnInteraction: false },
      slidesPerView: 1,
      spaceBetween: 0,
      a11y: { enabled: true },
      pagination: { el: ".donate__pagination", clickable: true },
      keyboard: { enabled: true },
    });
  }

  /* --------------------------------------------------------------------
     Board of Directors Slider (component-scoped)
     - Kept separate DOMContentLoaded listener as in original (no change).
     -------------------------------------------------------------------- */
  function initBoardSlider() {
    const el = document.querySelector(".board__swiper");
    if (!el || !window.Swiper) return null;

    return new Swiper(el, {
      speed: 600,
      loop: false,
      autoplay:
        window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? false
          : { delay: 5000, disableOnInteraction: false },
      a11y: { enabled: true },
      keyboard: { enabled: true },
      slidesPerView: 1.05,
      spaceBetween: 20,
      pagination: { el: ".board__pagination", clickable: true },
      navigation: { nextEl: "[data-board-next]", prevEl: "[data-board-prev]" },
      breakpoints: {
        576: { slidesPerView: 2, spaceBetween: 20 },
        768: { slidesPerView: 2.5, spaceBetween: 22 },
        992: { slidesPerView: 3, spaceBetween: 24 },
        1200: { slidesPerView: 4, spaceBetween: 24 },
      },
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initBoardSlider();
  });

  /* ====================================================================
     Motion Libraries
     ==================================================================== */
  function initMotionLibs() {
    if (window.AOS) AOS.init({ once: true, disable: $$.prefersReduced });
    if (window.lightbox && lightbox.option) {
      lightbox.option({ resizeDuration: 200, wrapAround: true });
    }
  }

  /* ====================================================================
     Header Behaviors
     - Sticky shadow on scroll
     - Offcanvas open/close with body scroll lock
     - ESC closes offcanvas + open dropdowns
     - Desktop dropdown toggles (click + keyboard)
     - Offcanvas collapsible submenus
     ==================================================================== */
  function initHeaderBehaviors() {
    const header = $$.qs(SEL.header);
    const navToggle = $$.qs(SEL.navToggle);
    const offcanvas = $$.qs(SEL.offcanvas);
    const offOverlay = $$.qs(SEL.offOverlay);
    const offClose = $$.qs(SEL.offClose);

    // Shadow on scroll
    const updateShadow = () => {
      if (!header) return;
      const scrolled = window.scrollY > 8;
      header.setAttribute("data-scrolled", scrolled ? "true" : "false");
    };
    $$.on(window, "scroll", updateShadow, { passive: true });
    updateShadow();

    // Body scroll lock helpers
    const lockBody = () => {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    };
    const unlockBody = () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };

    // Offcanvas open/close
    const openOffcanvas = () => {
      if (!offcanvas || !offOverlay) return;
      offcanvas.hidden = false;
      offOverlay.hidden = false;
      offcanvas.setAttribute("aria-hidden", "false");
      offOverlay.setAttribute("aria-hidden", "false");
      navToggle && navToggle.setAttribute("aria-expanded", "true");
      lockBody();
      const first = offcanvas.querySelector(
        "button, [href], input, select, textarea"
      );
      if (first) first.focus();
    };

    const closeOffcanvas = () => {
      if (!offcanvas || !offOverlay) return;
      offcanvas.hidden = true;
      offOverlay.hidden = true;
      offcanvas.setAttribute("aria-hidden", "true");
      offOverlay.setAttribute("aria-hidden", "true");
      navToggle && navToggle.setAttribute("aria-expanded", "false");
      unlockBody();
      navToggle && navToggle.focus();
    };

    if (navToggle) {
      $$.on(navToggle, "click", () => {
        const expanded = navToggle.getAttribute("aria-expanded") === "true";
        expanded ? closeOffcanvas() : openOffcanvas();
      });
      $$.on(navToggle, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navToggle.click();
        }
      });
    }
    $$.on(offClose, "click", closeOffcanvas);
    $$.on(offOverlay, "click", closeOffcanvas);

    // ESC closes offcanvas and any open dropdown
    $$.on(document, "keydown", (e) => {
      if (e.key !== "Escape") return;
      if (offcanvas && !offcanvas.hidden) closeOffcanvas();
      $$.qsa(SEL.dropdownToggles)
        .filter((btn) => btn.getAttribute("aria-expanded") === "true")
        .forEach((btn) => closeDropdown(btn));
    });

    // Dropdowns (desktop)
    $$.qsa(SEL.dropdownToggles).forEach((btn) => {
      const parent = btn.parentElement;
      const dropdown = parent && parent.querySelector(".dropdown");
      if (!dropdown) return;
      dropdown.setAttribute("aria-hidden", "true");

      const toggle = () => {
        const open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        dropdown.setAttribute("aria-hidden", String(open));
      };

      $$.on(btn, "click", toggle);
      $$.on(btn, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });

      // Close on outside click
      $$.on(document, "click", (ev) => {
        if (!parent.contains(ev.target)) closeDropdown(btn);
      });
    });

    function closeDropdown(btn) {
      const dd =
        btn.parentElement && btn.parentElement.querySelector(".dropdown");
      btn.setAttribute("aria-expanded", "false");
      dd && dd.setAttribute("aria-hidden", "true");
    }

    // Offcanvas collapsible submenus
    $$.qsa(SEL.collapseToggle).forEach((t) => {
      const toggle = () => {
        const expanded = t.getAttribute("aria-expanded") === "true";
        const next = t.nextElementSibling;
        if (!next) return;
        t.setAttribute("aria-expanded", String(!expanded));
        next.hidden = expanded;
      };
      $$.on(t, "click", toggle);
      $$.on(t, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  /* ====================================================================
     Generic Meter Helper
     - Expects structure:
       <div class="...__meter" role="meter">
         <span class="...__meter-bar"></span>
         <span class="...__percent"></span>
       </div>
     ==================================================================== */
  function setMeter(meterEl, support, total) {
    const p = $$.percent(support, total);
    meterEl.setAttribute("aria-valuemin", "0");
    meterEl.setAttribute("aria-valuemax", "100");
    meterEl.setAttribute("aria-valuenow", p.toFixed(1));

    const bar = meterEl.querySelector('[class$="__meter-bar"]');
    if (bar)
      requestAnimationFrame(() => (bar.style.inlineSize = `${p.toFixed(1)}%`));

    const percentEl = meterEl.querySelector('[class$="__percent"]');
    if (percentEl) percentEl.textContent = `%${p.toFixed(1)}`;
    return p;
  }

  /* ====================================================================
     Agenda Progress — auto from data-total / data-support
     - Fills numbers + meter + growth chip
     ==================================================================== */
  function initAgendaProgress() {
    $$.qsa(".agenda-card").forEach((card) => {
      const meter = $$.qs(".agenda-card__meter", card);
      if (!meter) return;

      const total = Number(meter.dataset.total ?? card.dataset.total ?? 0);
      const support = Number(
        meter.dataset.support ?? card.dataset.support ?? 0
      );
      const p = setMeter(meter, support, total);

      const remaining = Math.max(0, total - support);
      const setText = (sel, txt) => {
        const el = $$.qs(sel, card);
        if (el) el.textContent = txt;
      };
      setText('[data-field="required"]', `${$$.fmtInt(total)} $`);
      setText('[data-field="support"]', `${$$.fmtInt(support)} $`);
      setText('[data-field="remaining"]', `${$$.fmtInt(remaining)} $`);

      const growth = $$.qs(".agenda-card__growth", card);
      if (growth) {
        const val = p.toFixed(1);
        growth.textContent = `%${val}`;
        growth.setAttribute("aria-label", `growth ${val} percent`);
      }
    });
  }

  /* ====================================================================
     Donations Map (Leaflet) — initDonationMap()
     - Demo dataset inline (countries + campaigns)
     - Chips control (top-right) + markers highlighting
     - Syncs list/panel, hash, and localStorage
     ==================================================================== */
  function initDonationMap() {
    // DOM hooks
    const listEl = document.querySelector("#donationsList");
    const countEl = document.querySelector("#donationsCount");
    const countryName = document.querySelector(".donations__country-name");
    const countryFlag = document.querySelector(".donations__flag");
    const tpl = document.querySelector("#donationCardTpl");
    const chipsMount = document.querySelector("#countriesControlMount");

    if (!window.L || !listEl || !tpl) return; // Missing Leaflet or section

    // Data (demo)
    const DATA = {
      countries: [
        {
          code: "PS",
          name: "Palestine",
          flag: "assets/images/flags/ps.webp",
          lon: 35.2,
          lat: 31.9,
        },
        {
          code: "EG",
          name: "Egypt",
          flag: "assets/images/flags/eg.webp",
          lon: 30.0,
          lat: 26.0,
        },
        {
          code: "TR",
          name: "Turkey",
          flag: "assets/images/flags/tr.webp",
          lon: 35.0,
          lat: 39.0,
        },
        {
          code: "MA",
          name: "Morocco",
          flag: "assets/images/flags/ma.webp",
          lon: -7.0,
          lat: 31.0,
        },
        {
          code: "IN",
          name: "India",
          flag: "assets/images/flags/in.webp",
          lon: 78.9,
          lat: 20.5,
        },
        {
          code: "ID",
          name: "Indonesia",
          flag: "assets/images/flags/id.webp",
          lon: 113.0,
          lat: -0.8,
        },
      ],
      campaigns: {
        PS: [
          {
            title: "1000 Tent Aid Campaign for Gaza",
            img: "assets/images/agenda/slide-1.webp",
            donors: 6,
            total: 20000,
            support: 2920,
            country: "Palestine",
            flag: "assets/icons/flag-palestine.svg",
          },
          {
            title: "Emergency Food Support",
            img: "assets/images/agenda/slide-4.webp",
            donors: 14,
            total: 15000,
            support: 12030,
            country: "Palestine",
            flag: "assets/images/flags/ps.webp",
          },
        ],
        EG: [
          {
            title: "Dialysis Machines Support",
            img: "assets/images/agenda/slide-2.webp",
            donors: 7,
            total: 20000,
            support: 5460,
            country: "Egypt",
            flag: "assets/images/flags/eg.webp",
          },
        ],
        TR: [
          {
            title: "Winter Clothes for Orphans",
            img: "assets/images/agenda/slide-3.webp",
            donors: 10,
            total: 22000,
            support: 1100,
            country: "Turkey",
            flag: "assets/images/flags/tr.webp",
          },
        ],
        MA: [
          {
            title: "Earthquake Rebuild Houses",
            img: "assets/images/agenda/slide-3.webp",
            donors: 16,
            total: 26000,
            support: 11544,
            country: "Morocco",
            flag: "assets/icons/flag-morocco.svg",
          },
        ],
        IN: [
          {
            title: "Medical Aid for Flood Victims",
            img: "assets/images/agenda/slide-1.webp",
            donors: 12,
            total: 18000,
            support: 6840,
            country: "India",
            flag: "assets/images/flags/in.webp",
          },
          {
            title: "Food Packages for Villages",
            img: "assets/images/agenda/slide-2.webp",
            donors: 8,
            total: 12000,
            support: 4200,
            country: "India",
            flag: "assets/images/flags/in.webp",
          },
        ],
        ID: [
          {
            title: "Clean Water Wells",
            img: "assets/images/agenda/slide-4.webp",
            donors: 9,
            total: 12000,
            support: 8616,
            country: "Indonesia",
            flag: "assets/images/flags/id.webp",
          },
        ],
      },
    };

    // Card factory
    function buildCard(item) {
      const node = tpl.content.firstElementChild.cloneNode(true);
      node.querySelector(".donation-card__media img").src = item.img;
      node.querySelector(".donation-card__media img").alt = item.title;
      node.querySelector(".donation-card__title").textContent = item.title;
      node.querySelector(".donation-card__donors").textContent = item.donors;
      node.querySelector(".donation-card__country").textContent = item.country;
      node.querySelector(".donation-card__flag").src = item.flag;

      const meter = node.querySelector(".donation-card__meter");
      const p = setMeter(meter, item.support, item.total);

      node.querySelector(".donation-card__required").textContent = `${$$.fmtInt(
        item.total
      )} $`;
      node.querySelector(".donation-card__support").textContent = `${$$.fmtInt(
        item.support
      )} $`;
      node.querySelector(
        ".donation-card__remaining"
      ).textContent = `${$$.fmtInt(Math.max(0, item.total - item.support))} $`;

      node
        .querySelector('[aria-label="Add to wishlist"]')
        .addEventListener("click", () => $$.toast("Added to wishlist"));

      node
        .querySelector('[aria-label="Share"]')
        .addEventListener("click", async () => {
          try {
            if (navigator.share) {
              await navigator.share({
                title: item.title,
                text: "Support this campaign",
                url: location.href,
              });
              $$.toast("Shared successfully");
            } else {
              await navigator.clipboard.writeText(
                `${item.title} — ${location.href}`
              );
              $$.toast("Link copied to clipboard");
            }
          } catch {
            /* no-op */
          }
        });

      node
        .querySelector('[aria-label="Add to cart"]')
        .addEventListener("click", () => $$.toast("Added to cart"));

      return node;
    }

    // Render list for selected country
    function renderCountry(code) {
      const c = DATA.countries.find((x) => x.code === code);
      const list = DATA.campaigns[code] || [];
      countryName && (countryName.textContent = c?.name || "—");
      if (c?.flag && countryFlag) countryFlag.src = c.flag;

      listEl.setAttribute("aria-busy", "true");
      listEl.innerHTML = "";
      list.forEach((i) => listEl.appendChild(buildCard(i)));
      if (countEl) countEl.textContent = String(list.length);
      listEl.setAttribute("aria-busy", "false");
    }

    // Leaflet base map
    const map = L.map("map", { worldCopyJump: true, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 6,
      minZoom: 2,
      attribution: "",
    }).addTo(map);
    map.attributionControl.setPrefix(false);

    // Markers + bounds
    const markers = {};
    const latlngs = [];
    const defaultStyle = {
      radius: 6,
      color: "#fff",
      weight: 2,
      fillColor: "var(--color-primary)",
      fillOpacity: 1,
    };
    const activeStyle = {
      radius: 7,
      color: "#fff",
      weight: 2,
      fillColor: "var(--color-orange)",
      fillOpacity: 1,
    };

    DATA.countries.forEach((c) => {
      const latlng = [c.lat, c.lon];
      latlngs.push(latlng);
      const m = L.circleMarker(latlng, defaultStyle)
        .bindTooltip(c.name, {
          permanent: false,
          direction: "right",
          offset: [8, 0],
        })
        .on("click", () =>
          select(c.code, { pan: true, save: true, from: "marker" })
        )
        .on("mouseover", () => highlight(c.code, true))
        .on("mouseout", () => highlight(null))
        .addTo(map);
      m._code = c.code;
      markers[c.code] = m;
    });

    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds.pad(0.3));

    // Floating Countries Control
    const CountriesControl = L.Control.extend({
      options: { position: "topright" },
      onAdd: function () {
        const div = L.DomUtil.create(
          "div",
          "leaflet-control countries-control"
        );
        const head = document.createElement("div");
        head.className = "countries-control__head";
        head.innerHTML = `<strong>Countries</strong>`;
        const grid = document.createElement("div");
        grid.className = "countries-control__grid";

        DATA.countries.forEach((c) => {
          const count = (DATA.campaigns[c.code] || []).length;
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "country-chip";
          chip.dataset.code = c.code;
          chip.setAttribute("aria-pressed", "false");
          chip.innerHTML = `
            <img class="country-chip__flag" src="${c.flag}" alt="">
            <span class="country-chip__name">${c.name}</span>
            <span class="country-chip__count">(${count})</span>
          `;
          chip.addEventListener("click", () =>
            select(c.code, { pan: true, save: true, from: "chip" })
          );
          chip.addEventListener("mouseenter", () => highlight(c.code, true));
          chip.addEventListener("mouseleave", () => highlight(null));
          grid.appendChild(chip);
        });

        div.appendChild(head);
        div.appendChild(grid);
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        return div;
      },
    });

    const control = new CountriesControl();
    map.addControl(control);

    // Optional: move control into custom mount
    if (chipsMount) {
      const controlWrapper =
        document.querySelector(".countries-control")?.parentElement;
      if (controlWrapper && !chipsMount.contains(controlWrapper)) {
        chipsMount.appendChild(controlWrapper);
      }
    }

    // Selection & Highlighting
    let current = null;

    function setActiveMarker(code) {
      Object.values(markers).forEach((m) => {
        m.setStyle(defaultStyle);
        m._path?.classList.remove("is-active");
      });
      const mk = markers[code];
      if (mk) {
        mk.setStyle(activeStyle);
        mk._path?.classList.add("is-active");
      }
    }

    function updateChips(code) {
      document.querySelectorAll(".country-chip").forEach((chip) => {
        const is = chip.dataset.code === code;
        chip.setAttribute("aria-current", is ? "true" : "false");
        chip.setAttribute("aria-pressed", is ? "true" : "false");
      });
    }

    const flyToDebounced = $$.debounce((latlng) => {
      map.flyTo(latlng, $$.clamp(map.getZoom(), 3, 5), {
        duration: 0.7,
        easeLinearity: 0.25,
      });
    }, 10);

    function select(code, opts = { pan: false, save: false, from: "unknown" }) {
      const mk = markers[code];
      if (!mk) return;

      setActiveMarker(code);
      updateChips(code);
      renderCountry(code);

      if (opts.pan) flyToDebounced(mk.getLatLng());

      current = code;
      history.replaceState(null, "", `#${code}`);
      if (opts.save) localStorage.setItem("donations:last", code);
    }

    function highlight(code /* hover */) {
      document.querySelectorAll(".country-chip").forEach((chip) => {
        chip.style.outline =
          chip.dataset.code === code ? "2px solid var(--color-primary)" : "";
      });
      Object.entries(markers).forEach(([k, m]) => {
        if (k === code) m.setStyle({ ...activeStyle, fillOpacity: 1 });
        else if (k !== current)
          m.setStyle({ ...defaultStyle, fillOpacity: 0.9 });
      });
      // Guided pan on hover (disabled)
      // if (hover && code && markers[code]) flyToDebounced(markers[code].getLatLng());
    }

    // Keyboard navigation: ↑/↓ preview, Enter to pan/apply
    function indexOfCurrent() {
      return Math.max(
        0,
        DATA.countries.findIndex((c) => c.code === current)
      );
    }
    document.addEventListener("keydown", (e) => {
      const key = e.key;
      if (!["ArrowDown", "ArrowUp", "Enter"].includes(key)) return;
      const i = indexOfCurrent();
      if (key === "ArrowDown") {
        const n = (i + 1) % DATA.countries.length;
        const code = DATA.countries[n].code;
        updateChips(code);
        setActiveMarker(code);
        renderCountry(code);
        current = code;
        e.preventDefault();
      }
      if (key === "ArrowUp") {
        const p = (i - 1 + DATA.countries.length) % DATA.countries.length;
        const code = DATA.countries[p].code;
        updateChips(code);
        setActiveMarker(code);
        renderCountry(code);
        current = code;
        e.preventDefault();
      }
      if (key === "Enter") {
        if (current && markers[current])
          select(current, { pan: true, save: true, from: "keyboard" });
        e.preventDefault();
      }
    });

    // Initial selection (hash → localStorage → default)
    const initial =
      (location.hash || "").replace("#", "").toUpperCase() ||
      localStorage.getItem("donations:last") ||
      "PS";
    select(initial, { pan: false, save: false, from: "init" });

    // Panel hover shows tooltip for current country
    listEl.addEventListener("mouseover", () => {
      const m = markers[current];
      if (m) m.openTooltip();
    });
    listEl.addEventListener("mouseleave", () => {
      Object.values(markers).forEach((m) => m.closeTooltip());
    });
  }

  /* ====================================================================
     Impact Counters (IntersectionObserver)
     ==================================================================== */
  (function initImpactCounters() {
    const els = document.querySelectorAll(
      ".impact-stats .stat__value[data-count]"
    );
    if (!("IntersectionObserver" in window) || !els.length) return;

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = Number(el.dataset.count || 0);
          const dur = 1200;
          const start = performance.now();

          function tick(now) {
            const p = Math.min(1, (now - start) / dur);
            const val = Math.floor(target * easeOut(p));
            el.textContent = val.toLocaleString("en-US");
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
          io.unobserve(el);
        });
      },
      { threshold: 0.35 }
    );

    els.forEach((el) => io.observe(el));
  })();
})();

/* ====================================================================
   Donate Form (scoped)
   - Quantity stepper
   - Total price auto-calc (unit from .donate-form__amount[data-unit-price])
   ==================================================================== */
(() => {
  "use strict";

  const root = document.querySelector(".donate-form");
  if (!root) return;

  const qs = (s, r = root) => r.querySelector(s);
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  const qtyWrap = qs('[data-js="qty"]');
  const qtyInput = qs("#qty");
  const totalEl = qs('[data-js="total"]');
  const unitPriceEl = qs(".donate-form__amount");
  const unit = Number(unitPriceEl?.dataset.unitPrice || 0);

  const fmt = (n) => `$${Number(n || 0).toLocaleString("en-US")}`;

  function updateTotal() {
    const q = Number(qtyInput.value || 0);
    totalEl.textContent = fmt(unit * q);
  }

  // Stepper
  if (qtyWrap && qtyInput) {
    qtyWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".qty__btn");
      if (!btn) return;
      const act = btn.dataset.act;
      const curr = Number(qtyInput.value || 1);
      const next = clamp(act === "inc" ? curr + 1 : curr - 1, 1, 999);
      qtyInput.value = next;
      updateTotal();
    });

    qtyInput.addEventListener("input", () => {
      const val = clamp(parseInt(qtyInput.value || "1", 10) || 1, 1, 999);
      qtyInput.value = val;
      updateTotal();
    });
  }

  updateTotal();
})();

/* ====================================================================
   Cart logic (scoped / conflict-free)
   - Plus/Minus qty, delete, save-toggle
   - Totals & empty-state handling
   ==================================================================== */
(() => {
  "use strict";

  const root = document.querySelector(".cart");
  if (!root) return;

  const list = root.querySelector("#cartList");
  const totalEl = root.querySelector("#cartTotal");
  const clearBtn = root.querySelector("#cartClear");
  const emptyState = root.querySelector("#cartEmpty");

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const money = (n) =>
    `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

  // Row subtotal
  function updateRow(row) {
    const unit = Number(row.dataset.price || 0);
    const qtyInput = row.querySelector(".qty__input");
    const qty = clamp(parseInt(qtyInput.value, 10) || 0, 1, 99);
    qtyInput.value = qty;
    const subtotal = unit * qty;
    row.querySelector(".cart-item__subtotal-num").textContent = money(subtotal);
    return subtotal;
  }

  // Recalc all + toggle states
  function recalcAll() {
    const rows = [...list.querySelectorAll(".cart-item")];
    let sum = 0;
    rows.forEach((r) => (sum += updateRow(r)));
    totalEl.textContent = money(sum);

    const isEmpty = rows.length === 0;
    list.hidden = isEmpty;
    emptyState.hidden = !isEmpty;
  }

  // Delegated actions
  list.addEventListener("click", (e) => {
    const row = e.target.closest(".cart-item");
    if (!row) return;

    // Qty +
    if (e.target.closest(".qty__plus")) {
      const input = row.querySelector(".qty__input");
      input.value = clamp((parseInt(input.value, 10) || 0) + 1, 1, 99);
      recalcAll();
    }

    // Qty −
    if (e.target.closest(".qty__minus")) {
      const input = row.querySelector(".qty__input");
      input.value = clamp((parseInt(input.value, 10) || 0) - 1, 1, 99);
      recalcAll();
    }

    // Save toggle
    if (e.target.closest(".cart-save")) {
      const btn = e.target.closest(".cart-save");
      const pressed = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", String(!pressed));
    }

    // Delete row
    if (e.target.closest(".cart-delete")) {
      row.style.opacity = ".4";
      row.style.transform = "translateY(2px)";
      setTimeout(() => {
        row.remove();
        recalcAll();
      }, 160);
    }
  });

  // Manual qty edit
  list.addEventListener("input", (e) => {
    if (!e.target.classList.contains("qty__input")) return;
    e.target.value = e.target.value.replace(/[^\d]/g, "").slice(0, 2);
    recalcAll();
  });

  // Clear cart
  clearBtn?.addEventListener("click", () => {
    list.innerHTML = "";
    recalcAll();
  });

  // Initial
  recalcAll();
})();

/* ====================================================================
   Reusable Phone Field (intl-tel-input) — generic (no IDs)
   - Works for any .js-phone-field .v-phone elements (static/dynamic).
   - Creates hidden outputs: phone_e164 / phone_country_iso2 if missing.
   - Validates on input/blur/countrychange and on form submit.
   - Safe to initialize while dialog is closed.
   ==================================================================== */
(() => {
  "use strict";
  if (!window.intlTelInput) return;

  const PHONE_SELECTOR = ".js-phone-field .v-phone";
  const instances = new WeakMap(); // Avoid double init

  /** Initialize one phone input */
  function initPhone(input) {
    if (instances.has(input)) return;
    const field = input.closest(".js-phone-field") || input.parentElement;

    // Outputs (create if missing)
    let outE164 = field.querySelector('input[name="phone_e164"]');
    let outISO2 = field.querySelector('input[name="phone_country_iso2"]');
    let hint = field.querySelector(".v-hint");

    if (!outE164) {
      outE164 = document.createElement("input");
      outE164.type = "hidden";
      outE164.name = "phone_e164";
      field.appendChild(outE164);
    }
    if (!outISO2) {
      outISO2 = document.createElement("input");
      outISO2.type = "hidden";
      outISO2.name = "phone_country_iso2";
      field.appendChild(outISO2);
    }
    if (!hint) {
      hint = document.createElement("small");
      hint.className = "v-hint";
      hint.setAttribute("aria-live", "polite");
      field.appendChild(hint);
    }

    // Options (overridable via data-*)
    const initial = input.dataset.initial || "TR";
    const preferred = (input.dataset.preferred || "tr,ps,sy,us")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const iti = window.intlTelInput(input, {
      initialCountry: initial.toLowerCase(),
      preferredCountries: preferred,
      separateDialCode: true,
      nationalMode: false,
      autoPlaceholder: "aggressive",
      utilsScript: "assets/vendor/intl-tel-input/js/utils.js",
    });
    instances.set(input, iti);

    const update = () => {
      hint.textContent = "";
      input.setCustomValidity("");

      if (!input.value.trim()) {
        outE164.value = "";
        outISO2.value = iti.getSelectedCountryData()?.iso2 || "";
        return;
      }
      if (iti.isValidNumber()) {
        outE164.value = iti.getNumber(); // +90555...
        outISO2.value = iti.getSelectedCountryData()?.iso2 || "";
      } else {
        input.setCustomValidity("Invalid phone number");
        hint.textContent = "Please enter a valid phone number.";
        outE164.value = "";
        outISO2.value = iti.getSelectedCountryData()?.iso2 || "";
      }
    };

    input.addEventListener("input", update);
    input.addEventListener("blur", update);
    input.addEventListener("countrychange", update);

    // Validate on parent form submit
    const form = input.closest("form");
    form?.addEventListener("submit", (e) => {
      update();
      if (!form.checkValidity()) {
        e.preventDefault();
        input.reportValidity();
      }
    });

    // Prime defaults
    outISO2.value = iti.getSelectedCountryData()?.iso2 || initial.toLowerCase();
  }

  // Init existing
  document.querySelectorAll(PHONE_SELECTOR).forEach(initPhone);

  // Observe dynamic DOM (e.g., modals)
  const mo = new MutationObserver((muts) => {
    muts.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches?.(PHONE_SELECTOR)) initPhone(node);
        node.querySelectorAll?.(PHONE_SELECTOR).forEach(initPhone);
      });
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();

/* ====================================================================
   Mobile Bottom Nav — active state resolver
   - Matches by filename via data-match (e.g., "cart.html").
   - "/" maps to index.html.
   ==================================================================== */
(() => {
  "use strict";

  const bar = document.querySelector(".mb-nav");
  if (!bar) return;

  const file = (
    location.pathname.split("/").pop() || "index.html"
  ).toLowerCase();
  const items = bar.querySelectorAll(".mb-nav__item");

  let matched = false;
  items.forEach((a) => {
    if ((a.dataset.match || "").toLowerCase() === file) {
      items.forEach((x) => {
        x.classList.remove("is-active");
        x.removeAttribute("aria-current");
      });
      a.classList.add("is-active");
      a.setAttribute("aria-current", "page");
      matched = true;
    }
  });

  // Fallback: keep first item active if no match
  if (!matched && items.length) {
    items.forEach((x) => {
      x.classList.remove("is-active");
      x.removeAttribute("aria-current");
    });
    items[0].classList.add("is-active");
    items[0].setAttribute("aria-current", "page");
  }
})();
