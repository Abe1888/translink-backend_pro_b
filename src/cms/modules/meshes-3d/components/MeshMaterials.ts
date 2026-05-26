/* ==========================================================================
   MESH MATERIALS COMPONENT - 3D Mesh Materials & Behavior Editor
   ========================================================================== */

import type { StateManager } from '../../../core/StateManager';

export class MeshMaterials {
    /**
     * Get mesh IDs associated with a material ID
     */
    private static getMeshIds(matId: string): string[] {
        switch (matId) {
            case 'fuelTank': return ['Fuel_tank'];
            case 'belt': return ['Belt'];
            case 'fuelHead': return ['Fuel_Head'];
            case 'fuelHeadCover': return ['Fuel_Head_cover'];
            case 'prob': return ['Prob'];
            case 'harness': return ['Harness'];
            case 'filter': return ['Filter'];
            case 'filterWireframe': return ['Filter_Wireframe'];
            case 'base': return ['Base'];
            case 'bolt': return ['Bolt_01', 'Bolt_02', 'Bolt_03', 'Bolt_04'];
            case 'light': return ['light'];
            case 'brandLogo': return ['Logo_Translink_pro', 'Text_Translink_pro'];
            case 'virtualStudio': return ['virtual_studio'];
            case 'truckBody': return ['Truck', 'Cab_door'];
            case 'truckLights': return ['Truck_Lights'];
            case 'truckGlass': return ['Cab_Glass', 'Cab_door_glass', 'Cab_Door_glass_frame'];
            case 'truckWheels': return ['axle001_Front_wheel_Left', 'axle001_Front_wheel_Right', 'axle002_wheel_Both_Left_Right', 'axle003_wheel_Both_Left_Right'];
            default: {
                const capitalized = matId.charAt(0).toUpperCase() + matId.slice(1);
                return [capitalized];
            }
        }
    }

    /**
     * Get human-readable label for material ID
     */
    private static getHumanLabel(matId: string): string {
        let humanLabel = matId.replace(/([A-Z])/g, ' $1');
        if (matId === 'prob') humanLabel = 'Precision Probe';
        if (matId === 'fuelTank') humanLabel = 'Fuel Tank';
        if (matId === 'fuelHead') humanLabel = 'Sensor Head';
        if (matId === 'fuelHeadCover') humanLabel = 'Sensor Head Cover';
        if (matId === 'brandLogo') humanLabel = 'Brand Emissive Logo';
        if (matId === 'filterWireframe') humanLabel = 'Filter Wireframe';
        if (matId === 'virtualStudio') humanLabel = 'Virtual Studio';
        if (matId === 'truckBody') humanLabel = 'Truck Body';
        if (matId === 'truckTires') humanLabel = 'Truck Tires';
        if (matId === 'truckWheels') humanLabel = 'Truck Wheels';
        if (matId === 'truckGlass') humanLabel = 'Truck Glass';
        if (matId === 'truckLights') humanLabel = 'Truck Lights';
        return humanLabel;
    }

    /**
     * Mark card dirty state based on changes
     */
    private static markCardDirtyState(
        cardEl: HTMLElement,
        matId: string,
        meshIds: string[],
        stateManager: StateManager
    ): void {
        const matCurrent = stateManager.getCurrentMeshMaterial().materials[matId];
        const matOriginal = stateManager.getOriginalMeshMaterial().materials[matId];
        let isMatChanged = false;
        if (matCurrent && matOriginal) {
            isMatChanged = JSON.stringify(matCurrent) !== JSON.stringify(matOriginal);
        }

        let isBehChanged = false;
        const meshes = stateManager.getCurrentMeshBehavior().meshes;
        const originalMeshes = stateManager.getOriginalMeshBehavior().meshes;
        
        for (const meshId of meshIds) {
            const behCurrent = meshes[meshId];
            const behOriginal = originalMeshes[meshId];
            if (behCurrent && JSON.stringify(behCurrent) !== JSON.stringify(behOriginal || {})) {
                isBehChanged = true;
                break;
            }
        }

        const isChanged = isMatChanged || isBehChanged;
        cardEl.classList.toggle('dirty', isChanged);

        let badge = cardEl.querySelector('.cms-field-dirty-marker');
        if (isChanged && !badge) {
            cardEl.querySelector('.cms-grid-card-header')!.insertAdjacentHTML('beforeend', '<span class="cms-field-dirty-marker">Modified</span>');
        } else if (!isChanged && badge) {
            badge.remove();
        }
    }

