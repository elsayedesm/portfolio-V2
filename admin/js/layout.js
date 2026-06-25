/**
 * Shared admin layout utilities (sidebar, logout, mobile menu).
 */
window.AdminLayout = (function () {
    'use strict';

    function init(session) {
        const emailEl = document.getElementById('admin-user-email');
        if (emailEl && session?.user?.email) {
            emailEl.textContent = session.user.email;
        }

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await window.AdminAuth.signOut();
            });
        }

        const toggle = document.getElementById('menu-toggle');
        const sidebar = document.querySelector('.admin-sidebar');
        const overlay = document.getElementById('admin-overlay');

        if (toggle && sidebar) {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                overlay?.classList.toggle('visible');
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar?.classList.remove('open');
                overlay.classList.remove('visible');
            });
        }

        const path = window.location.pathname.split('/').pop();
        document.querySelectorAll('.admin-nav a').forEach((link) => {
            const href = link.getAttribute('href');
            if (href === path || (path === '' && href === 'dashboard.html')) {
                link.classList.add('active');
            }
        });
    }

    return { init };
})();
