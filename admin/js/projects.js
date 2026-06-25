/**
 * Admin projects list with search, edit, delete.
 */
(async function () {
    'use strict';

    const session = await window.AdminAuth.requireAuth('index.html');
    if (!session) return;

    window.AdminLayout.init(session);

    const tbody = document.getElementById('projects-tbody');
    const loadingEl = document.getElementById('projects-loading');
    const emptyEl = document.getElementById('projects-empty');
    const searchInput = document.getElementById('search-projects');
    const alertEl = document.getElementById('page-alert');

    let allProjects = [];

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showAlert(message, type) {
        if (!alertEl) return;
        alertEl.hidden = false;
        alertEl.className = `admin-alert admin-alert-${type}`;
        alertEl.textContent = message;
        setTimeout(() => {
            alertEl.hidden = true;
        }, 4000);
    }

    function truncate(text, max) {
        if (!text) return '—';
        return text.length <= max ? text : `${text.slice(0, max).trim()}…`;
    }

    function renderTable(projects) {
        if (!tbody) return;

        if (!projects.length) {
            tbody.innerHTML = '';
            if (emptyEl) emptyEl.hidden = false;
            return;
        }

        if (emptyEl) emptyEl.hidden = true;

        tbody.innerHTML = projects
            .map(
                (p) => `
            <tr data-id="${p.id}">
                <td><img class="thumb" src="${escapeHtml(p.thumbnail_url || '../assets/project.png')}" alt="" onerror="this.src='../assets/project.png'"></td>
                <td><strong>${escapeHtml(p.title)}</strong></td>
                <td class="table-description">${escapeHtml(truncate(p.description, 60))}</td>
                <td>${p.is_published ? '<span class="badge badge-published">Live</span>' : '<span class="badge badge-draft">Draft</span>'}</td>
                <td class="table-actions">
                    <a href="project-form.html?id=${p.id}">Edit</a>
                    <button type="button" class="btn-danger btn-delete" data-id="${p.id}">Delete</button>
                </td>
            </tr>
        `
            )
            .join('');

        tbody.querySelectorAll('.btn-delete').forEach((btn) => {
            btn.addEventListener('click', () => handleDelete(btn.dataset.id));
        });
    }

    function filterProjects(query) {
        const q = query.trim().toLowerCase();
        if (!q) return allProjects;
        return allProjects.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                (p.category || '').toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q) ||
                (p.technologies || []).some((t) => t.toLowerCase().includes(q))
        );
    }

    async function handleDelete(id) {
        const project = allProjects.find((p) => p.id === id);
        if (!project) return;

        const confirmed = window.confirm(
            `Delete "${project.title}"? This cannot be undone.`
        );
        if (!confirmed) return;

        try {
            if (project.thumbnail_url) {
                await window.PortfolioAPI.deleteThumbnailByUrl(project.thumbnail_url);
            }
            await window.PortfolioAPI.deleteProject(id);
            allProjects = allProjects.filter((p) => p.id !== id);
            renderTable(filterProjects(searchInput?.value || ''));
            showAlert('Project deleted successfully.', 'success');
        } catch (err) {
            showAlert(err.message || 'Failed to delete project.', 'error');
        }
    }

    async function load() {
        try {
            allProjects = await window.PortfolioAPI.fetchAllProjects();
            renderTable(allProjects);
        } catch (err) {
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="5" class="admin-alert admin-alert-error">${escapeHtml(err.message)}</td></tr>`;
            }
        } finally {
            if (loadingEl) loadingEl.hidden = true;
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderTable(filterProjects(searchInput.value));
        });
    }

    load();
})();
