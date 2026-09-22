# Security

Security model for the static marketing site.

## Threat model (summary)

| Risk | Applicability | Mitigation |
| --- | --- | --- |
| XSS via user input | **None** — no forms or user-submitted data | N/A |
| Stored XSS | **Low** — content is developer-authored only | Code review; no `dangerouslySetInnerHTML` |
| Script injection (CDN compromise) | Low | Strict CSP, self-hosted assets |
| Clickjacking | Medium | `frame-ancestors 'none'`, `X-Frame-Options: DENY` |
| Open redirect | Low | `REGISTER_URL` is build-time env — protect Vercel settings |
| MITM | Medium | HSTS with preload |

There is **no server-side attack surface** on this repo — no mutations, uploads, auth, or database.

## Content Security Policy

Source: `security/csp.ts` · Deployed: `vercel.json` · Test: `tests/unit/security.test.ts`

| Directive | Value | Notes |
| --- | --- | --- |
| `default-src` | `'self'` | Baseline deny |
| `script-src` | `'self'` + Vercel preview toolbar | No inline scripts |
| `script-src-attr` | `'none'` | Blocks inline event handlers |
| `style-src` | `'self'` + `'unsafe-inline'` | Tailwind/runtime styles |
| `connect-src` | `'self'` + Vercel live | **No external API calls** |
| `object-src` | `'none'` | No plugins |
| `frame-ancestors` | `'none'` | Anti-clickjacking |
| `form-action` | `'self'` | No HTML forms submit off-site |
| Trusted Types | enforced | `public/trusted-types.js` |

Also deployed: **HSTS**, **Cross-Origin-Opener-Policy**, **Permissions-Policy** (camera/mic off), **Referrer-Policy**.

### Changing CSP

1. Edit `security/csp.ts`
2. Mirror the string in `vercel.json` → `Content-Security-Policy`
3. Run `npm run test:unit -- tests/unit/security.test.ts`

## External links

Outbound links are hardcoded in components — not from user input:

| Destination | Location |
| --- | --- |
| Registration app | `VITE_REGISTER_URL` / `src/constants/site.ts` |
| Discord | `src/components/About.tsx` |
| Social (Instagram, LinkedIn, GitHub) | `src/components/Footer.tsx` |
| MLH badge + Code of Conduct | `Header.tsx`, `Footer.tsx` |
| Sponsor mailto | `src/constants/sponsors.ts` |
| FAQ mailto | `src/components/FAQ.tsx` |

When adding sponsor logos or links, use **hardcoded trusted URLs** in source files — never runtime user/admin input on this static site.

## Register URL integrity

`VITE_REGISTER_URL` controls where Apply buttons and `/register` redirect. If misconfigured in Vercel, users could be sent to the wrong host.

**Production:** `https://register.hackuta.com`  
**Preview:** staging registration URL if needed  
Protect Vercel env var access; verify after deploy.

`RegisterRedirect.tsx` falls back to a manual link if `window.location.replace` fails.

## What lives elsewhere

Applicant data, auth, contact forms, file uploads, and input validation are handled by **[hackuta-2026-registration](../hackuta-2026-registration)** — see its [SECURITY.md](https://github.com/aroudrasthakur/hackuta-2026-registration/blob/main/docs/SECURITY.md).

## Related docs

- [OPERATIONS.md](OPERATIONS.md)
- [API.md](API.md)
