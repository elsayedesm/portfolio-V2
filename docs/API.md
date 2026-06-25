# API Reference

This portfolio uses **Supabase** as the backend. All data access goes through the Supabase client with **Row Level Security (RLS)** — there is no custom Node server.

## Authentication

| Action | Method | Details |
|--------|--------|---------|
| Login | `supabase.auth.signInWithPassword({ email, password })` | Admin only if user exists in `admin_users` |
| Logout | `supabase.auth.signOut()` | Clears session |
| Session | `supabase.auth.getSession()` | Used on protected admin pages |

## Database — `projects` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | TEXT | Required |
| `category` | TEXT | e.g. Video Editing |
| `description` | TEXT | Short description |
| `project_date` | DATE | Optional |
| `technologies` | TEXT[] | Array of tools used |
| `project_link` | TEXT | External URL |
| `thumbnail_url` | TEXT | Public storage URL |
| `sort_order` | INTEGER | Higher appears first |
| `is_published` | BOOLEAN | `false` = draft (hidden on public site) |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto |

### Public (anonymous) access

```javascript
// Read published projects only (RLS enforced)
await supabase
  .from('projects')
  .select('*')
  .eq('is_published', true)
  .order('sort_order', { ascending: false });
```

### Admin (authenticated + in `admin_users`)

```javascript
// Create
await supabase.from('projects').insert({ title, category, ... });

// Update
await supabase.from('projects').update({ ... }).eq('id', projectId);

// Delete
await supabase.from('projects').delete().eq('id', projectId);

// List all (including drafts)
await supabase.from('projects').select('*');
```

## Storage — `project-thumbnails` bucket

| Action | Path pattern | Access |
|--------|--------------|--------|
| Upload | `{projectId}/{timestamp}.{ext}` | Admin only |
| Public URL | `getPublicUrl(path)` | Everyone (read) |
| Delete | `remove([path])` | Admin only |

```javascript
await supabase.storage
  .from('project-thumbnails')
  .upload(path, file, { upsert: true });

const { data } = supabase.storage
  .from('project-thumbnails')
  .getPublicUrl(path);
```

## Realtime

Public works page subscribes to changes:

```javascript
supabase
  .channel('public-projects')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, reload)
  .subscribe();
```

Enable Realtime for `projects` in Supabase Dashboard → Database → Replication if updates do not appear live.

## Security model

- **anon key**: safe in frontend; RLS blocks unauthorized writes.
- **service_role key**: never expose in browser.
- Only emails listed in `admin_users` can manage projects after Auth login.

## Client modules

| File | Role |
|------|------|
| `js/portfolio-api.js` | CRUD + upload helpers |
| `js/validators.js` | Input validation |
| `js/portfolio-public.js` | Public works page renderer |
| `admin/js/auth.js` | Login, guards, admin check |
