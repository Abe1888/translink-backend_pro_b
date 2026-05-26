/* ==========================================================================
   DOM UTILITIES - DOM manipulation helpers
   ========================================================================== */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Hide the loading spinner with animation
 */
export function hideLoader(): void {
    const loader = document.querySelector('.cms-loading-wrapper');
    if (loader) {
        loader.classList.add('hide');
        setTimeout(() => loader.remove(), 400);
    }
}

/**
 * Get element by ID with type safety
 */
export function getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with id "${id}" not found`);
    }
    return element as T;
}

/**
 * Get element by ID or return null
 */
export function getElementOrNull<T extends HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
}
