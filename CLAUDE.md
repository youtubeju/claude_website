# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Workspace for a business that modernizes old French BTP (bâtiment/travaux publics — construction
trade: chauffagiste, maçon, couvreur, électricien, etc.) company websites into animated, modern,
static sites while strictly preserving the client's real brand (logo, colors, services, real
testimonials, real copy — never fabricated content).

There is no root-level build system, package manager, or test suite — this repo holds per-client
deliverables (`clients/<client-slug>/`), the project plan, a repo-local copy of the orchestrator
agent, and reusable design-component references. Each client site is a self-contained static
HTML/CSS/JS project with no build step.

## Plan, agent, and skills (everything is repo-local now)

Everything built in this project is committed here — nothing lives only in a session's temporary
state, and a fresh session opening this repo has the full history of iterations:

- **Plan**: `docs/plan-btp-site-modernizer.md` — the original implementation plan for the whole
  `btp-site-modernizer` skill + `btp-modernization-orchestrator` agent (architecture, extraction
  schema, phase design, verification approach). Read this for the *why* behind the pipeline shape.
- **Agent**: `.claude/agents/btp-modernization-orchestrator.md` — the orchestrator agent (6-phase
  pipeline, fast parallel-build protocol, performance budget). Claude Code auto-loads project-level
  agents from `.claude/agents/`, so this copy is what actually runs when this repo is open.
- **Skills**: `.claude/skills/btp-site-modernizer/` (`SKILL.md` + `references/*.md` +
  `scripts/extract-site.mjs` — the extraction script, BTP design knowledge, brand-fidelity rules,
  métier vocabulary) and `.claude/skills/ui-ux-pro-max/` (general UI/UX design intelligence).
  Claude Code auto-loads project-level skills from `.claude/skills/` the same way as agents.

Read `.claude/skills/btp-site-modernizer/SKILL.md` before doing modernization work — it defines the
phases (extraction → design direction → build → self-critique → motion polish → mobile pass →
final validation) and the non-negotiable brand-fidelity contract (no invented services, reviews,
certifications, or stats — ask the client instead of guessing).

`.claude/skills/btp-site-modernizer/scripts/` needs its npm dependencies installed once per
environment (`node_modules/` is gitignored, not committed — see that folder's own README.md):
```bash
cd .claude/skills/btp-site-modernizer/scripts && npm install && npx playwright install chromium
```

These same skill/agent files also exist under `~/.claude/skills/` and `~/.claude/agents/` (the
global, cross-repo install) — the two can drift. Treat the copies in this repo as authoritative for
work on this project; re-sync `~/.claude/` manually if you need the latest version available in
other repos too.

## Client directory structure

```
clients/<client-slug>/
├── source/                # raw material handed over by the client (e.g. hero-video.mp4) — never
│                          # generated, never delete
├── extraction/            # output of scripts/extract-site.mjs against the client's old site
│   ├── dossier.json       # structured extraction: meta, brand, company, sections, testimonials, images
│   ├── extraction-report.md
│   ├── images/, screenshots/, logo/
├── site-old-content/      # previous build, KEPT as the source-of-truth for real content on rebuilds
│                          # (never delete — rebuilding the design from scratch reads content from here)
└── site/                  # the current deliverable
    ├── index.html, nos-activites.html, notre-histoire.html, notre-equipe.html,
    │   realisations.html, avis-clients.html, contact.html, mentions-legales.html
    ├── css/main.css        # single design-system stylesheet (CSS custom properties, no preprocessor)
    ├── js/main.js          # nav, reveals, counters, timeline scrub, magnetic buttons
    ├── js/hero-sequence.js # scroll-driven video-frame sequence (see below)
    ├── js/bg-*.js          # ported/recolored background components (see "Background components")
    └── assets/{img,hero-frames}/
```

Rebuild convention: when redoing a site's design, treat `site-old-content/` as the immutable
content source (real copy, image filenames, testimonial text) and only regenerate `css/`, `js/`,
and the HTML shell/classes — never invent new copy in the process.

## Stack and non-negotiable performance lessons

Static HTML + GSAP + ScrollTrigger via CDN (jsdelivr), no bundler, no smooth-scroll library. These
were learned the hard way on this project and must not be reintroduced:

- **No Lenis / smooth-scroll JS.** It amplifies any jank into "the page barely scrolls" on
  mid-range hardware. Scroll is native (`html { scroll-behavior: smooth }` for anchors only).
- **No `filter: blur()` on a full-screen animated canvas/element.** This was the #1 fluidity
  killer found in testing. Ambient background effects use static CSS gradients or shapes animated
  via `transform` only (GPU-cheap), not per-frame canvas blur.
- **`backdrop-filter` only on small surfaces** (cards), never full-viewport.
- **Scroll-driven hero video sequences use `position: sticky` (native), not a GSAP `pin`.** The
  pinned version desynced on scroll jumps (Home/End keys, anchor links). The `.hero` element is a
  tall scroll track (e.g. `215vh`); `.hero-sticky` inside it stays glued via CSS while
  `ScrollTrigger` just reads scroll progress against the tall track (`start: "top top"`,
  `end: "bottom bottom"`) to pick the frame — no pin.
- **Hero frame sequences: WebP, ≤ ~50 KB/frame**, exported via ffmpeg (`fps=10.5,scale=800:450`,
  `libwebp -quality 68`). Loader does sparse-first progressive loading (every 8th frame, then
  4th, 2nd, all — concurrency capped ~6) so the sequence is scrubbable within ~1s even on a slow
  connection; `nearestLoaded()` fills gaps until higher-resolution passes complete. **Always call
  the canvas `resize()` before the first draw** — skipping this silently leaves the canvas at its
  default 300×150 bitmap size.
- Respect `prefers-reduced-motion` everywhere (static final frame for the hero, no rAF loops, no
  CSS keyframe animations) — every animated JS file in `site/js/` already gates on
  `window.matchMedia("(prefers-reduced-motion: reduce)")`.

## Background components (`references/backgrounds/`)

`background-paths.tsx`, `beams-background.tsx`, `flow-field.tsx`, `shapes-hero.tsx`, and
`etheral-shadow.prompt.md` are React + Framer Motion originals (MIT-licensed, kokonutui.com and
others) kept as **design inspiration only** — this repo's client sites are vanilla JS/CSS with no
framework. When adapting one for a client site: port the effect to plain canvas/SVG/CSS, recolor
it to the client's actual brand palette (never the original demo colors), gate it behind
`prefers-reduced-motion`, and cap particle/beam counts for mobile. See
`clients/ets-leveque/site/js/bg-beams.js` and `bg-paths.js` for the established porting pattern
(canvas 2D, `IntersectionObserver` + `visibilitychange` to pause off-screen/hidden, mobile counts
reduced).

## Building a client site fast (multi-page parallel pattern)

Building all pages of a site sequentially is slow. The pattern that works: write the full CSS
design system and `index.html` first (this is the contract), then dispatch 2-4 parallel subagents,
each responsible for 2-3 specific HTML pages, with a closed brief containing the exact classes to
reuse and the exact source file(s) to pull real content from — no exploration, no independent
design decisions, no touching shared `css/`/`js/`/`assets/`. Verify all pages in one pass at the
end (local static server + headless browser screenshots), not per-page during the build.

## Local preview

Any client `site/` directory is a plain static site:
```bash
cd clients/<client-slug>/site && python3 -m http.server 8744
```
No install step. If verifying visually via a headless browser, Playwright is available at
`~/.claude/skills/btp-site-modernizer/scripts/node_modules` (installed for the extraction script;
reuse it rather than installing a second copy).
