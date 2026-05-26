/* ==========================================================================
   GLOBAL WORKSPACE - Global Layout Content Editor
   ========================================================================== */

import type { StateManager } from '../../../core/StateManager';
import { escapeHtml } from '../../../shared/utils/dom.utils';

export class GlobalWorkspace {
    /**
     * Render the global workspace for language editing
     */
    static render(stateManager: StateManager, mainContentEl: HTMLElement, onUpdate: () => void): void {
        const currentConfig = stateManager.getCurrentConfig();
        const originalConfig = stateManager.getOriginalConfig();

        const enGlobal = currentConfig.en.global;
        const amGlobal = currentConfig.am.global;
        const arGlobal = currentConfig.ar.global;

        let rowsHtml = '';
        Object.keys(enGlobal).forEach(key => {
            const enVal = enGlobal[key] || '';
            const amVal = amGlobal[key] || '';
            const arVal = arGlobal[key] || '';

            const isDirtyEn = enVal !== originalConfig.en?.global?.[key];
            const isDirtyAm = amVal !== originalConfig.am?.global?.[key];
            const isDirtyAr = arVal !== originalConfig.ar?.global?.[key];
            const isDirty = isDirtyEn || isDirtyAm || isDirtyAr;

            rowsHtml += `
                <div class="cms-multilang-row ${isDirty ? 'dirty' : ''}">
                    <div class="cms-multilang-label-col">
                        <label class="cms-multilang-label" for="field-global-${key}-en">${key.replace(/_/g, ' ')}</label>
                        <span class="cms-multilang-key">global.${key}</span>
                        ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                    </div>
                    <div>
                        <input type="text" class="cms-input cms-input-en" id="field-global-${key}-en" value="${escapeHtml(enVal)}">
                    </div>
                    <div>
                        <input type="text" class="cms-input cms-input-am" id="field-global-${key}-am" value="${escapeHtml(amVal)}">
                    </div>
                    <div>
                        <input type="text" class="cms-input cms-input-ar" id="field-global-${key}-ar" value="${escapeHtml(arVal)}">
                    </div>
                </div>
            `;
        });

        mainContentEl.innerHTML = `
            <div class="cms-view-container">
                <div class="cms-fields-grid">
                    <div class="cms-multilang-header">
                        <span>Label / Path</span>
                        <span>English (EN)</span>
                        <span>Amharic (AM)</span>
                        <span>Arabic (AR)</span>
                    </div>
                    ${rowsHtml}
                </div>
            </div>
        `;

        // Bind input listeners for all three languages
        Object.keys(enGlobal).forEach(key => {
            ['en', 'am', 'ar'].forEach(lang => {
                const el = document.getElementById(`field-global-${key}-${lang}`) as HTMLInputElement;
                if (!el) return;
                
                el.addEventListener('input', () => {
                    const config = stateManager.getCurrentConfig();
                    config[lang].global[key] = el.value;
                    stateManager.setCurrentConfig(config);
                    onUpdate();

                    const row = el.closest('.cms-multilang-row')!;
                    const origConfig = stateManager.getOriginalConfig();
                    const isDirtyEn = config.en.global[key] !== origConfig.en?.global?.[key];
                    const isDirtyAm = config.am.global[key] !== origConfig.am?.global?.[key];
                    const isDirtyAr = config.ar.global[key] !== origConfig.ar?.global?.[key];
                    const rowDirty = isDirtyEn || isDirtyAm || isDirtyAr;

                    row.classList.toggle('dirty', rowDirty);

                    let badge = row.querySelector('.cms-field-dirty-marker');
                    if (rowDirty && !badge) {
                        row.querySelector('.cms-multilang-label-col')!.insertAdjacentHTML('beforeend', '<span class="cms-field-dirty-marker">Modified</span>');
                    } else if (!rowDirty && badge) {
                        badge.remove();
                    }
                });
            });
        });
    }
}
