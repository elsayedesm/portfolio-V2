/**
 * Input validation helpers (client-side; RLS enforces server-side access).
 */
window.PortfolioValidators = {
    MAX_TITLE: 200,
    MAX_CATEGORY: 100,
    MAX_DESCRIPTION: 5000,
    MAX_LINK: 2048,
    MAX_TECH: 50,
    MAX_TECH_LENGTH: 80,
    MAX_IMAGE_BYTES: 5 * 1024 * 1024,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],

    trim(str) {
        return typeof str === 'string' ? str.trim() : '';
    },

    isValidUrl(url) {
        if (!url) return true;
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    },

    parseTechnologies(raw) {
        if (!raw) return [];
        return raw
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, this.MAX_TECH)
            .map((t) => t.slice(0, this.MAX_TECH_LENGTH));
    },

    validateProjectForm(data) {
        const errors = [];
        const title = this.trim(data.title);

        if (!title) errors.push('Title is required.');
        if (title.length > this.MAX_TITLE) errors.push('Title is too long (max 200 characters).');

        if (this.trim(data.category).length > this.MAX_CATEGORY) {
            errors.push('Category is too long (max 100 characters).');
        }

        if (this.trim(data.description).length > this.MAX_DESCRIPTION) {
            errors.push('Description is too long (max 5000 characters).');
        }

        const link = this.trim(data.project_link);
        if (link && !this.isValidUrl(link)) {
            errors.push('Project link must be a valid http or https URL.');
        }
        if (link.length > this.MAX_LINK) errors.push('Project link is too long.');

        if (data.project_date) {
            const d = new Date(data.project_date);
            if (Number.isNaN(d.getTime())) errors.push('Invalid project date.');
        }

        return { valid: errors.length === 0, errors, title };
    },

    validateImageFile(file) {
        if (!file) return { valid: true };
        if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return { valid: false, error: 'Image must be JPEG, PNG, WebP, or GIF.' };
        }
        if (file.size > this.MAX_IMAGE_BYTES) {
            return { valid: false, error: 'Image must be 5 MB or smaller.' };
        }
        return { valid: true };
    }
};
