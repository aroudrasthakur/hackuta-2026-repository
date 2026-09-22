# HackUTA 2026

The official marketing site for **HackUTA** — a 24-hour hackathon at the University of Texas at Arlington.

**November 14–15, 2026** · UT Arlington, Texas  
Open to college students 18+. All experience levels welcome. **Applications are open** at [register.hackuta.com](https://register.hackuta.com).

| Environment | URL |
| --- | --- |
| Production | [hackuta.com](https://hackuta.com) |
| Local dev | [http://127.0.0.1:5173](http://127.0.0.1:5173) |

## What's on the site

Single-page marketing experience with anchored sections:

| Section | Contents |
| --- | --- |
| **Hero** | Event headline, countdown, Apply CTA (links to registration) |
| **About** | What HackUTA is and who it's for |
| **Schedule** | Day I and Day II timeline |
| **FAQ** | Common questions (registration, eligibility, logistics) |
| **Sponsors** | Sponsor logos and sponsorship contact |

External links include Discord and the application form. The `/register` route redirects to the separate registration app.

## Related repositories

| Repo | Role | Production URL |
| --- | --- | --- |
| **hackuta-2026-repository** (this repo) | Marketing landing page | [hackuta.com](https://hackuta.com) |
| [hackuta-2026-registration](https://github.com/aroudrasthakur/hackuta-2026-registration) | Sign-in, application form, profile, contact | [register.hackuta.com](https://register.hackuta.com) |

This site makes **no backend API calls**. The only cross-origin link is the registration URL configured via `VITE_REGISTER_URL`.

## Questions?

- General: [hello@hackuta.org](mailto:hello@hackuta.org)
- Sponsorship: [sponsor@hackuta.org](mailto:sponsor@hackuta.org)

## Run locally

```bash
npm ci
cp .env.example .env.local   # optional; defaults work for local dev
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

By default the Apply button points at `https://register.hackuta.com`. For local registration testing, set:

```bash
VITE_REGISTER_URL=http://127.0.0.1:5273
```

## Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_REGISTER_URL` | Registration site the Apply CTA links to | `https://register.hackuta.com` |

Set per environment in Vercel project settings. Preview deploys can point at a staging registration URL if needed.

## Stack

- Vite, React 19, TypeScript, Tailwind CSS v4
- [@paper-design/shaders-react](https://github.com/paper-design/shaders) and custom SVG art for the Odyssey theme
- Vitest (unit), Playwright + axe (e2e, responsive, accessibility)
- No backend — static SPA deployed to Vercel

## Project layout

```
src/
  pages/HomePage.tsx       Single-page layout composing all sections
  pages/RegisterRedirect.tsx  Redirects /register → VITE_REGISTER_URL
  components/              Hero, Schedule, FAQ, Sponsors, art assets, etc.
  constants/site.ts        REGISTER_URL and site metadata
  hooks/                   Countdown and other UI hooks
security/csp.ts            Production CSP (must match vercel.json)
docs/
  palette.md               Color tokens and design palette
  QA.md                    Manual QA checklist
scripts/prepare-assets.mjs Image/font optimization (npm run assets)
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server on `127.0.0.1:5173` |
| `npm run build` | Typecheck and production build to `dist/` |
| `npm run preview` | Serve `dist/` with production CSP headers |
| `npm run lint` | ESLint over app, CSP, and build scripts |
| `npm run typecheck` | App and test types |
| `npm run test:unit` | Vitest |
| `npm run test:unit:coverage` | Vitest with 80% Istanbul thresholds |
| `npm run test:e2e` | Playwright — content, responsive, accessibility |
| `npm run assets` | Regenerate optimized images and subset fonts |

Run Playwright against the production build (same path CI uses):

```bash
PLAYWRIGHT_USE_BUILD=true npm run test:e2e
```

## CI

GitHub Actions on pushes/PRs to `main`:

| Job | Steps |
| --- | --- |
| **quality** | lint → typecheck → unit tests with coverage → production build |
| **e2e** | Playwright against uploaded production build artifact |
| **dependency-audit** | `npm audit --omit=dev --audit-level=high` |
| **secrets** | Gitleaks full-history scan |

See [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Design docs

| Doc | Contents |
| --- | --- |
| [HACKUTA_DESIGN_CONTEXT.md](HACKUTA_DESIGN_CONTEXT.md) | Odyssey theme narrative, page structure, UX principles |
| [docs/palette.md](docs/palette.md) | Color tokens |
| [docs/QA.md](docs/QA.md) | Manual QA checklist |

Shared design context with the registration app — keep palette and tone aligned when making visual changes.

## Security notes

- Production CSP lives in `security/csp.ts` and `vercel.json`. `tests/unit/utils.test.ts` asserts the directives stay identical — change both together.
- `connect-src` is limited to `'self'` plus Vercel's preview toolbar; this site does not call external APIs.
- Security headers (HSTS, frame options, etc.) are set in `vercel.json`.

## Deployment

Deployed to **Vercel** as a static SPA. All routes rewrite to `index.html`. Set `VITE_REGISTER_URL` in the Vercel environment before building so the Apply link targets the correct registration deployment.
