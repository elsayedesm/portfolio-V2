/**
 * Admin dashboard home — statistics and recent projects.
 */
(async function () {
    'use strict';

    const session = await window.AdminAuth.requireAuth('index.html');
    if (!session) return;

    window.AdminLayout.init(session);

    const totalEl = document.getElementById('stat-total');
    const publishedEl = document.getElementById('stat-published');
    const draftEl = document.getElementById('stat-drafts');
    const recentEl = document.getElementById('recent-projects');
    const loadingEl = document.getElementById('dashboard-loading');

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function truncate(text, max) {
        if (!text) return 'No description yet';
        return text.length <= max ? text : `${text.slice(0, max).trim()}…`;
    }

    try {
        const projects = await window.PortfolioAPI.fetchAllProjects();

        if (totalEl) totalEl.textContent = projects.length;
        if (publishedEl) publishedEl.textContent = projects.filter((p) => p.is_published).length;
        if (draftEl) draftEl.textContent = projects.filter((p) => !p.is_published).length;

        const recent = projects.slice(0, 5);

        if (recentEl) {
            if (!recent.length) {
                recentEl.innerHTML = '<p class="admin-empty">No projects yet. <a href="project-form.html">Add your first project</a>.</p>';
            } else {
                recentEl.innerHTML = `
                    <ul class="recent-list">
                        ${recent
                            .map(
                                (p) => `
                            <li>
                                <img src="${escapeHtml(p.thumbnail_url || '../assets/project.png')}" alt="" onerror="this.src='../assets/project.png'">
                                <div class="meta">
                                    <strong>${escapeHtml(p.title)}</strong>
                                    <span>${escapeHtml(truncate(p.description, 80))}</span>
                                </div>
                                <a href="project-form.html?id=${p.id}" class="btn-outline btn-sm">Edit</a>
                            </li>
                        `
                            )
                            .join('')}
                    </ul>
                `;
            }
        }
    } catch (err) {
        console.error(err);
        if (recentEl) {
            recentEl.innerHTML = `<p class="admin-alert admin-alert-error">${escapeHtml(err.message)}</p>`;
        }
    } finally {
        if (loadingEl) loadingEl.hidden = true;
    }
})();
