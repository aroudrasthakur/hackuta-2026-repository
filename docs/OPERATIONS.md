# Operations

Deploy and maintain the marketing site on Vercel.

## Environments

| Environment | URL | Branch |
| --- | --- | --- |
| Production | [hackuta.com](https://hackuta.com) | `main` |
| Preview | Vercel preview URL | PR branches |
| Local | `http://127.0.0.1:5173` | — |

Registration app (separate): [register.hackuta.com](https://register.hackuta.com)

## Release checklist

1. **Quality gate:** `npm run lint && npm run typecheck && npm run test:unit:coverage && npm run build`
2. **Merge to `main`** — CI runs lint, types, unit tests, build, Playwright e2e
3. **Verify Vercel production env:** `VITE_REGISTER_URL=https://register.hackuta.com`
4. **Smoke test production:**
   - Home page loads; hero art renders
   - Apply button → `register.hackuta.com`
   - `/register` redirects correctly
   - Schedule tabs, mobile menu, skip link
5. **Optional design QA:** `npm run qa:mcp` against preview URL (see [QA.md](QA.md))

## Vercel configuration

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 22 (match CI) |

### Environment variables

| Variable | Production | Preview (optional) |
| --- | --- | --- |
| `VITE_REGISTER_URL` | `https://register.hackuta.com` | Staging registration URL |

Set in Vercel → Project → Settings → Environment Variables. Rebuild required after changes.

### Headers

Security headers are defined in `vercel.json` (not Vercel dashboard). Edit the file and redeploy to change CSP or HSTS.

## Asset maintenance

Regenerate optimized images and subset fonts after art changes:

```bash
npm run assets
```

Commit updated files under `public/` as needed.

## Monitoring

| Signal | Where |
| --- | --- |
| Deploy status | Vercel dashboard |
| CI failures | GitHub Actions on `main` |
| Client errors | Browser console (no server logs on this site) |

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Apply link wrong domain | `VITE_REGISTER_URL` in Vercel production env |
| `/register` 404 | `vercel.json` rewrite for `/register` → `index.html` |
| CSP blocks script/style | `security/csp.ts` vs built asset paths |
| Hero art missing | Run `npm run assets`; verify `public/images/` |
| Blank page after deploy | Browser console; verify `dist/` build succeeded |

## Rollback

Revert the merge on `main` or promote a previous Vercel deployment from the dashboard.

## Related docs

- [SECURITY.md](SECURITY.md)
- [TESTING.md](TESTING.md)
