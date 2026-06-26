/**
 * Admin login page handler.
 */
(function () {
    'use strict';

    const form = document.getElementById('login-form');
    const errorEl = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit');

    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'unauthorized' && errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = 'You are not authorized to access the admin dashboard.';
    }
    if (params.get('error') === 'config' && errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = 'Supabase is not configured. Copy js/config.example.js to js/config.js.';
    }

    if (!window.portfolioSupabase && errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = 'Supabase is not configured. Copy js/config.example.js to js/config.js and add your keys.';
    }

    // Redirect if already logged in
    (async function checkExisting() {
        const session = await window.AdminAuth.getSession();
        if (session) {
            const ok = await window.AdminAuth.isAdminUser(session.user.id);
            if (ok) window.location.href = '/admin/dashboard';
        }
    })();

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.hidden = true;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        const email = form.email.value;
        const password = form.password.value;

        if (!email || !password) {
            errorEl.hidden = false;
            errorEl.textContent = 'Please enter email and password.';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
            return;
        }

        try {
            await window.AdminAuth.signIn(email, password);
            window.location.href = '/admin/dashboard';
        } catch (err) {
            errorEl.hidden = false;
            errorEl.textContent = err.message || 'Login failed. Please try again.';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });
})();
