/**
 * Shared Supabase client for public site and admin dashboard.
 */
(function () {
    'use strict';

    const config = window.PORTFOLIO_CONFIG;

    if (!config || !config.supabaseUrl || !config.supabaseAnonKey) {
        console.error(
            '[Portfolio] Missing config. Copy js/config.example.js to js/config.js and add your Supabase credentials.'
        );
        window.portfolioSupabase = null;
        return;
    }

    if (
        config.supabaseUrl.includes('YOUR_PROJECT') ||
        config.supabaseAnonKey.includes('YOUR_SUPABASE')
    ) {
        console.warn('[Portfolio] Supabase config still uses placeholder values.');
    }

    window.portfolioSupabase = window.supabase.createClient(
        config.supabaseUrl,
        config.supabaseAnonKey,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );
})();
