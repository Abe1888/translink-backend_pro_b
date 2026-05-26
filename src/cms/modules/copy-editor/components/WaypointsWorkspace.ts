/* ==========================================================================
   WAYPOINTS WORKSPACE - Waypoints Content Editor
   ========================================================================== */

import type { StateManager } from '../../../core/StateManager';
import { escapeHtml } from '../../../shared/utils/dom.utils';
import { TagEditor } from '../../../shared/components/TagEditor';

export class WaypointsWorkspace {
    /**
     * Render the waypoints workspace for language editing
     */
    static render(stateManager: StateManager, mainContentEl: HTMLElement, onUpdate: () => void): void {
        const waypointId = stateManager.getActiveNavId();
        const currentConfig = stateManager.getCurrentConfig();
        const originalConfig = stateManager.getOriginalConfig();

        const enWaypoint = currentConfig.en.waypoints[waypointId];
        const amWaypoint = currentConfig.am.waypoints[waypointId];
        const arWaypoint = currentConfig.ar.waypoints[waypointId];

        if (!enWaypoint) return;

        let rowsHtml = '';
        const fields = Object.keys(enWaypoint);

        fields.forEach(key => {
            const enVal = enWaypoint[key];
            const amVal = amWaypoint?.[key] || '';
            const arVal = arWaypoint?.[key] || '';

            const isDirtyEn = JSON.stringify(enVal) !== JSON.stringify(originalConfig.en?.waypoints?.[waypointId]?.[key]);
            const isDirtyAm = JSON.stringify(amVal) !== JSON.stringify(originalConfig.am?.waypoints?.[waypointId]?.[key]);
            const isDirtyAr = JSON.stringify(arVal) !== JSON.stringify(originalConfig.ar?.waypoints?.[waypointId]?.[key]);
            const isDirty = isDirtyEn || isDirtyAm || isDirtyAr;

            if (Array.isArray(enVal)) {
                rowsHtml += `
                    <div class="cms-multilang-row cms-multilang-vertical ${isDirty ? 'dirty' : ''}" id="card-way-${key}">
                        <div class="cms-multilang-label-col">
                            <div>
                                <span class="cms-multilang-label">${key.replace(/_/g, ' ')}</span>
                                <span class="cms-multilang-key">waypoints.${waypointId}.${key}</span>
                            </div>
                            ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        <div class="cms-multilang-inputs-grid">
                            <div class="cms-tag-editor" id="tag-editor-way-${key}-en">
                                <div class="cms-tags-list" id="tags-list-way-${key}-en"></div>
                                <input type="text" class="cms-tag-input" id="tag-input-way-${key}-en" placeholder="+ Add EN tag...">
                            </div>
                            <div class="cms-tag-editor" id="tag-editor-way-${key}-am">
                                <div class="cms-tags-list" id="tags-list-way-${key}-am"></div>
                                <input type="text" class="cms-tag-input" id="tag-input-way-${key}-am" placeholder="+ Add AM tag...">
                            </div>
                            <div class="cms-tag-editor" id="tag-editor-way-${key}-ar">
                                <div class="cms-tags-list" id="tags-list-way-${key}-ar"></div>
                                <input type="text" class="cms-tag-input" id="tag-input-way-${key}-ar" placeholder="+ Add AR tag...">
                            </div>
                        </div>
                    </div>
                `;
            } else {
                const isLongText = key === 'description' || enVal.length > 50;

                if (isLongText) {
                    rowsHtml += `
                        <div class="cms-multilang-row cms-multilang-vertical ${isDirty ? 'dirty' : ''}">
                            <div class="cms-multilang-label-col">
                                <div>
                                    <span class="cms-multilang-label" for="field-way-${key}-en">${key.replace(/_/g, ' ')}</span>
                                    <span class="cms-multilang-key">waypoints.${waypointId}.${key}</span>
                                </div>
                                ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                            </div>
                            <div class="cms-multilang-inputs-grid">
                                <textarea class="cms-textarea cms-textarea-en" id="field-way-${key}-en">${escapeHtml(enVal)}</textarea>
                                <textarea class="cms-textarea cms-textarea-am" id="field-way-${key}-am">${escapeHtml(amVal)}</textarea>
                                <textarea class="cms-textarea cms-textarea-ar" id="field-way-${key}-ar">${escapeHtml(arVal)}</textarea>
                            </div>
                        </div>
                    `;
                } else {
                    rowsHtml += `
                        <div class="cms-multilang-row ${isDirty ? 'dirty' : ''}">
                            <div class="cms-multilang-label-col">
                                <label class="cms-multilang-label" for="field-way-${key}-en">${key.replace(/_/g, ' ')}</label>
                                <span class="cms-multilang-key">waypoints.${waypointId}.${key}</span>
                                ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                            </div>
                            <div>
                                <input type="text" class="cms-input cms-input-en" id="field-way-${key}-en" value="${escapeHtml(enVal)}">
                            </div>
                            <div>
                                <input type="text" class="cms-input cms-input-am" id="field-way-${key}-am" value="${escapeHtml(amVal)}">
                            </div>
                            <div>
                                <input type="text" class="cms-input cms-input-ar" id="field-way-${key}-ar" value="${escapeHtml(arVal)}">
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

        // Bind interactive event listeners for all waypoint inputs/tag-editors
        fields.forEach(key => {
            const enVal = enWaypoint[key];

            if (Array.isArray(enVal)) {
                ['en', 'am', 'ar'].forEach(lang => {
                    const config = stateManager.getCurrentConfig();
                    const origConfig = stateManager.getOriginalConfig();
                    const val = config[lang].waypoints[waypointId][key];
                    const origVal = origConfig[lang]?.waypoints?.[waypointId]?.[key];
                    
                    TagEditor.setup(`way-${key}-${lang}`, val, origVal, (newTags) => {
                        const updatedConfig = stateManager.getCurrentConfig();
                        updatedConfig[lang].waypoints[waypointId][key] = newTags;
                        stateManager.setCurrentConfig(updatedConfig);
                        onUpdate();

                        const card = document.getElementById(`card-way-${key}`)!;
                        const currentCfg = stateManager.getCurrentConfig();
                        const originalCfg = stateManager.getOriginalConfig();
                        const isDirtyEn = JSON.stringify(currentCfg.en.waypoints[waypointId][key]) !== JSON.stringify(originalCfg.en?.waypoints?.[waypointId]?.[key]);
                        const isDirtyAm = JSON.stringify(currentCfg.am.waypoints[waypointId][key]) !== JSON.stringify(originalCfg.am?.waypoints?.[waypointId]?.[key]);
                        const isDirtyAr = JSON.stringify(currentCfg.ar.waypoints[waypointId][key]) !== JSON.stringify(originalCfg.ar?.waypoints?.[waypointId]?.[key]);
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
                    const el = document.getElementById(`field-way-${key}-${lang}`) as HTMLInputElement | HTMLTextAreaElement;
                    if (!el) return;
                    
                    el.addEventListener('input', () => {
                        const config = stateManager.getCurrentConfig();
                        config[lang].waypoints[waypointId][key] = el.value;
                        stateManager.setCurrentConfig(config);
                        onUpdate();

                        const row = el.closest('.cms-multilang-row')!;
                        const origConfig = stateManager.getOriginalConfig();
                        const isDirtyEn = config.en.waypoints[waypointId][key] !== origConfig.en?.waypoints?.[waypointId]?.[key];
                        const isDirtyAm = config.am.waypoints[waypointId][key] !== origConfig.am?.waypoints?.[waypointId]?.[key];
                        const isDirtyAr = config.ar.waypoints[waypointId][key] !== origConfig.ar?.waypoints?.[waypointId]?.[key];
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
