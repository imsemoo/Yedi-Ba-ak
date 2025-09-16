## Yedi-Ba-ak — Front-end Theme Foundation

This repository contains a minimal, local HTML theme foundation intended for lightweight projects, prototypes, or starting points for static websites. It intentionally avoids build tools and CDN dependencies so the code can run offline and be inspected easily.

This README documents the project structure, usage, development notes, deployment recommendations, accessibility considerations, and contribution guidelines.

## Table of Contents

- Project overview
- Quick start
- File structure
- Features
- Usage and configuration
- Development notes
- Production checklist
- Accessibility & internationalization
- Troubleshooting
- Contributing
- License & contact

## Project overview

Yedi-Ba-ak is a static front-end theme foundation built with plain HTML, CSS, and JavaScript. It includes:

- A homepage with a hero carousel and common sections
- A components/demo page showcasing UI patterns
- Local vendor assets (CSS/JS) and a small `app.js` for initial behaviors
- A simple RTL toggle and respectful motion settings

The goal is to provide a small, dependency-free starter that can be adapted to production by swapping in official vendor builds and optimizing assets.

## Quick start

1. Open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari). No build step required.
2. Visit `components.html` to review UI components, grid examples, and the Lightbox demo.
3. Inspect `assets/css/style.css` and `assets/js/app.js` to customize the theme and behavior.

Tip: Use the RTL toggle in the header to quickly preview right-to-left layout.

## File structure

Top-level files

- `index.html` — main landing page with hero carousel, features, and footer
- `components.html` — UI kit demonstrations (buttons, cards, grid, lightbox)
- Other demo pages: `about.html`, `media.html`, `campaign-details.html`, `cart.html`, `payment.html`, `sacrifice.html`, `activities.html`, `media-details.html`, `account-number.html`, `president-message.html`

Assets

- `assets/css/` — vendor CSS files and `style.css` (design tokens, base styles, components)
- `assets/js/` — vendor JS files and `app.js` (initialization and small helpers)
- `assets/images/` — images used in the demo pages
- `assets/fonts/` — local font files (Jost family) and webfont files under `webfonts/`
- `assets/icons/` — SVG/icon assets

Docs

- `docs/README.md` — this file

Note: Vendor files under `assets/css` and `assets/js` are included as local placeholders. Replace them with official, minified distributions for production.

## Features

- Lightweight static HTML (no build tools required)
- Example hero carousel (uses Swiper or a placeholder)
- Components demo page with buttons, cards, grid layout, and Lightbox image gallery
- RTL support with a toggle that updates the `<html>` `dir` attribute and applies `.rtl` styles
- Motion preference awareness — autoplay and animations respect `prefers-reduced-motion`
- Local Font Awesome CSS used for icons (pre-bundled woff2 fonts included)

## Usage and configuration

Styling

- Primary stylesheet: `assets/css/style.css`. Modify tokens, colors, and component styles here.
- Vendor CSS files (AOS, Swiper, animate.css, Lightbox) live alongside `style.css` for local testing.

JavaScript

- Entry script: `assets/js/app.js`. This file initializes components (carousel, lightbox, AOS) and provides small helpers like RTL toggle and cookie/localStorage utilities.
- Vendor JS (Swiper, AOS, Lightbox) is included locally. Replace with full distributions to enable complete behavior if placeholder shims are present.

Configuration points

- RTL toggle: the header control toggles the `dir` attribute and adds/removes `.rtl` on `<html>`. Check `app.js` for the exact implementation and change persistence (cookie/localStorage).
- Autoplay and animations: respect `prefers-reduced-motion` via CSS and JS; see `style.css` and `app.js`.

Customizing

1. Edit `assets/css/style.css` to override colors, spacing, and typography.
2. Edit `assets/js/app.js` to add behaviors or wire additional components.
3. Replace placeholder vendor files in `assets/css` and `assets/js` with production builds.

## Development notes

- No Node.js, NPM, or build tool is required. Open files directly in a browser for quick iteration.
- For local development with live reload, you may run a simple static file server. Example (PowerShell):

```powershell
# Start a simple Python HTTP server on port 8000
python -m http.server 8000

# or using Node.js http-server if available
npx http-server -p 8000
```

- When using a server, open http://localhost:8000/ in your browser and navigate to the project root.

Assumptions

- This project is intended as a static front-end prototype. No backend integration or build pipeline is present by default.

## Production checklist

Before deploying, follow this checklist to prepare a production-ready site:

1. Replace vendor placeholder files with official minified CSS/JS for Swiper, Lightbox (or Lightbox2), AOS, and animate.css.
2. Optimize and compress images: use WebP or optimized PNG/JPEG, generate multiple sizes for responsive `srcset`.
3. Generate and use a production webfont subset if necessary (woff/woff2) to reduce payload.
4. Enable appropriate cache headers on your web server or CDN.
5. Minify and concatenate CSS/JS as appropriate for your hosting environment.
6. Verify accessibility and keyboard navigation (see Accessibility section).

## Accessibility & internationalization

Accessibility

- All interactive controls should be reachable by keyboard (Tab/Shift+Tab). Verify focus outlines and visible focus styles.
- Use appropriate semantic HTML (headings, landmarks, buttons vs anchors) when modifying templates.
- Provide alt text for all meaningful images in `assets/images`.
- Ensure color contrast meets WCAG AA for text and interactive elements.

Internationalization and RTL

- The project includes an RTL toggle for demonstration. When adding RTL support for production, verify mirrored layouts for margins, paddings, and float/align rules.
- Use `dir="rtl"` on the HTML element for right-to-left locales and consider separate localized assets if needed.

## Troubleshooting

- Carousel not working: check that the vendor Swiper JS/CSS are the real production builds and that `app.js` correctly initializes the Swiper instance.
- Lightbox not opening: confirm the Lightbox JS is loaded and selectors match demo markup on `components.html`.
- Fonts not loading: ensure `assets/webfonts/` and `assets/fonts/` paths are correct and that the browser can access the files (CORS/URL issues when using a server).

If you see console errors, open the browser devtools and inspect the network tab to see 404s or blocked MIME types.

## Contributing

Small contributions are welcome. Because this is a static prototype, please follow these guidelines:

1. Open an issue describing the change or bug.
2. Fork the repository and create a branch for your change.
3. Keep changes focused: update `assets/css/style.css` for style-only changes and `assets/js/app.js` for behavior.
4. Do not introduce build tools without discussing the rationale — the value of this project is being build-free.

If you need to add tests or tooling, document it in the issue and provide migration notes.

## License & contact

Include your preferred license file in the repository root (for example, `LICENSE`). If none is present, assume this is an internal or demo project.

For questions or improvements, open an issue in the repository.

---

Requirements coverage

- Task: "Update the README.md file to include full project documentation in English." — Done (this file).
