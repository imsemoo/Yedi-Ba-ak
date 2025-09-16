/**
 * Minimal, production-ready modal controller.
 * - Open via:   [data-modal-open="DIALOG_ID"]
 * - Close via:  [data-modal-close] inside the dialog
 * - Features: focus trap, ESC/backdrop close, restore focus, no deps.
 */
(() => {
  'use strict';
  if (!('HTMLDialogElement' in window)) return;

  const SELECTORS = {
    open: '[data-modal-open]',
    close: '[data-modal-close]',
    modals: 'dialog.v-modal'
  };

  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const state = { active: null, lastFocus: null };

  const trap = (e) => {
    if (e.key !== 'Tab' || !state.active) return;
    const nodes = [...state.active.querySelectorAll(FOCUSABLE)];
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  };

  const openModal = (dlg) => {
    if (state.active === dlg) return;
    state.lastFocus = document.activeElement;
    state.active = dlg;
    dlg.showModal();
    document.documentElement.classList.add('is-modal-open');

    // focus first interactive element (prefer [autofocus])
    (dlg.querySelector('[autofocus]') || dlg.querySelector(FOCUSABLE))?.focus();

    dlg.addEventListener('keydown', trap);
  };

  const closeModal = (dlg) => {
    if (!dlg.open) return;
    dlg.close();
    document.documentElement.classList.remove('is-modal-open');
    dlg.removeEventListener('keydown', trap);
    state.active = null;
    state.lastFocus?.focus();
  };

  // Global delegation for open/close
  document.addEventListener('click', (e) => {
    const openBtn = e.target.closest(SELECTORS.open);
    if (openBtn) {
      e.preventDefault();
      const id = openBtn.getAttribute('data-modal-open');
      const dlg = document.getElementById(id);
      if (dlg) openModal(dlg);
    }

    const closeBtn = e.target.closest(SELECTORS.close);
    if (closeBtn) {
      e.preventDefault();
      const dlg = closeBtn.closest('dialog');
      if (dlg) closeModal(dlg);
    }
  });

  // Backdrop + ESC (cancel)
  document.querySelectorAll(SELECTORS.modals).forEach((dlg) => {
    dlg.addEventListener('click', (e) => { if (e.target === dlg) closeModal(dlg); });
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeModal(dlg); });

    // Optional: intercept form submit
    dlg.querySelector('form')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      // TODO: fetch(...) then:
      closeModal(dlg);
    });
  });
})();