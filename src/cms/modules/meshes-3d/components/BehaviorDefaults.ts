/* ==========================================================================
   BEHAVIOR DEFAULTS COMPONENT - 3D Mesh Behavior Defaults Editor
   ========================================================================== */

import type { StateManager } from '../../../core/StateManager';

export class BehaviorDefaults {
    /**
     * Render the behavior defaults workspace
     */
    static render(
        stateManager: StateManager,
        containerEl: HTMLElement,
        onUpdate: () => void
    ): void {
        const defaults = stateManager.getCurrentMeshBehavior().defaults;
        const originalDefaults = stateManager.getOriginalMeshBehavior().defaults;

        let cardsHtml = '';
        Object.keys(defaults).forEach(key => {
            const val = defaults[key];
            const isDirty = val !== originalDefaults[key];

            let inputHtml = '';
            if (typeof val === 'boolean') {
                inputHtml = `
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                        <span style="font-size:11px;color:var(--t2);">Enabled</span>
                        <label class="cms-switch">
                            <input type="checkbox" id="field-beh-def-${key}" ${val ? 'checked' : ''}>
                            <span class="cms-slider"></span>
                        </label>
                    </div>`;
            } else if (key === 'opacity') {
                inputHtml = `
                    <div class="cms-slider-wrapper">
                        <div class="cms-slider-label-row">
                            <span>Level</span>
                            <span class="cms-slider-value-badge" id="val-badge-beh-def-opacity">${val.toFixed(2)}</span>
                        </div>
                        <input type="range" class="cms-range-input" id="field-beh-def-opacity" min="0" max="1" step="0.05" value="${val}">
                    </div>`;
            } else if (key === 'visible') {
                inputHtml = `
                    <select class="cms-select" id="field-beh-def-visible">
                        <option value="null" ${val === null ? 'selected' : ''}>Default (null)</option>
                        <option value="true" ${val === true ? 'selected' : ''}>True</option>
                        <option value="false" ${val === false ? 'selected' : ''}>False</option>
                    </select>`;
            } else {
                inputHtml = `<input type="number" class="cms-input" id="field-beh-def-${key}" value="${val}">`;
            }

            cardsHtml += `
                <div class="cms-grid-card-item ${isDirty ? 'dirty' : ''}" id="card-beh-def-${key}">
                    <div class="cms-grid-card-header">
                        <span class="cms-grid-card-title">${key.replace(/([A-Z])/g, ' $1')}</span>
                        <span class="cms-field-key" style="display:block;">defaults.${key}</span>
                        ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                    </div>
                    <div class="cms-grid-card-body">${inputHtml}</div>
                </div>
            `;
        });

        containerEl.innerHTML = `
            <div class="cms-view-container">
                <div class="cms-grid-cards cms-grid-cards-sm">${cardsHtml}</div>
            </div>
        `;

        // Bind listeners
        Object.keys(defaults).forEach(key => {
            const val = defaults[key];
            const originalVal = originalDefaults[key];

            const markDirty = (card: Element, isChanged: boolean) => {
                card.classList.toggle('dirty', isChanged);
                let badge = card.querySelector('.cms-field-dirty-marker');
                if (isChanged && !badge) {
                    card.querySelector('.cms-grid-card-header')!.insertAdjacentHTML('beforeend', '<span class="cms-field-dirty-marker">Modified</span>');
                } else if (!isChanged && badge) {
                    badge.remove();
                }
            };

            if (typeof val === 'boolean') {
                const input = document.getElementById(`field-beh-def-${key}`) as HTMLInputElement;
                input.addEventListener('change', () => {
                    stateManager.getCurrentMeshBehavior().defaults[key] = input.checked;
                    onUpdate();
                    markDirty(input.closest('.cms-grid-card-item')!, input.checked !== originalVal);
                });
            } else if (key === 'opacity') {
                const slider = document.getElementById('field-beh-def-opacity') as HTMLInputElement;
                const badge = document.getElementById('val-badge-beh-def-opacity')!;
                slider.addEventListener('input', () => {
                    const v = parseFloat(slider.value);
                    badge.textContent = v.toFixed(2);
                    stateManager.getCurrentMeshBehavior().defaults.opacity = v;
                    onUpdate();
                    markDirty(slider.closest('.cms-grid-card-item')!, v !== originalVal);
                });
            } else if (key === 'visible') {
                const select = document.getElementById('field-beh-def-visible') as HTMLSelectElement;
                select.addEventListener('change', () => {
                    let parsed: boolean | null = null;
                    if (select.value === 'true') parsed = true;
                    else if (select.value === 'false') parsed = false;
                    stateManager.getCurrentMeshBehavior().defaults.visible = parsed;
                    onUpdate();
                    markDirty(select.closest('.cms-grid-card-item')!, parsed !== originalVal);
                });
            } else {
                const input = document.getElementById(`field-beh-def-${key}`) as HTMLInputElement;
                input.addEventListener('input', () => {
                    const v = parseFloat(input.value) || 0;
                    stateManager.getCurrentMeshBehavior().defaults[key] = v;
                    onUpdate();
                    markDirty(input.closest('.cms-grid-card-item')!, v !== originalVal);
                });
            }
        });
    }
}