    /**
     * Render the mesh materials workspace
     */
    static render(
        stateManager: StateManager,
        containerEl: HTMLElement,
        onUpdate: () => void
    ): void {
        const meshes = stateManager.getCurrentMeshBehavior().meshes;
        const originalMeshes = stateManager.getOriginalMeshBehavior().meshes;
        const materials = stateManager.getCurrentMeshMaterial().materials;
        const originalMaterials = stateManager.getOriginalMeshMaterial().materials;

        let cardsHtml = '';
        Object.keys(materials).forEach(matId => {
            const matObj = materials[matId];
            const originalMatObj = originalMaterials[matId];
            const meshIds = this.getMeshIds(matId);

            // Compute if card is dirty initially
            let isMatChanged = JSON.stringify(matObj) !== JSON.stringify(originalMatObj);
            let isBehChanged = false;
            meshIds.forEach(meshId => {
                const meshObj = meshes[meshId];
                const originalMeshObj = originalMeshes[meshId];
                if (meshObj && JSON.stringify(meshObj) !== JSON.stringify(originalMeshObj || {})) {
                    isBehChanged = true;
                }
            });
            const isDirty = isMatChanged || isBehChanged;

            const humanLabel = this.getHumanLabel(matId);

            // 1. Behavior section
            let behaviorHtml = '';
            meshIds.forEach(meshId => {
                const meshObj = meshes[meshId];
                if (meshObj) {
                    const isVisible = meshObj.visible !== undefined ? meshObj.visible : 'default';
                    const overrideAnim = meshObj.overrideAnimation !== undefined ? meshObj.overrideAnimation : 'default';
                    
                    const subLabelHtml = meshIds.length > 1 
                        ? `<div class="cms-sub-mesh-label">${meshId.replace(/_/g, ' ')}</div>` 
                        : '';

                    behaviorHtml += `
                        <div class="cms-mesh-behavior-row" style="margin-top:${behaviorHtml ? '8px' : '0'};">
                            ${subLabelHtml}
                            <div class="cms-grid-card-field-row">
                                <span class="cms-grid-card-field-label">Visible State</span>
                                <select class="cms-select" id="field-beh-mesh-visible-${meshId}" style="width:130px;">
                                    <option value="default" ${isVisible === 'default' ? 'selected' : ''}>Inherit</option>
                                    <option value="true" ${isVisible === true ? 'selected' : ''}>True (Visible)</option>
                                    <option value="false" ${isVisible === false ? 'selected' : ''}>False (Hidden)</option>
                                </select>
                            </div>
                            <div class="cms-grid-card-field-row" style="margin-top:6px;">
                                <span class="cms-grid-card-field-label">Animation</span>
                                <select class="cms-select" id="field-beh-mesh-anim-${meshId}" style="width:130px;">
                                    <option value="default" ${overrideAnim === 'default' ? 'selected' : ''}>Inherit</option>
                                    <option value="true" ${overrideAnim === true ? 'selected' : ''}>True (Override)</option>
                                    <option value="false" ${overrideAnim === false ? 'selected' : ''}>False (Follow)</option>
                                </select>
                            </div>
                        </div>
                    `;
                }
            });

            // 2. Material section
            let materialHtml = '';
            if (matObj.color !== undefined) {
                materialHtml += `
                    <div class="cms-color-grid-item">
                        <span class="cms-color-grid-label">Base Color</span>
                        <div class="cms-color-picker-wrapper">
                            <input type="color" class="cms-color-chip" id="field-mat-color-${matId}" value="${matObj.color}">
                            <input type="text" class="cms-color-hex-text" id="field-mat-color-hex-${matId}" value="${matObj.color}" maxlength="7">
                        </div>
                    </div>
                `;
            }
            if (matObj.metalness !== undefined) {
                materialHtml += `
                    <div class="cms-slider-wrapper">
                        <div class="cms-slider-label-row">
                            <span>Metalness</span>
                            <span class="cms-slider-value-badge" id="val-badge-mat-metal-${matId}">${matObj.metalness.toFixed(2)}</span>
                        </div>
                        <input type="range" class="cms-range-input" id="field-mat-metal-${matId}" min="0" max="1" step="0.01" value="${matObj.metalness}">
                    </div>
                `;
            }
            if (matObj.roughness !== undefined) {
                materialHtml += `
                    <div class="cms-slider-wrapper">
                        <div class="cms-slider-label-row">
                            <span>Roughness</span>
                            <span class="cms-slider-value-badge" id="val-badge-mat-rough-${matId}">${matObj.roughness.toFixed(2)}</span>
                        </div>
                        <input type="range" class="cms-range-input" id="field-mat-rough-${matId}" min="0" max="1" step="0.01" value="${matObj.roughness}">
                    </div>
                `;
            }
            if (matObj.envMapIntensity !== undefined) {
                materialHtml += `
                    <div class="cms-slider-wrapper">
                        <div class="cms-slider-label-row">
                            <span>Env Map Intensity</span>
                            <span class="cms-slider-value-badge" id="val-badge-mat-env-${matId}">${matObj.envMapIntensity.toFixed(2)}</span>
                        </div>
                        <input type="range" class="cms-range-input" id="field-mat-env-${matId}" min="0" max="3" step="0.05" value="${matObj.envMapIntensity}">
                    </div>
                `;
            }
            if (matObj.emissive !== undefined) {
                materialHtml += `
                    <div class="cms-color-grid-item" style="margin-top:4px;">
                        <span class="cms-color-grid-label">Emissive Glow Color</span>
                        <div class="cms-color-picker-wrapper">
                            <input type="color" class="cms-color-chip" id="field-mat-emissive-${matId}" value="${matObj.emissive}">
                            <input type="text" class="cms-color-hex-text" id="field-mat-emissive-hex-${matId}" value="${matObj.emissive}" maxlength="7">
                        </div>
                    </div>
                    <div class="cms-slider-wrapper" style="margin-top:4px;">
                        <div class="cms-slider-label-row">
                            <span>Emissive Intensity</span>
                            <span class="cms-slider-value-badge" id="val-badge-mat-emis-int-${matId}">${matObj.emissiveIntensity.toFixed(2)}</span>
                        </div>
                        <input type="range" class="cms-range-input" id="field-mat-emis-int-${matId}" min="0" max="2" step="0.05" value="${matObj.emissiveIntensity}">
                    </div>
                `;
            }

            cardsHtml += `
                <div class="cms-grid-card-item ${isDirty ? 'dirty' : ''}" data-mat-id="${matId}">
                    <div class="cms-grid-card-header">
                        <span class="cms-grid-card-title">${humanLabel}</span>
                        <span class="cms-field-key" style="display:block;">materials.${matId}</span>
                        ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                    </div>
                    <div class="cms-grid-card-body">
                        ${behaviorHtml ? `
                            <div class="cms-card-section">
                                <div class="cms-card-section-title">Behavior Overrides</div>
                                <div class="cms-card-section-fields">
                                    ${behaviorHtml}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="cms-card-section">
                            <div class="cms-card-section-title">Material Aesthetics</div>
                            <div class="cms-card-section-fields">
                                ${materialHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        containerEl.innerHTML = `
            <div class="cms-view-container" style="max-width: 100%; padding: 16px;">
                <div class="cms-grid-cards sm-grid">
                    ${cardsHtml}
                </div>
            </div>
        `;

        // Bind interactive event listeners for each card
        Object.keys(materials).forEach(matId => {
            const matObj = materials[matId];
            const meshIds = this.getMeshIds(matId);

            const cardEl = containerEl.querySelector(`[data-mat-id="${matId}"]`) as HTMLElement;

            const updateCardDirty = () => {
                this.markCardDirtyState(cardEl, matId, meshIds, stateManager);
            };

            // Bind Mesh Behaviors
            meshIds.forEach(meshId => {
                const visibleSelect = document.getElementById(`field-beh-mesh-visible-${meshId}`) as HTMLSelectElement;
                const animSelect = document.getElementById(`field-beh-mesh-anim-${meshId}`) as HTMLSelectElement;

                if (visibleSelect && animSelect) {
                    const updateMeshConfig = () => {
                        const currentMeshObj: any = {};
                        if (visibleSelect.value === 'true') currentMeshObj.visible = true;
                        else if (visibleSelect.value === 'false') currentMeshObj.visible = false;
                        if (animSelect.value === 'true') currentMeshObj.overrideAnimation = true;
                        else if (animSelect.value === 'false') currentMeshObj.overrideAnimation = false;

                        stateManager.getCurrentMeshBehavior().meshes[meshId] = currentMeshObj;
                        onUpdate();
                        updateCardDirty();
                    };

                    visibleSelect.addEventListener('change', updateMeshConfig);
                    animSelect.addEventListener('change', updateMeshConfig);
                }
            });

            // Bind Material Aesthetics
            if (matObj.color !== undefined) {
                const picker = document.getElementById(`field-mat-color-${matId}`) as HTMLInputElement;
                const text = document.getElementById(`field-mat-color-hex-${matId}`) as HTMLInputElement;
                
                const updateColor = (hex: string) => {
                    stateManager.getCurrentMeshMaterial().materials[matId].color = hex;
                    onUpdate();
                    updateCardDirty();
                };

                picker.addEventListener('input', () => {
                    text.value = picker.value.toUpperCase();
                    updateColor(picker.value);
                });

                text.addEventListener('input', () => {
                    let hex = text.value.trim();
                    if (!hex.startsWith('#')) hex = '#' + hex;
                    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                        picker.value = hex;
                        updateColor(hex);
                    }
                });
            }

            if (matObj.metalness !== undefined) {
                const slider = document.getElementById(`field-mat-metal-${matId}`) as HTMLInputElement;
                const badge = document.getElementById(`val-badge-mat-metal-${matId}`)!;
                
                slider.addEventListener('input', () => {
                    const parsedVal = parseFloat(slider.value);
                    badge.textContent = parsedVal.toFixed(2);
                    stateManager.getCurrentMeshMaterial().materials[matId].metalness = parsedVal;
                    onUpdate();
                    updateCardDirty();
                });
            }

            if (matObj.roughness !== undefined) {
                const slider = document.getElementById(`field-mat-rough-${matId}`) as HTMLInputElement;
                const badge = document.getElementById(`val-badge-mat-rough-${matId}`)!;
                
                slider.addEventListener('input', () => {
                    const parsedVal = parseFloat(slider.value);
                    badge.textContent = parsedVal.toFixed(2);
                    stateManager.getCurrentMeshMaterial().materials[matId].roughness = parsedVal;
                    onUpdate();
                    updateCardDirty();
                });
            }

            if (matObj.envMapIntensity !== undefined) {
                const slider = document.getElementById(`field-mat-env-${matId}`) as HTMLInputElement;
                const badge = document.getElementById(`val-badge-mat-env-${matId}`)!;
                
                slider.addEventListener('input', () => {
                    const parsedVal = parseFloat(slider.value);
                    badge.textContent = parsedVal.toFixed(2);
                    stateManager.getCurrentMeshMaterial().materials[matId].envMapIntensity = parsedVal;
                    onUpdate();
                    updateCardDirty();
                });
            }

            if (matObj.emissive !== undefined) {
                const picker = document.getElementById(`field-mat-emissive-${matId}`) as HTMLInputElement;
                const text = document.getElementById(`field-mat-emissive-hex-${matId}`) as HTMLInputElement;
                const slider = document.getElementById(`field-mat-emis-int-${matId}`) as HTMLInputElement;
                const badge = document.getElementById(`val-badge-mat-emis-int-${matId}`)!;

                const updateEmissiveColor = (hex: string) => {
                    stateManager.getCurrentMeshMaterial().materials[matId].emissive = hex;
                    onUpdate();
                    updateCardDirty();
                };

                picker.addEventListener('input', () => {
                    text.value = picker.value.toUpperCase();
                    updateEmissiveColor(picker.value);
                });

                text.addEventListener('input', () => {
                    let hex = text.value.trim();
                    if (!hex.startsWith('#')) hex = '#' + hex;
                    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                        picker.value = hex;
                        updateEmissiveColor(hex);
                    }
                });

                slider.addEventListener('input', () => {
                    const parsedVal = parseFloat(slider.value);
                    badge.textContent = parsedVal.toFixed(2);
                    stateManager.getCurrentMeshMaterial().materials[matId].emissiveIntensity = parsedVal;
                    onUpdate();
                    updateCardDirty();
                });
            }
        });
    }
}
