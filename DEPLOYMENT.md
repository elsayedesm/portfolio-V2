# Deployment Guide — Vercel + Supabase

## Overview

| Service | Role | Cost |
|---------|------|------|
| **Supabase** | Database, Auth, Storage, Realtime | Free tier |
| **Vercel** | Static hosting (HTML/CSS/JS) | Free tier |

## Part 1 — Supabase (production)

Use the same project as development, or create a separate production project and run `supabase/schema.sql` again.

1. Note **Project URL** and **anon key** (Settings → API).
2. Ensure admin user exists in **Authentication** and `admin_users` table.
3. Under **Authentication** → **URL configuration**, add your Vercel URL:
   - Site URL: `https://your-site.vercel.app`
   - Redirect URLs: `https://your-site.vercel.app/**`

## Part 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Portfolio with Supabase admin dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

Ensure `js/config.js` is **not** committed (it is in `.gitignore`).

## Part 3 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Import your GitHub repository.
3. Framework Preset: **Other** (static site).
4. Build settings (should match `vercel.json`):
   - **Build Command:** `node scripts/generate-config.js`
   - **Output Directory:** `.`
5. Add **Environment Variables**:

   | Name | Value |
   |------|--------|
   | `SUPABASE_URL` | `https://xxxx.supabase.co` |
   | `SUPABASE_ANON_KEY` | Your anon public key |

6. Click **Deploy**.

Vercel runs the build script, which writes `js/config.js` during deploy (not stored in Git).

## Part 4 — Verify production

1. Open `https://your-site.vercel.app/works.html` — projects load from Supabase.
2. Open `https://your-site.vercel.app/admin/` — log in and create a test project.
3. Refresh the works page — new project appears (Realtime or refresh).

## Custom domain (optional)

1. Vercel → Project → **Settings** → **Domains**.
2. Add your domain and follow DNS instructions.
3. Update Supabase **Redirect URLs** with the new domain.

## Security checklist

- [ ] `service_role` key is never in frontend code or Vercel public env
- [ ] Only your email is in `admin_users`
- [ ] Strong admin password
- [ ] RLS enabled (included in `schema.sql`)
- [ ] Email confirmation enabled in production (recommended)

## Redeploy after changes

Push to `main` — Vercel redeploys automatically.

To update env vars: Vercel → Settings → Environment Variables → Redeploy.

## Alternative static hosts

Any static host works if you:

1. Run `SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/generate-config.js` before upload, or
2. Manually create `js/config.js` on the server.

Examples: Netlify, Cloudflare Pages, GitHub Pages (with Actions build step).

## Environment variables reference

```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Build command:

```bash
npm run build
# or
node scripts/generate-config.js
```
