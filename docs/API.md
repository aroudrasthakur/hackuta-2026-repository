# HackUTA 2026 Marketing Site — Site Reference

This repo is a **static SPA** with no backend API. This document describes routes, external integrations, and build-time configuration.

**See also:** [ARCHITECTURE.md](ARCHITECTURE.md) · [SECURITY.md](SECURITY.md)

Applicant-facing APIs (auth, registration, contact) live in **[hackuta-2026-registration](https://github.com/aroudrasthakur/hackuta-2026-registration)** → [docs/API.md](https://github.com/aroudrasthakur/hackuta-2026-registration/blob/main/docs/API.md).

---

## Routes

Base URL: `https://hackuta.com` (production)

| Path | Component | Behavior |
| --- | --- | --- |
| `/` | `HomePage` | Single-page site with anchored sections |
| `/register` | `RegisterRedirect` | `window.location.replace(REGISTER_URL)` |
| `*` | `NotFoundPage` | 404 (`dist/404.html` on Vercel) |

### Home page sections (hash anchors)

| Anchor | Component | Content |
| --- | --- | --- |
| `#about` | `About` | Event overview, Discord link |
| `#schedule` | `Schedule` | Day I / Day II tabs |
| `#faq` | `FAQ` | Eligibility, logistics, mailto contact |
| `#sponsors` | `Sponsors` | Sponsor logos, sponsorship mailto |

Header navigation scrolls to these anchors.

---

## External integrations

No `fetch()` to third-party APIs at runtime. `connect-src` CSP is `'self'` only (+ Vercel preview tooling).

| Integration | Type | Source | URL / target |
| --- | --- | --- | --- |
| **Registration app** | Redirect / link | `VITE_REGISTER_URL` | `https://register.hackuta.com` (prod) |
| **Discord** | External link | `About.tsx` | `https://discord.gg/2bVsYS3SgS` |
| **General contact** | mailto | `FAQ.tsx` | `hello@hackuta.org` |
| **Sponsorship** | mailto | `sponsors.ts` | `sponsor@hackuta.org` |
| **MLH badge** | External link | `Header.tsx` | `mlh.io` trust badge |
| **MLH Code of Conduct** | External link | `Footer.tsx` | `mlh.io/code-of-conduct` |
| **Social** | External links | `Footer.tsx` | Instagram, LinkedIn, GitHub |
| **Peer hackathons** | External links | `Footer.tsx` | HackUTD, TAMUHack, etc. |

### Apply CTA flow

```
User clicks Apply
  → href={REGISTER_URL}  (Hero, Header, Footer)
  OR /register → RegisterRedirect → REGISTER_URL
  → register.hackuta.com (separate deployment)
```

`REGISTER_URL` is resolved at **build time** from `src/constants/site.ts`:

```typescript
import.meta.env.VITE_REGISTER_URL?.trim() || "https://register.hackuta.com"
```

---

## Environment variables

| Variable | Required | Purpose | Default |
| --- | --- | --- | --- |
| `VITE_REGISTER_URL` | No (prod: yes in Vercel) | Apply button and `/register` redirect | `https://register.hackuta.com` |

Set in Vercel project settings or `.env.local` for local dev.

**Local registration testing:**

```bash
VITE_REGISTER_URL=http://127.0.0.1:5273
```

---

## Response headers (production)

Served by Vercel from `vercel.json`. Source of truth: `security/csp.ts`, `security/headers.ts`.

| Header | Purpose |
| --- | --- |
| `Content-Security-Policy` | Strict script/asset allowlist |
| `Strict-Transport-Security` | HTTPS enforcement |
| `X-Frame-Options: DENY` | Clickjacking protection |
| `Cross-Origin-Opener-Policy: same-origin` | Cross-origin isolation |
| `Permissions-Policy` | Disable camera, mic, etc. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

Static assets (`/assets/`, `/images/`, `/fonts/`) get long-cache `Cache-Control: immutable`.

Tests: `tests/unit/security.test.ts`.

---

## User input

**None.** There are no HTML forms, text inputs, or file uploads on this site. Contact is via `mailto:` links handled by the user's email client.

All security-sensitive applicant flows are on the registration deployment.

---

## Frontend → surface map

| UI element | Implementation |
| --- | --- |
| Apply buttons | `<a href={REGISTER_URL}>` |
| `/register` legacy URL | `RegisterRedirect` component |
| FAQ contact | `<a href="mailto:hello@hackuta.org">` |
| Sponsor inquiry | `SPONSOR_MAILTO` in `sponsors.ts` |
| Countdown | Client-side date math (no API) |
| Schedule content | Static React components |

---

## Build output

| Output | Description |
| --- | --- |
| `dist/index.html` | SPA entry |
| `dist/404.html` | Copy of index for unknown paths |
| `dist/assets/` | Hashed JS/CSS bundles |
| `dist/images/`, `dist/fonts/` | Optimized static assets |

Deployed as a static site — no serverless functions in this repo.
