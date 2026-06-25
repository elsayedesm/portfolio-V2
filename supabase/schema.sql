-- =============================================================================
-- Saiko Portfolio — Supabase Database Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Projects table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(trim(title)) >= 1 AND char_length(title) <= 200),
    category TEXT DEFAULT '' CHECK (char_length(category) <= 100),
    description TEXT DEFAULT '' CHECK (char_length(description) <= 5000),
    project_date DATE,
    technologies TEXT[] DEFAULT '{}',
    project_link TEXT DEFAULT '' CHECK (char_length(project_link) <= 2048),
    thumbnail_url TEXT DEFAULT '' CHECK (char_length(thumbnail_url) <= 2048),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_published_sort
    ON public.projects (is_published, sort_order DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_category
    ON public.projects (category);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Admin allowlist (only these users can manage projects)
-- After creating your admin account in Supabase Auth, run:
--   INSERT INTO public.admin_users (user_id, email)
--   VALUES ('YOUR-USER-UUID', 'your@email.com');
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper: is current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Projects: public read (published only)
DROP POLICY IF EXISTS "Public can read published projects" ON public.projects;
CREATE POLICY "Public can read published projects"
    ON public.projects
    FOR SELECT
    TO anon, authenticated
    USING (is_published = true);

-- Projects: admins read all (including drafts)
DROP POLICY IF EXISTS "Admins can read all projects" ON public.projects;
CREATE POLICY "Admins can read all projects"
    ON public.projects
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Projects: admins insert / update / delete
DROP POLICY IF EXISTS "Admins can insert projects" ON public.projects;
CREATE POLICY "Admins can insert projects"
    ON public.projects
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
CREATE POLICY "Admins can update projects"
    ON public.projects
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
CREATE POLICY "Admins can delete projects"
    ON public.projects
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- Admin users table: only admins can read their own row
DROP POLICY IF EXISTS "Admins can read admin_users" ON public.admin_users;
CREATE POLICY "Admins can read admin_users"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Storage bucket for thumbnails
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-thumbnails',
    'project-thumbnails',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
DROP POLICY IF EXISTS "Public read thumbnails" ON storage.objects;
CREATE POLICY "Public read thumbnails"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'project-thumbnails');

DROP POLICY IF EXISTS "Admins upload thumbnails" ON storage.objects;
CREATE POLICY "Admins upload thumbnails"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'project-thumbnails'
        AND public.is_admin()
    );

DROP POLICY IF EXISTS "Admins update thumbnails" ON storage.objects;
CREATE POLICY "Admins update thumbnails"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'project-thumbnails' AND public.is_admin())
    WITH CHECK (bucket_id = 'project-thumbnails' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete thumbnails" ON storage.objects;
CREATE POLICY "Admins delete thumbnails"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'project-thumbnails' AND public.is_admin());

-- -----------------------------------------------------------------------------
-- Optional seed data (remove if not needed)
-- -----------------------------------------------------------------------------
-- INSERT INTO public.projects (title, category, description, project_date, technologies, project_link, thumbnail_url, sort_order)
-- VALUES (
--     'Sample Project',
--     'Video Editing',
--     'A sample project description. Replace via the admin dashboard.',
--     CURRENT_DATE,
--     ARRAY['Premiere Pro', 'After Effects'],
--     'https://example.com',
--     '',
--     1
-- );
