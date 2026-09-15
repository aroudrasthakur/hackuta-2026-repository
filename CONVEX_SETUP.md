# Convex Backend Setup

Your registration system now uses **Convex** as the backend database. Here's how to complete the setup:

## What Changed

- ✅ **Convex mutations**: `sendCode`, `verifyCode`, `register` (in `/convex/` directory)
- ✅ **Convex schema**: Defines `verificationCodes`, `cooldowns`, and `registrations` tables
- ✅ **Frontend integration**: `registerApi.ts` now calls Convex via HTTP API
- ✅ **Mock API fallback**: Still works for local testing with `VITE_USE_MOCK_API=true`

## Deploy Convex Backend

You have your deployment URL already: `https://brilliant-ostrich-892.convex.cloud`

### Step 1: Push to Convex

```bash
# Install Convex CLI (if not already installed)
npm install -g convex

# Deploy to your Convex project
npx convex deploy
```

This will:
1. Prompt you to authenticate (use your Convex account)
2. Push the schema and mutations to Convex
3. Generate type definitions in `.convex/`

### Step 2: Set Environment Variables

Your `.env.local` already has:
```
VITE_CONVEX_URL=https://brilliant-ostrich-892.convex.cloud
VITE_USE_MOCK_API=false
REGISTRATION_TOKEN_SECRET=...
```

When deployed to production (Vercel), add the same `VITE_CONVEX_URL` in Vercel Settings > Environment Variables.

### Step 3: Test

```bash
# Start dev server
npm run dev

# Visit http://localhost:5173/register
# Fill out the form - it will send data to Convex!
```

## Toggle Between Mock & Convex

| Mode | Command | Use Case |
|------|---------|----------|
| **Mock API** | `VITE_USE_MOCK_API=true` | Quick UI testing, no internet needed |
| **Convex** | `VITE_USE_MOCK_API=false` | Full integration testing, data persists in database |

To switch: Edit `.env.local` and toggle `VITE_USE_MOCK_API=true` or `false`, then restart dev server.

## Convex Mutations Reference

### `sendCode(email: string)`
- Generates 6-digit code
- Stores in `verificationCodes` table (10-min expiry)
- Rate limits: 1 code per 60 seconds per email
- Logs code to console for development

### `verifyCode(email: string, code: string)`
- Validates code (max 5 attempts)
- Issues signed JWT token (30-min expiry)
- Deletes used code

### `register(token, email, ...formData)`
- Validates JWT token signature & expiration
- Checks for duplicates by email
- Validates all form fields
- Stores to `registrations` table
- Returns success

## View Data in Convex Dashboard

1. Go to https://dashboard.convex.dev
2. Select your project (`brilliant-ostrich-892`)
3. Browse tables: `verificationCodes`, `cooldowns`, `registrations`
4. See all submitted applications in real-time

## Next Steps

- [ ] Run `npx convex deploy` to push backend to Convex
- [ ] Test registration flow with `npm run dev` (VITE_USE_MOCK_API=false)
- [ ] Deploy to Vercel with `vercel deploy`
- [ ] Set `VITE_CONVEX_URL` in Vercel dashboard
- [ ] Create admin dashboard to view registrations (optional)
