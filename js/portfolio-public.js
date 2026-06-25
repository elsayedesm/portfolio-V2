/**
 * Renders portfolio projects on the public works page (dynamic from Supabase).
 * Grid shows image + title only; click opens a modal with full details.
 * Click the modal image to play the project video (from project_link).
 */
(function () {
    'use strict';

    const grid = document.getElementById('projects-grid');
    const loadingEl = document.getElementById('projects-loading');
    const emptyEl = document.getElementById('projects-empty');
    const errorEl = document.getElementById('projects-error');
    const modal = document.getElementById('project-modal');
    const modalBackdrop = document.getElementById('project-modal-backdrop');
    const modalClose = document.getElementById('project-modal-close');
    const modalMedia = document.getElementById('project-modal-media');
    const modalImage = document.getElementById('project-modal-image');
    const modalPlay = document.getElementById('project-modal-play');
    const modalPlayer = document.getElementById('project-modal-player');
    const modalTitle = document.getElementById('project-modal-title');
    const modalDescription = document.getElementById('project-modal-description');
    const FALLBACK_IMG = 'assets/project.png';

    if (!grid) return;

    let projectsCache = [];
    let lastFocusedElement = null;
    let activeVideoUrl = null;

    function hide(el) {
        if (el) el.hidden = true;
    }

    function show(el) {
        if (el) el.hidden = false;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function parseVideoEmbed(url) {
        if (!url) return null;

        try {
            const parsed = new URL(url.trim());

            if (parsed.hostname.includes('youtu.be')) {
                const id = parsed.pathname.slice(1).split('/')[0];
                return id ? { type: 'iframe', src: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` } : null;
            }

            if (parsed.hostname.includes('youtube.com')) {
                if (parsed.pathname.startsWith('/embed/')) {
                    const id = parsed.pathname.split('/')[2];
                    return id ? { type: 'iframe', src: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` } : null;
                }

                if (parsed.pathname.startsWith('/shorts/')) {
                    const id = parsed.pathname.split('/')[2];
                    return id ? { type: 'iframe', src: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` } : null;
                }

                const id = parsed.searchParams.get('v');
                return id ? { type: 'iframe', src: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` } : null;
            }

            if (parsed.hostname.includes('vimeo.com')) {
                const id = parsed.pathname.split('/').filter(Boolean).pop();
                return id ? { type: 'iframe', src: `https://player.vimeo.com/video/${id}?autoplay=1` } : null;
            }

            if (parsed.hostname === 'drive.google.com' || parsed.hostname === 'docs.google.com') {
                let id = null;
                if (parsed.pathname.startsWith('/file/d/')) {
                    id = parsed.pathname.split('/')[3];
                } else if (parsed.pathname === '/open' || parsed.pathname === '/uc') {
                    id = parsed.searchParams.get('id');
                }
                if (id) {
                    return {
                        type: 'iframe',
                        src: `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`
                    };
                }
            }

            if (/\.(mp4|webm|ogg)(\?|$)/i.test(parsed.pathname)) {
                return { type: 'video', src: url.trim() };
            }
        } catch {
            return null;
        }

        return null;
    }

    function resetModalMedia() {
        activeVideoUrl = null;

        if (modalPlayer) {
            modalPlayer.innerHTML = '';
            hide(modalPlayer);
        }

        if (modalImage) {
            show(modalImage);
        }

        if (modalPlay) {
            hide(modalPlay);
        }

        if (modalMedia) {
            modalMedia.classList.remove('is-playing');
        }
    }

    function playVideo(url) {
        const embed = parseVideoEmbed(url);
        if (!embed || !modalPlayer || !modalMedia) return;

        hide(modalImage);
        hide(modalPlay);
        show(modalPlayer);
        modalMedia.classList.add('is-playing');

        if (embed.type === 'iframe') {
            modalPlayer.innerHTML = `<iframe src="${escapeHtml(embed.src)}" title="Project video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
        } else {
            modalPlayer.innerHTML = `<video src="${escapeHtml(embed.src)}" controls autoplay playsinline></video>`;
        }
    }

    function renderCard(project) {
        const img = escapeHtml(project.thumbnail_url || FALLBACK_IMG);
        const title = escapeHtml(project.title);

        return `
            <button type="button" class="project-card" data-project-id="${escapeHtml(project.id)}" aria-label="View ${title}">
                <img src="${img}" alt="${title}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
                <h3>${title}</h3>
            </button>
        `;
    }

    function openModal(project) {
        if (!modal || !project) return;

        lastFocusedElement = document.activeElement;
        resetModalMedia();

        modalImage.src = project.thumbnail_url || FALLBACK_IMG;
        modalImage.alt = project.title;
        modalTitle.textContent = project.title;
        modalDescription.textContent = project.description || 'No description available.';

        activeVideoUrl = project.project_link || null;
        const hasVideo = !!parseVideoEmbed(activeVideoUrl);

        if (hasVideo && modalPlay) {
            show(modalPlay);
            modalMedia?.classList.add('has-video');
        } else {
            modalMedia?.classList.remove('has-video');
        }

        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        modalClose?.focus();
    }

    function closeModal() {
        if (!modal) return;

        resetModalMedia();
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');

        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
    }

    function bindCardClicks() {
        grid.querySelectorAll('.project-card').forEach((card) => {
            card.addEventListener('click', () => {
                const project = projectsCache.find((p) => p.id === card.dataset.projectId);
                openModal(project);
            });
        });
    }

    if (modalPlay) {
        modalPlay.addEventListener('click', () => {
            if (activeVideoUrl) playVideo(activeVideoUrl);
        });
    }

    if (modalImage) {
        modalImage.addEventListener('click', () => {
            if (activeVideoUrl && parseVideoEmbed(activeVideoUrl)) {
                playVideo(activeVideoUrl);
            }
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeModal);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.hidden) {
            closeModal();
        }
    });

    async function loadProjects() {
        show(loadingEl);
        hide(emptyEl);
        hide(errorEl);
        grid.innerHTML = '';

        try {
            if (!window.portfolioSupabase) {
                throw new Error('Database not configured. See SETUP.md.');
            }

            projectsCache = await window.PortfolioAPI.fetchPublishedProjects();

            hide(loadingEl);

            if (!projectsCache.length) {
                show(emptyEl);
                return;
            }

            grid.innerHTML = projectsCache.map(renderCard).join('');
            bindCardClicks();
        } catch (err) {
            console.error('[Portfolio]', err);
            hide(loadingEl);
            show(errorEl);
            if (errorEl) {
                errorEl.textContent =
                    err.message || 'Unable to load projects. Please try again later.';
            }
        }
    }

    loadProjects();

    if (window.portfolioSupabase) {
        window.portfolioSupabase
            .channel('public-projects')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'projects' },
                () => loadProjects()
            )
            .subscribe();
    }
})();
