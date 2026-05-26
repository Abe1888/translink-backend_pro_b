/* ==========================================================================
   TAG EDITOR - Tag Badge System Builder
   ========================================================================== */

import { escapeHtml } from '../utils/dom.utils';

export class TagEditor {
    /**
     * Setup a tag editor with add/remove functionality
     * @param uniqueId - Unique identifier for this tag editor instance
     * @param tags - Current array of tags
     * @param originalTags - Original array of tags for dirty tracking
     * @param onChange - Callback when tags change
     */
    static setup(
        uniqueId: string,
        tags: string[],
        originalTags: string[],
        onChange: (tags: string[]) => void
    ): void {
        const listEl = document.getElementById(`tags-list-${uniqueId}`)!;
        const inputEl = document.getElementById(`tag-input-${uniqueId}`) as HTMLInputElement;
        const cardEl = document.getElementById(`card-${uniqueId}`)!;

        const renderPills = () => {
            listEl.innerHTML = tags.map((t, idx) => `
                <div class="cms-tag-badge" data-index="${idx}">
                    <span>${escapeHtml(t)}</span>
                    <span class="cms-tag-badge-remove" data-index="${idx}">&times;</span>
                </div>
            `).join('');
        };

        const addTag = () => {
            const rawTag = inputEl.value.trim();
            if (rawTag) {
                tags.push(rawTag);
                inputEl.value = '';
                renderPills();
                onChange(tags);
                
                const isChanged = JSON.stringify(tags) !== JSON.stringify(originalTags);
                cardEl.classList.toggle('dirty', isChanged);
            }
        };

        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            }
        });

        inputEl.addEventListener('blur', addTag);

        listEl.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('cms-tag-badge-remove')) {
                const idx = parseInt(target.getAttribute('data-index')!);
                tags.splice(idx, 1);
                renderPills();
                onChange(tags);
                
                const isChanged = JSON.stringify(tags) !== JSON.stringify(originalTags);
                cardEl.classList.toggle('dirty', isChanged);
            }
        });

        renderPills();
    }
}
