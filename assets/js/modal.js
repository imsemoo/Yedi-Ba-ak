(() => {
  'use strict';

  // Guard: if <dialog> unsupported, bail quietly
  if (!('HTMLDialogElement' in window)) return;

  const modal = document.getElementById('volunteerModal');
  const openers = document.querySelectorAll('.js-open-volunteer');
  const btnClose = document.getElementById('volClose');

  // Cache focusables for a simple trap
  const focusSelectors = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const trap = (e) => {
    if (e.key !== 'Tab') return;
    const f = modal.querySelectorAll(focusSelectors);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  };

  const open = () => {
    modal.showModal();
    document.documentElement.classList.add('is-modal-open');
    // focus first field
    const firstField = modal.querySelector('input, select, button');
    firstField && firstField.focus();
    modal.addEventListener('keydown', trap);
  };

  const close = () => {
    modal.close();
    document.documentElement.classList.remove('is-modal-open');
    modal.removeEventListener('keydown', trap);
  };

  // Open triggers
  openers.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    open();
  }));

  // Close triggers
  btnClose.addEventListener('click', close);

  // Click on backdrop
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  // Esc to close (native 'cancel' still needs preventDefault on some UAs)
  modal.addEventListener('cancel', (e) => { e.preventDefault(); close(); });

  // Optional: intercept submit to show success state or send via fetch
  modal.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    // TODO: send data via fetch(...)
    close();
  });
})();
