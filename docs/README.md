Theme Foundation (local)

Minimal, local HTML theme foundation with no build tools. Replace vendor placeholders with production builds when ready.

File tree

- `index.html` — foundation page with hero carousel, features, and footer
- `components.html` — UI kit samples (buttons, cards, grid, lightbox)
- `assets/css/` — vendor CSS + `style.css` (tokens + base + components)
- `assets/js/` — vendor JS + `app.js` (init + small helpers)
- Local Font Awesome CSS under `assets/css/` (`fontawesome.min.css`, `solid.min.css`, `brands.min.css`) — used instead of an SVG sprite
- `assets/images/` — example images

Quick start

1. Open `index.html` in your browser.
2. Open `components.html` to see the UI kit and Lightbox demo.
3. Toggle RTL with the RTL button in the header.

Production notes

- Replace placeholder vendor files in `assets/css` and `assets/js` with official minified distributions for Swiper, Lightbox2, AOS, and animate.css.
- Provide optimized images in `assets/images` and add fonts to `assets/fonts`.

Acceptance checklist

- No CDN links — all assets local (placeholder vendor files included).
- No Owl Carousel included.
- Swiper, Lightbox, and AOS are wired; replace shims with full libs for full behavior.
- RTL toggle available and updates `dir` + `.rtl` on `<html>`.
- Autoplay respects `prefers-reduced-motion`.

Contact
Extend `style.css` and `app.js` for custom theming and behaviors.
