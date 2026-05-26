/* ==========================================================================
   HEADER - Top Header Bar Component
   ========================================================================== */

import type { CMSMode } from '../types';

export class Header {
    /**
     * Update header title and subtitle based on active mode
     */
    static update(mode: CMSMode): void {
        const titleEl = document.getElementById('cmsHeaderTitle');
        const subtitleEl = document.getElementById('cmsHeaderSubtitle');

        if (!titleEl || !subtitleEl) return;

        switch (mode) {
            case 'lang':
                titleEl.textContent = 'Language Config Editor';
                subtitleEl.textContent = 'Direct, visual editing of website localization copy';
                break;
            case '3d':
                titleEl.textContent = '3D Canvas Mesh Editor';
                subtitleEl.textContent = 'Interactive editing of mesh default behaviors and material aesthetics';
                break;
            case 'camera':
                titleEl.textContent = 'Camera Animation Path Editor';
                subtitleEl.textContent = 'Tune scroll-driven PBR camera framing keyframes and lookAt focus coordinates';
                break;
            case 'voice':
                titleEl.textContent = 'Gemini Live Voice & RAG Configs';
                subtitleEl.textContent = 'Tune active voice speakers, sync domain frequencies, memory retention, and assistant knowledge RAG manual';
                break;
        }
    }

    /**
     * Show/hide language controls based on mode
     */
    static toggleLanguageControls(show: boolean): void {
        const langToggles = document.getElementById('sidebarLangToggles');
        const langTabsSep = document.getElementById('langTabsSep');
        const langTabsSm = document.querySelectorAll('.cms-lang-tab-sm');

        if (langToggles) {
            langToggles.style.display = show ? 'block' : 'none';
        }

        if (langTabsSep) {
            (langTabsSep as HTMLElement).style.display = show ? 'block' : 'none';
        }

        langTabsSm.forEach(tab => {
            (tab as HTMLElement).style.display = show ? 'flex' : 'none';
        });
    }
}
