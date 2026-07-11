# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single static marketing page for Ets Lévêque, a heating/plumbing/electrical company in Notre Dame de Sanilhac (Dordogne, France). No framework, no build step, no package manager — plain HTML/CSS/vanilla JS served as-is.

## Running locally

There is no build/lint/test tooling. Serve the directory statically and open it in a browser:

```
npx --yes serve -l 8080 .
```

## Architecture

`index.html` is the only page. It pulls in CSS files individually (one per section/concern, loaded in this order in `<head>`) and four plain `<script>` tags at the end of `<body>` — no bundler, no modules.

- `css/tokens.css` — design tokens (`:root` custom properties): colors, font stacks, type scale, 8px spacing scale, easing/duration, radius/shadow. Every other CSS file consumes these variables rather than hardcoding values.
- `css/base.css`, `header.css`, `contact.css`, etc. — one stylesheet per section, named to match the section it styles.
- `css/scrollvid.css` — shared styling for the two scroll-scrubbed video sections (hero + drone).
- `css/stove.css` — styling for the `#poele` section (see video-in-view below).
- `js/scroll-video.js` — canvas-based "scroll-scrubbed video" effect (see below). Runs on `DOMContentLoaded` for every `.scrollvid` section.
- `js/stats.js` — builds and animates the big numbers in the "chiffres clés" section (`#chiffres`), see below.
- `js/reveal.js` — generic fade/slide-in-on-scroll for any element with class `.reveal` (same one-shot `IntersectionObserver` pattern).
- `js/video-inview.js` — scroll-locking video playback for any `.video-inview` element (see below). Currently used by the `#poele` (wood stove) section.

### Scroll-scrubbed video sections (hero + drone)

The hero and the drone-shot section (`#hero`, `#drone` in `index.html`) aren't real playing videos on desktop — they're an image-sequence flipbook drawn to a `<canvas>`, advanced by scroll position, implemented in `js/scroll-video.js`:

- Each section declares `data-frame-count`, `data-frame-prefix`, `data-frame-ext` and contains a `.scrollvid__sticky` wrapper with a `<canvas>` and a fallback `<video>`.
- **Desktop / no reduced-motion**: the `<video>` element is removed from the DOM entirely; frames (`assets/hero-frames/frame_NNN.webp`, `assets/hero-frames-2/...`) are fetched progressively and decoded to `ImageBitmap` on scroll (rAF-throttled). The hero section (`priority: "high"`) eagerly fetches its first 20 frames on load; every other section (`priority: "low"`, e.g. drone) defers all fetching to `requestIdleCallback` so it never steals bandwidth from the hero during initial page load. Once decoded, bitmaps are kept in memory for the life of the page — **there is no eviction/windowing**; a bounded rolling window was tried and reintroduced stutter without fixing anything, so don't reintroduce one without being explicitly asked (see the comment above `PRIORITY_RADIUS` in `scroll-video.js`). A `PRIORITY_RADIUS` of 12 frames around the current scroll position is force-fetched+decoded symmetrically (both directions) on every scroll tick so fast scrolling — forward or backward — stays smooth even ahead of the background progressive load.
- **Mobile (`max-width: 768px`) or `prefers-reduced-motion: reduce`**: the canvas is removed instead, and the native `<video>` just autoplays/loops — no frame-by-frame decode work.
- Scroll listeners on both sections skip all decode/draw work when the section is far outside the viewport (see the early-return in `onScroll`), since both sections have independent listeners running simultaneously.
- The drone section also has scroll-linked "chapter" text overlays (`.scrollvid__chapter[data-from]`) driven by the same scroll progress value, with a configurable fade-out window near the end (`data-fade-out-start` / `data-fade-out-end`) so text doesn't get clipped by the next section.
- Changing frame counts/paths means regenerating the whole `assets/hero-frames*/frame_NNN.webp` sequence to match — the JS assumes zero-padded 3-digit filenames starting at `frame_001`.

### Scroll-locked in-view video (`js/video-inview.js`)

Distinct from the scroll-scrubbed sections above: a `.video-inview` element (a real `<video>`, not canvas frames) plays straight through once its section is ~fully in view, and **locks page scroll** (wheel/touchmove/arrow-keys/space/home/end all `preventDefault`ed, `body.style.overflow = "hidden"`) until playback ends, then unlocks and reveals a `.video-inview-reveal` overlay. Key details if you touch this:

- Triggers at `IntersectionObserver` threshold `0.98` (near-total visibility) specifically so the lock doesn't engage while the section is still scrolling up from below the fold.
- No-ops entirely under `prefers-reduced-motion: reduce`, since the video won't autoplay and locking scroll behind a static poster would trap the user.
- Playback rate is hardcoded to `1.5x` (`PLAYBACK_RATE`) for pacing.
- Has two independent unlock paths — the video's `ended` event, and a `loadedmetadata`-computed timeout fallback (`duration / rate + 2s`) — plus an unlock-on-`play()`-rejection catch, so a user is never permanently stuck if playback stalls or is blocked by the browser.

