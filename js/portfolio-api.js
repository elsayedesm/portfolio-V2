/**
 * Portfolio data access layer (public + admin).
 */
window.PortfolioAPI = (function () {
    'use strict';

    const TABLE = 'projects';
    const BUCKET = 'project-thumbnails';
    const V = window.PortfolioValidators;

    function getClient() {
        return window.portfolioSupabase;
    }

    function mapRow(row) {
        return {
            id: row.id,
            title: row.title,
            category: row.category || '',
            description: row.description || '',
            project_date: row.project_date,
            technologies: row.technologies || [],
            project_link: row.project_link || '',
            thumbnail_url: row.thumbnail_url || '',
            sort_order: row.sort_order ?? 0,
            is_published: row.is_published !== false,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    /** Published projects for the public website */
    async function fetchPublishedProjects() {
        const supabase = getClient();
        if (!supabase) throw new Error('Supabase is not configured.');

        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('is_published', true)
            .order('sort_order', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapRow);
    }

    /** All projects for admin (includes drafts) */
    async function fetchAllProjects() {
        const supabase = getClient();
        if (!supabase) throw new Error('Supabase is not configured.');

        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .order('sort_order', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapRow);
    }

    async function fetchProjectById(id) {
        const supabase = getClient();
        const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? mapRow(data) : null;
    }

    async function createProject(payload) {
        const supabase = getClient();
        const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
        if (error) throw error;
        return mapRow(data);
    }

    async function updateProject(id, payload) {
        const supabase = getClient();
        const { data, error } = await supabase
            .from(TABLE)
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return mapRow(data);
    }

    async function deleteProject(id) {
        const supabase = getClient();
        const { error } = await supabase.from(TABLE).delete().eq('id', id);
        if (error) throw error;
    }

    /** Upload thumbnail; returns public URL */
    async function uploadThumbnail(file, projectId) {
        const supabase = getClient();
        const check = V.validateImageFile(file);
        if (!check.valid) throw new Error(check.error);

        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
        const path = `${projectId}/${Date.now()}.${safeExt}`;

        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type
        });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        return data.publicUrl;
    }

    async function deleteThumbnailByUrl(url) {
        if (!url) return;
        const supabase = getClient();
        const marker = `/object/public/${BUCKET}/`;
        const idx = url.indexOf(marker);
        if (idx === -1) return;
        const path = decodeURIComponent(url.slice(idx + marker.length));
        await supabase.storage.from(BUCKET).remove([path]);
    }

    function buildPayload(formData) {
        const validation = V.validateProjectForm(formData);
        if (!validation.valid) {
            throw new Error(validation.errors.join(' '));
        }

        return {
            title: validation.title,
            category: V.trim(formData.category),
            description: V.trim(formData.description),
            project_date: formData.project_date || null,
            technologies: V.parseTechnologies(formData.technologies),
            project_link: V.trim(formData.project_link),
            sort_order: parseInt(formData.sort_order, 10) || 0,
            is_published: formData.is_published !== false && formData.is_published !== 'false'
        };
    }

    return {
        fetchPublishedProjects,
        fetchAllProjects,
        fetchProjectById,
        createProject,
        updateProject,
        deleteProject,
        uploadThumbnail,
        deleteThumbnailByUrl,
        buildPayload,
        mapRow
    };
})();
