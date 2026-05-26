/* ==========================================================================
   MODE NAV - Mode Switching Tabs Component
   ========================================================================== */

import type { CMSMode } from '../types';

export class ModeNav {
    /**
     * Set active mode tab
     */
    static setActiveMode(mode: CMSMode): void {
        const modeBtnLang = document.getElementById('modeBtnLang');
        const modeBtn3d = document.getElementById('modeBtn3d');
        const modeBtnCamera = document.getElementById('modeBtnCamera');
        const modeBtnVoice = document.getElementById('modeBtnVoice');

        // Remove active class from all tabs
        [modeBtnLang, modeBtn3d, modeBtnCamera, modeBtnVoice].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });

        // Add active class to selected tab
        switch (mode) {
            case 'lang':
                modeBtnLang?.classList.add('active');
                break;
            case '3d':
                modeBtn3d?.classList.add('active');
                break;
            case 'camera':
                modeBtnCamera?.classList.add('active');
                break;
            case 'voice':
                modeBtnVoice?.classList.add('active');
                break;
        }
    }

    /**
     * Setup mode switching event listeners
     */
    static setupEventListeners(onModeChange: (mode: CMSMode) => void): void {
        const modeBtnLang = document.getElementById('modeBtnLang');
        const modeBtn3d = document.getElementById('modeBtn3d');
        const modeBtnCamera = document.getElementById('modeBtnCamera');
        const modeBtnVoice = document.getElementById('modeBtnVoice');

        modeBtnLang?.addEventListener('click', () => onModeChange('lang'));
        modeBtn3d?.addEventListener('click', () => onModeChange('3d'));
        modeBtnCamera?.addEventListener('click', () => onModeChange('camera'));
        modeBtnVoice?.addEventListener('click', () => onModeChange('voice'));
    }
}
