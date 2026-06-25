# Setup Guide — Saiko Portfolio + Admin Dashboard

## Prerequisites

- [Supabase](https://supabase.com) account (free tier)
- [Vercel](https://vercel.com) account (free tier) for deployment
- Git (optional)

## 1. Create Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Choose a name, database password, and region → **Create**.
3. Wait until the project is ready.

## 2. Run database schema

1. Open **SQL Editor** → **New query**.
2. Copy the entire contents of `supabase/schema.sql`.
3. Click **Run**.
4. Confirm success (tables `projects`, `admin_users`, storage bucket `project-thumbnails`).

## 3. Enable Realtime (recommended)

1. Go to **Database** → **Replication** (or **Publications**).
2. Enable realtime for the `projects` table so the public site updates instantly.

## 4. Configure authentication

1. Go to **Authentication** → **Providers** → **Email**.
2. Ensure **Email** provider is enabled.
3. For development you may disable “Confirm email” under **Email** settings.
4. Go to **Authentication** → **Users** → **Add user** → create your admin account:
   - Email: your admin email
   - Password: strong password
5. Copy the new user’s **UUID** from the users list.

## 5. Register admin user

In **SQL Editor**, run (replace values):

```sql
INSERT INTO public.admin_users (user_id, email)
VALUES ('PASTE-YOUR-USER-UUID-HERE', 'your@email.com');
```

Only users in this table can access the dashboard after login.

## 6. Local configuration

```bash
cd Portfolio
npm run config:local
```

Edit `js/config.js` with your API keys from **Project Settings** → **API**:

- **Project URL** → `supabaseUrl`
- **anon public** key → `supabaseAnonKey`

> Never commit `js/config.js` or use the `service_role` key in the browser.

## 7. Test locally

Serve the folder with any static server:

```bash
npx serve .
```

- Public site: `http://localhost:3000/works.html`
- Admin login: `http://localhost:3000/admin/`

Sign in with the admin user you created.

## 8. Add your first project

1. Log in at `/admin/`.
2. Go to **Add Project**.
3. Fill in details, drag & drop a thumbnail, check **Publish on website**.
4. Click **Create Project**.
5. Open `works.html` — the project should appear.

## Folder structure

```
Portfolio/
├── index.html, works.html, contacts.html
├── styles.css
├── assets/
├── js/                    # Shared client + public loader
├── admin/                 # Dashboard (login, CRUD)
│   ├── css/admin.css
│   └── js/
├── supabase/schema.sql
├── scripts/generate-config.js
├── docs/API.md
├── SETUP.md
└── DEPLOYMENT.md
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| “Database not configured” | Create `js/config.js` from `config.example.js` |
| “Not authorized” after login | Run `INSERT INTO admin_users ...` with your user UUID |
| Projects not showing | Ensure `is_published` is checked; run schema SQL |
| Upload fails | Confirm storage bucket `project-thumbnails` exists |
| Live updates not working | Enable Realtime on `projects` table |
