# Architecture

High-level structure of the HackUTA marketing site.

## System context

```
Visitor ──► hackuta.com (this repo, static SPA on Vercel)
                │
                ├── Apply CTA ──► register.hackuta.com (separate repo)
                ├── mailto: links (hello@, sponsor@)
                └── External links (Discord, MLH badge, social)
```

**No backend.** No Convex, API routes, forms, or database. All content is static or build-time configured.

## Repository layout

```
src/
  main.tsx                 React Router setup
  pages/
    HomePage.tsx           Single-page marketing layout
    RegisterRedirect.tsx   /register → VITE_REGISTER_URL
    NotFoundPage.tsx       404
  components/              Hero, Schedule, FAQ, Sponsors, Header, Footer, art
  constants/
    site.ts                REGISTER_URL from env
    sponsors.ts            Sponsor data + mailto helper
  hooks/                   Countdown, motion, etc.

security/
  csp.ts                   Content-Security-Policy (sync with vercel.json)
  headers.ts               Permissions-Policy, Referrer-Policy

public/                    Static assets, trusted-types.js, fonts, images
scripts/
  prepare-assets.mjs       Image/font optimization (npm run assets)
  inline-critical-shell.ts Vite plugin — critical CSS inlining
  async-css-for-csp.ts     Deferred stylesheet loading for CSP
  qa-mcp.mjs               Design QA harness (see docs/QA.md)

tests/                     Vitest unit + Playwright e2e
docs/                      This documentation set
```

## Routing

| Path | Component | Behavior |
| --- | --- | --- |
| `/` | `HomePage` | Anchored sections (hero, about, schedule, FAQ, sponsors) |
| `/register` | `RegisterRedirect` | Client redirect to `REGISTER_URL` |
| `*` | `NotFoundPage` | 404 |

Vercel rewrites `/register` to `index.html` for SPA routing; redirect logic runs in React.

## Page composition

`HomePage` assembles section components. Navigation uses in-page hash anchors (`#schedule`, `#faq`, etc.) via the header.

Key integrations:

| Feature | Implementation |
| --- | --- |
| Countdown | Client hook to event date |
| Hero art / ship | SVG + canvas (Paper Dithering, Wave.js) |
| Schedule | Tabbed static content |
| Apply buttons | `href={REGISTER_URL}` from `src/constants/site.ts` |
| Contact | `mailto:` links only — no server submission on this site |

## Build pipeline

```
Vite + React + Tailwind v4
  → tsc -b (typecheck)
  → vite build
  → beasties (critical CSS)
  → inline-critical-shell / async-css-for-csp plugins
  → dist/ static output
  → Vercel CDN
```

Production build copies `index.html` → `404.html` for SPA fallback on unknown paths.

## Environment configuration

Single build-time variable:

| Variable | Purpose |
| --- | --- |
| `VITE_REGISTER_URL` | Apply CTA and `/register` redirect target |

All other URLs (Discord, social, MLH badge) are hardcoded in source — change via code review, not env vars.

## Design system

Shared Odyssey theme with the registration app. Reference:

- [HACKUTA_DESIGN_CONTEXT.md](../HACKUTA_DESIGN_CONTEXT.md)
- [palette.md](palette.md)

Keep palette and tone aligned when updating either repo.

## Related docs

- [API.md](API.md) — routes and external links
- [SECURITY.md](SECURITY.md)
- [TESTING.md](TESTING.md)
