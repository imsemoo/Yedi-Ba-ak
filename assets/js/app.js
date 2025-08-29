document.addEventListener('DOMContentLoaded', function () {
  // set current year
  var y = new Date().getFullYear();
  var yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = y;

  // reduced motion
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // RTL toggle
  var rtlBtn = document.getElementById('toggle-rtl');
  function setRtlState(enable) {
    var html = document.documentElement;
    if (enable) {
      html.setAttribute('dir', 'rtl');
      html.classList.add('rtl');
      rtlBtn && rtlBtn.setAttribute('aria-pressed', 'true');
    } else {
      html.removeAttribute('dir');
      html.classList.remove('rtl');
      rtlBtn && rtlBtn.setAttribute('aria-pressed', 'false');
    }
    // if swiper exists, update direction later
    if (window._themeSwiper && typeof window._themeSwiper === 'object') {
      try { window._themeSwiper.changeDirection && window._themeSwiper.changeDirection(enable ? 'rtl' : 'ltr'); } catch (e) { }
    }
  }
  if (rtlBtn) {
    rtlBtn.addEventListener('click', function () {
      var isRtl = document.documentElement.getAttribute('dir') === 'rtl';
      setRtlState(!isRtl);
    });
    // allow keyboard activation
    rtlBtn.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') rtlBtn.click(); });
  }

  // Init Swiper
  if (window.Swiper) {
    window._themeSwiper = new Swiper('.swiper', {
      loop: true,
      autoplay: reduced ? false : { delay: 3000, disableOnInteraction: false },
      pagination: { el: '.swiper-pagination', clickable: true },
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      a11y: { enabled: true },
      // RTL will be applied by the document dir; Swiper detects it if changeDirection is available
    });
    // make prev/next keyboard friendly if Swiper doesn't handle it
    var prev = document.querySelector('.swiper-button-prev');
    var next = document.querySelector('.swiper-button-next');
    [prev, next].forEach(function (btn) {
      if (!btn) return;
      btn.setAttribute('tabindex', '0');
      btn.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') btn.click(); });
    });
  }

  // Init AOS
  if (window.AOS) {
    AOS.init({ once: true, disable: reduced });
  }

  // Lightbox (defaults)
  if (window.lightbox && lightbox.option) {
    lightbox.option({ 'resizeDuration': 200, 'wrapAround': true });
  }

  /* Donation amount selector */
  (function () {
    var amounts = document.querySelectorAll('.amount-btn');
    var otherWrap = document.querySelector('.other-amount');
    var otherInput = document.getElementById('other-amount-input');
    var hidden = document.getElementById('donation-amount-hidden');
    if (!amounts || !hidden) return;
    amounts.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.getAttribute('data-amount');
        amounts.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        if (v === 'other') {
          otherWrap && (otherWrap.style.display = 'block');
          otherInput && otherInput.focus();
          hidden.value = '';
        } else {
          otherWrap && (otherWrap.style.display = 'none');
          hidden.value = v;
        }
      });
      // keyboard support
      btn.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') btn.click(); });
    });
    if (otherInput) {
      otherInput.addEventListener('input', function () {
        var val = parseInt(otherInput.value, 10);
        hidden.value = (!isNaN(val) && val >= 10) ? val : '';
      });
    }
    // donation form submit - simple visual validation
    var dform = document.getElementById('donation-form');
    if (dform) {
      dform.addEventListener('submit', function (e) {
        e.preventDefault();
        var amt = hidden.value;
        if (!amt) {
          alert('يرجى اختيار مبلغ صالح (الحد الأدنى 10).');
          return;
        }
        // show a temporary thank you
        var btn = dform.querySelector('button[type=submit]');
        btn.textContent = 'شكراً — تم التبرع';
        setTimeout(function () { btn.textContent = 'تبرّع الآن'; }, 3000);
      });
    }
  })();

  /* Header behaviors: sticky shadow, offcanvas menu, dropdowns, keyboard accessibility */
  (function () {
    var header = document.querySelector('.site-header');
    var mainbar = document.querySelector('.mainbar');
    var navToggle = document.getElementById('nav-toggle');
    var offcanvas = document.getElementById('offcanvas');
    var offOverlay = document.querySelector('.offcanvas__overlay');
    var offClose = document.querySelector('.offcanvas__close');

    // sticky shadow on scroll
    function onScroll() {
      var scrolled = window.scrollY > 8;
      if (mainbar) mainbar.setAttribute('data-scrolled', scrolled ? 'true' : 'false');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // body scroll lock helpers
    function lockBody() { document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; }
    function unlockBody() { document.documentElement.style.overflow = ''; document.body.style.overflow = ''; }

    // open offcanvas
    function openOffcanvas() {
      if (!offcanvas) return;
      offcanvas.hidden = false; offcanvas.setAttribute('aria-hidden', 'false');
      offOverlay.hidden = false; offOverlay.setAttribute('aria-hidden', 'false');
      navToggle && navToggle.setAttribute('aria-expanded', 'true');
      // animate in
      requestAnimationFrame(function () { offcanvas.setAttribute('aria-hidden', 'false'); offcanvas.style.transform = 'translateX(0)'; });
      lockBody();
      // focus first focusable
      var focusable = offcanvas.querySelector('button, [href], input, select, textarea');
      focusable && focusable.focus();
    }

    function closeOffcanvas() {
      if (!offcanvas) return;
      offcanvas.style.transform = '';
      offcanvas.hidden = true; offcanvas.setAttribute('aria-hidden', 'true');
      offOverlay.hidden = true; offOverlay.setAttribute('aria-hidden', 'true');
      navToggle && navToggle.setAttribute('aria-expanded', 'false');
      unlockBody();
      navToggle && navToggle.focus();
    }

    if (navToggle) {
      navToggle.addEventListener('click', function () {
        var expanded = navToggle.getAttribute('aria-expanded') === 'true';
        if (expanded) closeOffcanvas(); else openOffcanvas();
      });
      navToggle.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') navToggle.click(); });
    }
    if (offClose) offClose.addEventListener('click', closeOffcanvas);
    if (offOverlay) offOverlay.addEventListener('click', closeOffcanvas);

    // ESC closes offcanvas or dropdowns
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        // close offcanvas if open
        if (offcanvas && !offcanvas.hidden) { closeOffcanvas(); }
        // close any open dropdowns
        document.querySelectorAll('.has-dropdown .dropdown-toggle[aria-expanded="true"]').forEach(function (btn) {
          btn.setAttribute('aria-expanded', 'false');
          var dd = btn.parentNode.querySelector('.dropdown'); if (dd) dd.setAttribute('aria-hidden', 'true');
        });
      }
    });

    // dropdown behavior (desktop & keyboard)
    document.querySelectorAll('.has-dropdown .dropdown-toggle').forEach(function (btn) {
      var parent = btn.parentNode;
      var dropdown = parent.querySelector('.dropdown');
      if (!dropdown) return;
      dropdown.setAttribute('aria-hidden', 'true');
      btn.addEventListener('click', function (e) {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        dropdown.setAttribute('aria-hidden', open ? 'true' : 'false');
      });
      // keyboard support
      btn.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') btn.click(); });
      // close on outside click
      document.addEventListener('click', function (ev) {
        if (!parent.contains(ev.target)) {
          btn.setAttribute('aria-expanded', 'false'); dropdown.setAttribute('aria-hidden', 'true');
        }
      });
    });

    // offcanvas collapsible submenu toggles
    document.querySelectorAll('.collapse-toggle').forEach(function (t) {
      t.addEventListener('click', function () {
        var expanded = t.getAttribute('aria-expanded') === 'true';
        var next = t.nextElementSibling;
        if (!next) return;
        if (expanded) { next.hidden = true; t.setAttribute('aria-expanded', 'false'); } else { next.hidden = false; t.setAttribute('aria-expanded', 'true'); }
      });
      t.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') t.click(); });
    });

  })();

  /* Volunteer form validation */
  (function () {
    var form = document.getElementById('volunteer-form');
    var live = document.getElementById('volunteer-messages');
    if (!form) return;
    function showMessage(msg, isError) {
      if (live) { live.textContent = msg; live.setAttribute('role', 'status'); if (isError) live.classList.add('error'); else live.classList.remove('error'); }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="name"]').value.trim();
      var email = form.querySelector('[name="email"]').value.trim();
      var ok = true; var msg = '';
      if (name.length < 2) { ok = false; msg = 'الاسم يجب أن يحتوي على حرفين على الأقل.' }
      var emailRe = /^\S+@\S+\.\S+$/;
      if (!emailRe.test(email)) { ok = false; msg = msg ? msg + ' ' + 'الرجاء إدخال بريد إلكتروني صالح.' : 'الرجاء إدخال بريد إلكتروني صالح.' }
      if (!ok) { showMessage(msg, true); return; }
      // success state
      showMessage('تم الإرسال بنجاح – سنعاود الاتصال بك قريبًا.', false);
      // reset form (non-persistent)
      form.reset();
      // show card success visually
      var success = document.createElement('div'); success.className = 'card'; success.textContent = 'تم استلام طلبك';
      form.parentNode.insertBefore(success, form);
      setTimeout(function () { if (success && success.parentNode) success.parentNode.removeChild(success); }, 5000);
    });
  })();
});
