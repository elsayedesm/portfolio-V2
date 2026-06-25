/**
 * Add / edit project form with drag-and-drop image upload.
 */
(async function () {
    'use strict';

    const session = await window.AdminAuth.requireAuth('index.html');
    if (!session) return;

    window.AdminLayout.init(session);

    const form = document.getElementById('project-form');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('thumbnail-file');
    const preview = document.getElementById('dropzone-preview');
    const errorEl = document.getElementById('form-error');
    const successEl = document.getElementById('form-success');
    const submitBtn = document.getElementById('form-submit');
    const pageTitle = document.getElementById('form-page-title');

    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');
    const isEdit = !!projectId;

    let selectedFile = null;
    let existingProject = null;

    if (pageTitle) {
        pageTitle.textContent = isEdit ? 'EDIT PROJECT' : 'ADD PROJECT';
    }
    if (submitBtn) {
        submitBtn.textContent = isEdit ? 'Save Changes' : 'Create Project';
    }

    function showError(msg) {
        if (!errorEl) return;
        errorEl.hidden = !msg;
        errorEl.textContent = msg || '';
    }

    function showSuccess(msg) {
        if (!successEl) return;
        successEl.hidden = !msg;
        successEl.textContent = msg || '';
    }

    function setPreview(url) {
        if (!preview || !dropzone) return;
        if (url) {
            preview.src = url;
            dropzone.classList.add('has-preview');
        } else {
            preview.removeAttribute('src');
            dropzone.classList.remove('has-preview');
        }
    }

    function handleFile(file) {
        const check = window.PortfolioValidators.validateImageFile(file);
        if (!check.valid) {
            showError(check.error);
            return;
        }
        selectedFile = file;
        showError('');
        setPreview(URL.createObjectURL(file));
    }

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', () => {
            if (fileInput.files[0]) handleFile(fileInput.files[0]);
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        });
    }

    function fillForm(project) {
        form.title.value = project.title;
        form.category.value = project.category || '';
        form.description.value = project.description || '';
        form.project_date.value = project.project_date || '';
        form.technologies.value = (project.technologies || []).join(', ');
        form.project_link.value = project.project_link || '';
        form.sort_order.value = project.sort_order ?? 0;
        form.is_published.checked = project.is_published;
        if (project.thumbnail_url) setPreview(project.thumbnail_url);
    }

    if (isEdit) {
        try {
            existingProject = await window.PortfolioAPI.fetchProjectById(projectId);
            if (!existingProject) {
                showError('Project not found.');
                submitBtn.disabled = true;
            } else {
                fillForm(existingProject);
            }
        } catch (err) {
            showError(err.message);
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showError('');
        showSuccess('');
        submitBtn.disabled = true;

        const formData = {
            title: form.title.value,
            category: form.category.value,
            description: form.description.value,
            project_date: form.project_date.value,
            technologies: form.technologies.value,
            project_link: form.project_link.value,
            sort_order: form.sort_order.value,
            is_published: form.is_published.checked
        };

        try {
            const payload = window.PortfolioAPI.buildPayload(formData);
            let saved;

            if (isEdit && existingProject) {
                let thumbnailUrl = existingProject.thumbnail_url;

                if (selectedFile) {
                    if (existingProject.thumbnail_url) {
                        await window.PortfolioAPI.deleteThumbnailByUrl(
                            existingProject.thumbnail_url
                        );
                    }
                    thumbnailUrl = await window.PortfolioAPI.uploadThumbnail(
                        selectedFile,
                        projectId
                    );
                }

                saved = await window.PortfolioAPI.updateProject(projectId, {
                    ...payload,
                    thumbnail_url: thumbnailUrl
                });
                showSuccess('Project updated. Changes are live on your website.');
            } else {
                saved = await window.PortfolioAPI.createProject({
                    ...payload,
                    thumbnail_url: ''
                });

                if (selectedFile) {
                    const url = await window.PortfolioAPI.uploadThumbnail(
                        selectedFile,
                        saved.id
                    );
                    saved = await window.PortfolioAPI.updateProject(saved.id, {
                        thumbnail_url: url
                    });
                }

                showSuccess('Project created successfully.');
                setTimeout(() => {
                    window.location.href = `project-form.html?id=${saved.id}`;
                }, 1200);
            }

            existingProject = saved;
            if (selectedFile) setPreview(saved.thumbnail_url);
            selectedFile = null;
        } catch (err) {
            showError(err.message || 'Failed to save project.');
        } finally {
            submitBtn.disabled = false;
        }
    });
})();
