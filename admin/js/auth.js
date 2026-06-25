/**
 * Admin authentication (Supabase email/password).
 */
window.AdminAuth = (function () {
    'use strict';

    function getClient() {
        return window.portfolioSupabase;
    }

    async function getSession() {
        const supabase = getClient();
        if (!supabase) return null;
        const { data } = await supabase.auth.getSession();
        return data.session;
    }

    /** Returns true if user is in admin_users table */
    async function isAdminUser(userId) {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('admin_users')
            .select('user_id')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('[AdminAuth]', error);
            return false;
        }
        return !!data;
    }

    async function signIn(email, password) {
        const supabase = getClient();
        if (!supabase) {
            throw new Error('Supabase is not configured. See SETUP.md.');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
        });

        if (error) throw error;

        const allowed = await isAdminUser(data.user.id);
        if (!allowed) {
            await supabase.auth.signOut();
            throw new Error('This account is not authorized to access the admin dashboard.');
        }

        return data;
    }

    async function signOut() {
        const supabase = getClient();
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    }

    /**
     * Redirect to login if not authenticated or not admin.
     * @param {string} loginPath - path to login page
     */
    async function requireAuth(loginPath) {
        const supabase = getClient();
        if (!supabase) {
            window.location.href = loginPath + '?error=config';
            return null;
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            window.location.href = loginPath;
            return null;
        }

        const allowed = await isAdminUser(session.user.id);
        if (!allowed) {
            await supabase.auth.signOut();
            window.location.href = loginPath + '?error=unauthorized';
            return null;
        }

        return session;
    }

    return {
        getSession,
        isAdminUser,
        signIn,
        signOut,
        requireAuth
    };
})();
