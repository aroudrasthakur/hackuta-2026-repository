# HackUTA 2026

The official landing page for **HackUTA** — a 24-hour hackathon at the University of Texas at Arlington.

**November 14–15, 2026** · UT Arlington, Texas
Open to college students 18+. All experience levels welcome.

## What's on the site

- Event overview and how to get involved
- Weekend schedule (Day I & Day II)
- FAQ
- Sponsors
- Links to Discord and the application form

This repository is the marketing site only. Sign-in, the application form, and
organizer tooling live in
[hackuta-2026-registration](https://github.com/aroudrasthakur/hackuta-2026-registration)
and deploy separately; the "Apply" call to action links there.

## Questions?

Email [hello@hackuta.org](mailto:hello@hackuta.org).

## Run locally

For organizers and contributors:

```sh
npm ci
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

## Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_REGISTER_URL` | Registration site the "Apply" call to action points at | `https://register.hackuta.org` |

Set this per environment on the host (e.g. Vercel project settings) so preview
and development deploys point at `https://register-dev.hackuta.org`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck and build to `dist/` |
| `npm run preview` | Serve `dist/` with production CSP headers |
| `npm run lint` | ESLint over the app, CSP, and build scripts |
| `npm run typecheck` | App and test types |
| `npm run test:unit` | Vitest |
| `npm run test:unit:coverage` | Vitest with 80% istanbul thresholds |
| `npm run test:e2e` | Playwright (content, responsive, and accessibility) |
| `npm run assets` | Regenerate optimized images and subset fonts |

Run Playwright against the production build — the CSP-sensitive path CI uses —
with `PLAYWRIGHT_USE_BUILD=true npm run test:e2e`.

## Security notes

The production CSP in `security/csp.ts` and the `Content-Security-Policy` header
in `vercel.json` must stay identical; `tests/unit/utils.test.ts` guards the
directives. The site makes no cross-origin API calls, so `connect-src` is
limited to `'self'` plus Vercel's preview toolbar.
