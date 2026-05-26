/* ==========================================================================
   TIMELINE RENDERER COMPONENT - Camera Path Timeline Editor
   ========================================================================== */

import type { StateManager } from '../../../core/StateManager';
import type { Keyframe, TimelineType } from '../../../types/camera.types';
import { SECTION_LABELS } from '../../../shared/constants';

export class TimelineRenderer {
    /**
     * Get timeline key based on timeline type
     */
    private static getTimelineKey(timelineType: TimelineType): string {
        switch (timelineType) {
            case 'tablet': return 'cameraKeyframesTablet';
            case 'mobile': return 'cameraKeyframesMobile';
            default: return 'cameraKeyframesDesktop';
        }
    }

    /**
     * Get timeline title based on timeline type
     */
    private static getTimelineTitle(timelineType: TimelineType): string {
        switch (timelineType) {
            case 'tablet': return 'Tablet Camera Path Timeline';
            case 'mobile': return 'Mobile Camera Path Timeline';
            default: return 'Desktop Camera Path Timeline';
        }
    }

    /**
     * Render a single keyframe card
     */
    private static renderKeyframeCard(
        kf: Keyframe,
        globalIdx: number,
        isDirty: boolean
    ): string {
        return `
            <div class="cms-keyframe-card ${isDirty ? 'dirty' : ''}" id="card-cam-key-${globalIdx}">
                <div class="cms-keyframe-header">
                    <div class="cms-keyframe-index">Keyframe #${globalIdx + 1}</div>
                    <div class="cms-keyframe-delete" data-global-idx="${globalIdx}" title="Delete Keyframe">&times;</div>
                </div>
                
                <!-- Scroll Trigger percentage -->
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                    <span style="color: var(--text-secondary);">Scroll Trigger (%):</span>
                    <input type="number" class="cms-input" id="field-cam-scroll-${globalIdx}" step="0.001" min="0" max="1" style="width: 100px; padding: 4px 8px;" value="${kf.scroll}">
                </div>

                <!-- Distance -->
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                    <span style="color: var(--text-secondary);">Distance (Radius):</span>
                    <input type="number" class="cms-input" id="field-cam-dist-${globalIdx}" step="0.01" style="width: 100px; padding: 4px 8px;" value="${kf.distance}">
                </div>

                <!-- Angle Y & Angle X -->
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                    <span style="color: var(--text-secondary);">Spherical Angles (Y, X):</span>
                    <div style="display: flex; gap: 4px;">
                        <input type="number" class="cms-input" id="field-cam-angy-${globalIdx}" step="0.001" style="width: 70px; padding: 4px 8px; font-family: monospace;" value="${kf.angleY}" title="Yaw (angleY)">
                        <input type="number" class="cms-input" id="field-cam-angx-${globalIdx}" step="0.001" style="width: 70px; padding: 4px 8px; font-family: monospace;" value="${kf.angleX}" title="Pitch (angleX)">
                    </div>
                </div>

                <!-- Target Coordinates LookAt (X, Y, Z) -->
                <div style="display: flex; flex-direction: column; gap: 3px;">
                    <span style="font-size: 10px; color: var(--text-secondary);">Target coordinates (LookAt X, Y, Z):</span>
                    <div class="cms-coords-row">
                        <div class="cms-coord-input-wrapper">
                            <span class="cms-coord-label">X</span>
                            <input type="number" class="cms-input" id="field-cam-target-x-${globalIdx}" step="0.001" style="padding: 4px 6px; font-family: monospace;" value="${kf.target?.x || 0}">
                        </div>
                        <div class="cms-coord-input-wrapper">
                            <span class="cms-coord-label">Y</span>
                            <input type="number" class="cms-input" id="field-cam-target-y-${globalIdx}" step="0.001" style="padding: 4px 6px; font-family: monospace;" value="${kf.target?.y || 0}">
                        </div>
                        <div class="cms-coord-input-wrapper">
                            <span class="cms-coord-label">Z</span>
                            <input type="number" class="cms-input" id="field-cam-target-z-${globalIdx}" step="0.001" style="padding: 4px 6px; font-family: monospace;" value="${kf.target?.z || 0}">
                        </div>
                    </div>
                </div>

                <!-- Easing Dropdown -->
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-top: 2px;">
                    <span style="color: var(--text-secondary);">Easing Transition:</span>
                    <select class="cms-input" id="field-cam-ease-${globalIdx}" style="width: 140px; padding: 4px 8px; background-color: var(--bg-input); border-color: var(--border-color); color: var(--text-primary); font-size: 11px;">
                        <option value="gentle" ${kf.ease === 'gentle' ? 'selected' : ''}>gentle (Smooth)</option>
                        <option value="hold" ${kf.ease === 'hold' ? 'selected' : ''}>hold (Lock camera)</option>
                        <option value="dramatic" ${kf.ease === 'dramatic' ? 'selected' : ''}>dramatic (Fast snap)</option>
                    </select>
                </div>
            </div>
        `;
    }

