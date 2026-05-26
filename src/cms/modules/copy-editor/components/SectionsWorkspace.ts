/* ==========================================================================
   SECTIONS WORKSPACE - Sections Content Editor
   ========================================================================== */

import type { StateManager } from '../../../core/StateManager';
import { escapeHtml } from '../../../shared/utils/dom.utils';
import { TagEditor } from '../../../shared/components/TagEditor';

export class SectionsWorkspace {
    /**
     * Render the sections workspace for language editing
     */
    static render(stateManager: StateManager, mainContentEl: HTMLElement, onUpdate: () => void): void {
        const sectionId = stateManager.getActiveNavId();
        const currentConfig = stateManager.getCurrentConfig();
        const originalConfig = stateManager.getOriginalConfig();

        const enSection = currentConfig.en.sections[sectionId];
        const amSection = currentConfig.am.sections[sectionId];
        const arSection = currentConfig.ar.sections[sectionId];

        if (!enSection) return;

        let rowsHtml = '';
        const fields = Object.keys(enSection).filter(k => k !== 'id');

        fields.forEach(key => {
            const enVal = enSection[key];
            const amVal = amSection?.[key] || '';
            const arVal = arSection?.[key] || '';

            const isDirtyEn = JSON.stringify(enVal) !== JSON.stringify(originalConfig.en?.sections?.[sectionId]?.[key]);
            const isDirtyAm = JSON.stringify(amVal) !== JSON.stringify(originalConfig.am?.sections?.[sectionId]?.[key]);
            const isDirtyAr = JSON.stringify(arVal) !== JSON.stringify(originalConfig.ar?.sections?.[sectionId]?.[key]);
            const isDirty = isDirtyEn || isDirtyAm || isDirtyAr;

            if (Array.isArray(enVal)) {
                rowsHtml += `
                    <div class="cms-multilang-row cms-multilang-vertical ${isDirty ? 'dirty' : ''}" id="card-sec-${key}">
                        <div class="cms-multilang-label-col">
                            <div>
                                <span class="cms-multilang-label">${key.replace(/_/g, ' ')}</span>
                                <span class="cms-multilang-key">sections.${sectionId}.${key}</span>
                            </div>
                            ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        <div class="cms-multilang-inputs-grid">
                            <div class="cms-tag-editor" id="tag-editor-sec-${key}-en">
                                <div class="cms-tags-list" id="tags-list-sec-${key}-en"></div>
                                <input type="text" class="cms-tag-input" id="tag-input-sec-${key}-en" placeholder="+ Add EN tag...">
                            </div>
                            <div class="cms-tag-editor" id="tag-editor-sec-${key}-am">
                                <div class="cms-tags-list" id="tags-list-sec-${key}-am"></div>
                                <input type="text" class="cms-tag-input" id="tag-input-sec-${key}-am" placeholder="+ Add AM tag...">
                            </div>
                            <div class="cms-tag-editor" id="tag-editor-sec-${key}-ar">
                                <div class="cms-tags-list" id="tags-list-sec-${key}-ar"></div>
                                <input type="text" class="cms-tag-input" id="tag-input-sec-${key}-ar" placeholder="+ Add AR tag...">
                            </div>
                        </div>
                    </div>
                `;
            } else {
                const isLongText = key.includes('desc') || key.includes('description') || enVal.length > 50;

                if (isLongText) {
                    rowsHtml += `
                        <div class="cms-multilang-row cms-multilang-vertical ${isDirty ? 'dirty' : ''}">
                            <div class="cms-multilang-label-col">
                                <div>
                                    <span class="cms-multilang-label" for="field-sec-${key}-en">${key.replace(/_/g, ' ')}</span>
                                    <span class="cms-multilang-key">sections.${sectionId}.${key}</span>
                                </div>
                                ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                            </div>
                            <div class="cms-multilang-inputs-grid">
                                <textarea class="cms-textarea cms-textarea-en" id="field-sec-${key}-en">${escapeHtml(enVal)}</textarea>
                                <textarea class="cms-textarea cms-textarea-am" id="field-sec-${key}-am">${escapeHtml(amVal)}</textarea>
                                <textarea class="cms-textarea cms-textarea-ar" id="field-sec-${key}-ar">${escapeHtml(arVal)}</textarea>
                            </div>
                        </div>
                    `;
                } else {
                    rowsHtml += `
                        <div class="cms-multilang-row ${isDirty ? 'dirty' : ''}">
                            <div class="cms-multilang-label-col">
                                <label class="cms-multilang-label" for="field-sec-${key}-en">${key.replace(/_/g, ' ')}</label>
                                <span class="cms-multilang-key">sections.${sectionId}.${key}</span>
                                ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                            </div>
                            <div>
                                <input type="text" class="cms-input cms-input-en" id="field-sec-${key}-en" value="${escapeHtml(enVal)}">
                            </div>
                            <div>
                                <input type="text" class="cms-input cms-input-am" id="field-sec-${key}-am" value="${escapeHtml(amVal)}">
                            </div>
                            <div>
                                <input type="text" class="cms-input cms-input-ar" id="field-sec-${key}-ar" value="${escapeHtml(arVal)}">
                            </div>
                        </div>
                    `;
                }
            }
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

        // Bind interactive event listeners for all sections inputs/tag-editors
        fields.forEach(key => {
            const enVal = enSection[key];

            if (Array.isArray(enVal)) {
                ['en', 'am', 'ar'].forEach(lang => {
                    const config = stateManager.getCurrentConfig();
                    const origConfig = stateManager.getOriginalConfig();
                    const val = config[lang].sections[sectionId][key];
                    const origVal = origConfig[lang]?.sections?.[sectionId]?.[key];
                    
                    TagEditor.setup(`sec-${key}-${lang}`, val, origVal, (newTags) => {
                        const updatedConfig = stateManager.getCurrentConfig();
                        updatedConfig[lang].sections[sectionId][key] = newTags;
                        stateManager.setCurrentConfig(updatedConfig);
                        onUpdate();

                        const card = document.getElementById(`card-sec-${key}`)!;
                        const currentCfg = stateManager.getCurrentConfig();
                        const originalCfg = stateManager.getOriginalConfig();
                        const isDirtyEn = JSON.stringify(currentCfg.en.sections[sectionId][key]) !== JSON.stringify(originalCfg.en?.sections?.[sectionId]?.[key]);
                        const isDirtyAm = JSON.stringify(currentCfg.am.sections[sectionId][key]) !== JSON.stringify(originalCfg.am?.sections?.[sectionId]?.[key]);
                        const isDirtyAr = JSON.stringify(currentCfg.ar.sections[sectionId][key]) !== JSON.stringify(originalCfg.ar?.sections?.[sectionId]?.[key]);
                        const rowDirty = isDirtyEn || isDirtyAm || isDirtyAr;

                        card.classList.toggle('dirty', rowDirty);

                        let badge = card.querySelector('.cms-field-dirty-marker');
                        if (rowDirty && !badge) {
                            card.querySelector('.cms-multilang-label-col')!.insertAdjacentHTML('beforeend', '<span class="cms-field-dirty-marker">Modified</span>');
                        } else if (!rowDirty && badge) {
                            badge.remove();
                        }
                    });
                });
            } else {
                ['en', 'am', 'ar'].forEach(lang => {
                    const el = document.getElementById(`field-sec-${key}-${lang}`) as HTMLInputElement | HTMLTextAreaElement;
                    if (!el) return;
                    
                    el.addEventListener('input', () => {
                        const config = stateManager.getCurrentConfig();
                        config[lang].sections[sectionId][key] = el.value;
                        stateManager.setCurrentConfig(config);
                        onUpdate();

                        const row = el.closest('.cms-multilang-row')!;
                        const origConfig = stateManager.getOriginalConfig();
                        const isDirtyEn = config.en.sections[sectionId][key] !== origConfig.en?.sections?.[sectionId]?.[key];
                        const isDirtyAm = config.am.sections[sectionId][key] !== origConfig.am?.sections?.[sectionId]?.[key];
                        const isDirtyAr = config.ar.sections[sectionId][key] !== origConfig.ar?.sections?.[sectionId]?.[key];
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
            }
        });
    }
}
