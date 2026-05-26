/* ==========================================================================
   VOICE SETTINGS COMPONENT - Voice Speaker Selection
   ========================================================================== */

import type { StateManager } from '../../../core/StateManager';

export class VoiceSettings {
    /**
     * Render the voice settings workspace
     */
    static render(
        stateManager: StateManager,
        containerEl: HTMLElement,
        onUpdate: () => void
    ): void {
        const currentVoice = stateManager.getCurrentVoice();
        const originalVoice = stateManager.getOriginalVoice();
        
        const voiceMetadata = currentVoice.voiceMetadata || {};
        const languages = ['en', 'am', 'ar'];

        let sectionsHtml = '';

        languages.forEach(lang => {
            const langName = lang === 'en' ? 'English' : lang === 'am' ? 'Amharic' : 'Arabic';
            const activeVoice = currentVoice[lang]?.activeVoice || '';
            const originalVoiceVal = originalVoice[lang]?.activeVoice || '';
            const isDirty = activeVoice !== originalVoiceVal;

            let voicesGridHtml = '';
            Object.keys(voiceMetadata).forEach(voiceName => {
                const meta = voiceMetadata[voiceName];
                const isActive = voiceName === activeVoice;
                const genderClass = meta.gender === 'Woman' ? 'female' : 'male';
                
                voicesGridHtml += `
                    <div class="cms-voice-chip ${isActive ? 'active' : ''}" data-lang="${lang}" data-voice="${voiceName}">
                        <div class="cms-voice-chip-header">
                            <span class="cms-voice-name">${voiceName}</span>
                            <span class="cms-gender-badge ${genderClass}">${meta.gender}</span>
                        </div>
                        <p class="cms-voice-tone">${meta.tone}</p>
                        <div class="cms-voice-wave-container">
                            <span class="cms-voice-status-text">${isActive ? 'Active Speaker' : 'Standby'}</span>
                            <div class="cms-voice-wave-bars">
                                <div class="cms-voice-wave-bar"></div>
                                <div class="cms-voice-wave-bar"></div>
                                <div class="cms-voice-wave-bar"></div>
                                <div class="cms-voice-wave-bar"></div>
                                <div class="cms-voice-wave-bar"></div>
                            </div>
                        </div>
                    </div>
                `;
            });

            sectionsHtml += `
                <div class="cms-voice-lang-group ${isDirty ? 'dirty' : ''}">
                    <div class="cms-voice-lang-header">
                        <span>${langName} AI Voice Assistant</span>
                        ${isDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                    </div>
                    <div class="cms-voice-chips-grid">${voicesGridHtml}</div>
                </div>
            `;
        });

        containerEl.innerHTML = `
            <div class="cms-view-container">
                <div style="display: flex; flex-direction: column; gap: 30px;">
                    ${sectionsHtml}
                </div>
            </div>
        `;

        // Bind click events on chips
        containerEl.querySelectorAll('.cms-voice-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const lang = chip.getAttribute('data-lang')!;
                const voiceName = chip.getAttribute('data-voice')!;

                // Update state
                currentVoice[lang].activeVoice = voiceName;
                Object.keys(currentVoice[lang].voices).forEach(k => {
                    currentVoice[lang].voices[k] = k === voiceName ? 1 : 0;
                });

                onUpdate();
                
                // Re-render to update UI
                this.render(stateManager, containerEl, onUpdate);
            });
        });
    }
}