    /**
     * Render the camera timeline workspace
     */
    static render(
        stateManager: StateManager,
        containerEl: HTMLElement,
        timelineType: TimelineType,
        onUpdate: () => void,
        onShowToast: (message: string, type: 'success' | 'error' | 'info') => void
    ): void {
        const timelineKey = this.getTimelineKey(timelineType);
        const title = this.getTimelineTitle(timelineType);
        const desc = `Directly adjust spherical positioning angles, distances, easing transitions, and three-dimensional focal points (LookAt X, Y, Z) grouped by section viewports.`;

        const keyframes: Keyframe[] = stateManager.getCurrentCamera()[timelineKey] || [];
        const originalKeyframes: Keyframe[] = stateManager.getOriginalCamera()[timelineKey] || [];

        // Build sections timeline grouping S1 - S10
        let sectionsHtml = '';
        Object.keys(SECTION_LABELS).forEach(secId => {
            const secName = secId.toUpperCase();
            
            // Filter keyframes belonging to this section
            const secKeyframes = keyframes.filter(kf => kf.section === secName);
            
            let keyframesListHtml = '';
            
            if (secKeyframes.length === 0) {
                keyframesListHtml = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: var(--text-muted); font-size: 12px; font-family: var(--font-heading);">
                        No keyframe frames configured for this section. Click "+ Add Keyframe" to create one.
                    </div>
                `;
            } else {
                secKeyframes.forEach((kf) => {
                    // Search for index within the main timeline array to sync values back
                    const globalIdx = keyframes.indexOf(kf);
                    const originalKf = originalKeyframes[globalIdx] || {};
                    const isDirty = JSON.stringify(kf) !== JSON.stringify(originalKf);

                    keyframesListHtml += this.renderKeyframeCard(kf, globalIdx, isDirty);
                });
            }

            sectionsHtml += `
                <div class="cms-timeline-section-group">
                    <div class="cms-timeline-section-header">
                        <span>SECTION ${secName} // ${SECTION_LABELS[secId]}</span>
                        <button class="cms-timeline-section-header-btn" data-section-name="${secName}">+ Add Keyframe</button>
                    </div>
                    <div class="cms-timeline-grid">${keyframesListHtml}</div>
                </div>
            `;
        });

        containerEl.innerHTML = `
            <div class="cms-view-container">
                <div>${sectionsHtml}</div>
            </div>
        `;

        // Bind Action Listeners to Keyframe Cards
        keyframes.forEach((kf, globalIdx) => {
            const originalKf = originalKeyframes[globalIdx] || {};

            const scrollInput = document.getElementById(`field-cam-scroll-${globalIdx}`) as HTMLInputElement;
            const distInput = document.getElementById(`field-cam-dist-${globalIdx}`) as HTMLInputElement;
            const angyInput = document.getElementById(`field-cam-angy-${globalIdx}`) as HTMLInputElement;
            const angxInput = document.getElementById(`field-cam-angx-${globalIdx}`) as HTMLInputElement;
            const targetX = document.getElementById(`field-cam-target-x-${globalIdx}`) as HTMLInputElement;
            const targetY = document.getElementById(`field-cam-target-y-${globalIdx}`) as HTMLInputElement;
            const targetZ = document.getElementById(`field-cam-target-z-${globalIdx}`) as HTMLInputElement;
            const easeSelect = document.getElementById(`field-cam-ease-${globalIdx}`) as HTMLSelectElement;

            if (!scrollInput) return; // Guard against missing elements

            const updateKeyframeValues = () => {
                const scrollVal = parseFloat(scrollInput.value) || 0;
                const distVal = parseFloat(distInput.value) || 0;
                const angyVal = parseFloat(angyInput.value) || 0;
                const angxVal = parseFloat(angxInput.value) || 0;
                const xVal = parseFloat(targetX.value) || 0;
                const yVal = parseFloat(targetY.value) || 0;
                const zVal = parseFloat(targetZ.value) || 0;

                keyframes[globalIdx] = {
                    scroll: scrollVal,
                    distance: distVal,
                    angleY: angyVal,
                    angleX: angxVal,
                    target: { x: xVal, y: yVal, z: zVal },
                    ease: easeSelect.value,
                    section: kf.section
                };

                stateManager.getCurrentCamera()[timelineKey] = keyframes;
                onUpdate();

                // Check card dirty decoration
                const card = scrollInput.closest('.cms-keyframe-card')!;
                const isChanged = JSON.stringify(keyframes[globalIdx]) !== JSON.stringify(originalKf);
                card.classList.toggle('dirty', isChanged);
            };

            // Input triggers
            [scrollInput, distInput, angyInput, angxInput, targetX, targetY, targetZ].forEach(el => {
                if (el) el.addEventListener('input', updateKeyframeValues);
            });
            if (easeSelect) easeSelect.addEventListener('change', updateKeyframeValues);
        });

        // Bind Delete Keyframe Event (delegated)
        containerEl.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const deleteBtn = target.closest('.cms-keyframe-delete');
            if (deleteBtn) {
                const globalIdx = parseInt(deleteBtn.getAttribute('data-global-idx')!);
                
                if (confirm(`Are you sure you want to delete Keyframe #${globalIdx + 1}?`)) {
                    keyframes.splice(globalIdx, 1);
                    stateManager.getCurrentCamera()[timelineKey] = keyframes;
                    
                    onShowToast('Keyframe deleted from timeline', 'info');
                    onUpdate();
                    
                    // Re-render the workspace
                    this.render(stateManager, containerEl, timelineType, onUpdate, onShowToast);
                }
            }
        });