### "Chiffres clés" numbers (`#chiffres`, `js/stats.js`)

Each `.meter[data-target]` gets its number written into `.meter__readout` as **plain text** (`Number(...).toLocaleString("fr-FR")`), not markup built from individual digit spans:

- An earlier version rendered each digit as its own scrollable column (an odometer/slot-machine effect) so the numbers could roll to their final value. It was scrapped **twice** after real regressions: (1) a `background-clip: text` gradient set on the outer `.meter__readout` doesn't paint through nested `inline-block`/`flex` digit columns, silently rendering the numbers invisible — background-clip:text only works through simple inline descendants (a plain `<span>` like `.meter__unit`), not through boxes that establish their own formatting context; (2) forcing every digit into a fixed `ch`-wide box kills the font's natural letter-spacing/kerning, which reads as "the typography changed" even though the `font-family` didn't. Don't reintroduce a per-digit column structure without being explicitly asked — plain text is the stable, requested state.
- Entrance animation (`.meter.is-visible`) and the continuous scroll parallax are deliberately driven by **different CSS properties** so they never fight: entrance uses `opacity` + `scale` + `filter: blur()` (toggled via the `.is-visible` class from an `IntersectionObserver`), while parallax uses the standalone `translate` property, set continuously from JS (`initParallax` in `stats.js`, rAF-throttled `scroll` listener) with a short `translate` transition for smoothing. Because `translate`/`scale` are independent CSS properties here (not the `transform` shorthand), JS can update one without clobbering the other.
- Hover applies a second, wider gradient (`.meter:hover .meter__readout`) animated via `background-position` (`@keyframes meter-wave`) for a "color sweep" — kept to two stops (ink `--slate` + this meter's own `--accent`, alternating blue/red per `nth-child`) on purpose; an earlier 6-stop red+blue+slate version read as "rainbow" and was rejected.
- `--font-numeral` (`tokens.css`, currently `"Inter"`) is the dedicated display face for these big numbers — deliberately different from `--font-display` (Archivo, used for headings) so the digits read as a distinct "stat" typographic voice. This has been swapped several times (Archivo → Anton → Sora → Inter) chasing a specific reference look; treat the current value as the settled one, not a placeholder.
- `.certs__marquee` (RGE certification badges) sits above `.container` inside `#chiffres`, right under the `#poele` video — it reuses the exact marquee technique from `.partners` (3x duplicated `.certs__set`, CSS `@keyframes` translateX loop, edge mask-image), just under a different class name. The 6 logos (`assets/img/logos/rge-*.png`) were cropped out of a single combined sprite (`RGE-LOGOS-2-e1732697760471.png`) with a one-off Pillow script (not committed) — the sprite is a 3×2 grid; if it ever needs re-cropping there's no build tooling for it, just ad hoc image work.

### Design tokens vs. `ets-leveque-plan-refonte.md`

`ets-leveque-plan-refonte.md` is the original French-language design brief/plan for the visual refresh (color system, typography, phase-by-phase execution plan, a ready-to-paste prompt). It proposed a teal/copper palette (`--copper`, `--teal-deep`, etc.). **The palette actually implemented in `css/tokens.css` diverged from that plan**: it's now derived from the real company logo (red `--red: #FF0000` + blue `--blue: #18A1B4`), with `--teal-active` aliased to `--blue`. When touching colors, treat `tokens.css` as the source of truth over the plan doc — the plan describes intent/history, not current state. Typography, spacing scale, and motion tokens from the plan were kept as implemented.

### Content constraints

Real business content (Google reviews, RGE certifications, partner logos, phone/address, activity descriptions) should be preserved verbatim — this is a lead-gen site and the reviews/stats are genuine business data (e.g. "3990 mètres de cuivre déroulés en 2025"), not placeholder copy. Partner logos (Viessmann, Mitsubishi Electric, Legrand, Hargassner, Hoben, BWT) must never be recolored/retouched.

### Conventions

- CSS classes follow BEM-ish naming per component (`.meter__readout`, `.review-card__meta`, `.activity-card--teal`), scoped one file per section.
- Motion respects `prefers-reduced-motion` throughout (see `tokens.css` media query zeroing `--dur-*`, and the explicit checks in `scroll-video.js` / `stats.js`).
- Marquee-style infinite scrollers (partners logos, review columns) are done by duplicating the content block 2-3x in the HTML (`.partners__set[aria-hidden="true"]`, `.reviews__set[aria-hidden="true"]`) and animating with CSS, not JS.
