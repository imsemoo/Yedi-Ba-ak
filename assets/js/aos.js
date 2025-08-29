/* Placeholder AOS init shim */
window.AOS = {
  init: function (opts) {
    document.querySelectorAll('[data-aos]').forEach(function (el) {
      el.classList.add('aos-animate');
    });
  }
};