        // Bind Add Keyframe Event (delegated)
        containerEl.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const addBtn = target.closest('.cms-timeline-section-header-btn');
            if (addBtn) {
                const secName = addBtn.getAttribute('data-section-name')!;
                
                // Fetch last keyframe parameters of this section to copy, or fallback defaults
                const secKeyframes = keyframes.filter((kf: Keyframe) => kf.section === secName);
                let baseKf = secKeyframes[secKeyframes.length - 1];
                if (!baseKf) {
                    baseKf = keyframes[keyframes.length - 1] || { 
                        scroll: 0.5, 
                        distance: 5, 
                        angleY: 0, 
                        angleX: 0, 
                        target: { x: 0, y: 0, z: 0 }, 
                        ease: 'gentle',
                        section: secName
                    };
                }

                // Injects a default keyframe slightly offset in scroll percentage
                const newKf: Keyframe = {
                    scroll: Math.min(1.0, baseKf.scroll + 0.01),
                    distance: baseKf.distance,
                    angleY: baseKf.angleY,
                    angleX: baseKf.angleX,
                    target: {
                        x: baseKf.target?.x || 0,
                        y: baseKf.target?.y || 0,
                        z: baseKf.target?.z || 0
                    },
                    ease: baseKf.ease,
                    section: secName
                };

                keyframes.push(newKf);
                
                // Chronological Sorting: Automatically sort keyframes array by scroll value trigger!
                keyframes.sort((a: Keyframe, b: Keyframe) => a.scroll - b.scroll);
                
                stateManager.getCurrentCamera()[timelineKey] = keyframes;
                onShowToast(`New keyframe inserted in Section ${secName}`, 'success');
                onUpdate();
                
                // Re-render the workspace
                this.render(stateManager, containerEl, timelineType, onUpdate, onShowToast);
            }
        });
    }
}
