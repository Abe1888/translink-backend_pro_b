/* ==========================================================================
   SIDEBAR - Navigation Sidebar Component
   ========================================================================== */

import type { CMSMode } from '../types';
import { SECTION_LABELS, WAYPOINT_LABELS } from '../shared/constants';

export class Sidebar {
    /**
     * Render sidebar navigation based on active mode
     */
    static renderNav(activeMode: CMSMode, activeNavId: string): string {
        const navContainer = document.getElementById('cmsSidebarNav');
        if (!navContainer) return '';

        let html = '';

        if (activeMode === 'lang') {
            html = `
                <div class="cms-nav-group">
                    <div class="cms-section-label">Overview</div>
                    <div class="cms-nav-item ${activeNavId === 'global' ? 'active' : ''}" data-group="global" data-id="global">
                        <div class="cms-nav-item-inner">
                            <span class="cms-nav-item-title">Global Layout Copy</span>
                        </div>
                        <span class="cms-nav-item-count" id="count-global">0</span>
                    </div>
                </div>

                <div class="cms-nav-group">
                    <div class="cms-section-label">Sections (S1 – S10)</div>
                    <div id="sidebarSectionsList"></div>
                </div>

                <div class="cms-nav-group">
                    <div class="cms-section-label">Waypoints</div>
                    <div id="sidebarWaypointsList"></div>
                </div>

                <div class="cms-nav-group">
                    <div class="cms-section-label">Advanced</div>
                    <div class="cms-nav-item ${activeNavId === 'raw' ? 'active' : ''}" data-group="raw" data-id="raw">
                        <div class="cms-nav-item-inner">
                            <span class="cms-nav-item-title">Raw JSON Editor</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (activeMode === '3d') {
            html = `
                <div class="cms-nav-group">
                    <div class="cms-section-label">Meshes & Materials</div>
                    <div class="cms-nav-item ${activeNavId === 'behavior-defaults' ? 'active' : ''}" data-group="behavior-defaults" data-id="behavior-defaults">
                        <div class="cms-nav-item-inner">
                            <span class="cms-nav-item-title">Global Defaults</span>
                        </div>
                        <span class="cms-nav-item-count" id="count-3d-beh-def">0</span>
                    </div>
                    <div class="cms-nav-item ${activeNavId === 'mesh-materials' ? 'active' : ''}" data-group="mesh-materials" data-id="mesh-materials">
                        <div class="cms-nav-item-inner">
                            <span class="cms-nav-item-title">Overrides & Aesthetics</span>
                        </div>
                        <span class="cms-nav-item-count" id="count-3d-mesh-mat">0</span>
                    </div>
                </div>

                <div class="cms-nav-group">
                    <div class="cms-section-label">Advanced</div>
                    <div class="cms-nav-item ${activeNavId === 'raw-behavior' ? 'active' : ''}" data-group="raw-behavior" data-id="raw-behavior">
                        <div class="cms-nav-item-inner">
                            <span class="cms-nav-item-title">Raw Behavior JSON</span>
                        </div>
                    </div>
                    <div class="cms-nav-item ${activeNavId === 'raw-material' ? 'active' : ''}" data-group="raw-material" data-id="raw-material">
                        <div class="cms-nav-item-inner">
                            <span class="cms-nav-item-title">Raw Material JSON</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (activeMode === 'camera') {
            html = `
                <div class="cms-nav-group">
                    <div class="cms-section-label">Camera Timelines</div>
                    <div class="cms-nav-item ${activeNavId === 'camera-desktop' ? 'active' : ''}" data-group="camera-desktop" data-id="camera-desktop">
                        <div class="cms-nav-item-inner">
                            <span class="cms-nav-item-title">Desktop</span>
                            <span class="cms-nav-item-sub">16:9+ widescreen</span>
                        </div>
                        <span class="cms-nav-item-count" id="count-cam-desk">0</span>
                    </div>
                    <div class="cms-nav-item ${activeNavId === 'camera-tablet' ? 'active' : ''}" data-group="camera-tablet" data-id="camera-tablet">
                        <div class="cms-nav-item-inner">
                            <span class="cms-nav-item-title">Tablet</span>
                            <span class="cms-nav-item-sub">4:3 landscape</span>
                        </div>
                        <span class="cms-nav-item-count" id="count-cam-tab">0</span>
                    </div>
                    <div class="cms-nav-item ${activeNavId === 'camera-mobile' ? 'active' : ''}" data-group="camera-mobile" data-id="camera-mobile">
                        <div class="cms-nav-item-inner">
                            <span class="cms-nav-item-title">Mobile</span>
                            <span class="cms-nav-item-sub">Portrait</span>
                        </div>
                        <span class="cms-nav-item-count" id="count-cam-mob">0</span>
                    </div>
                </div>

                <div class="cms-nav-group">
                    <div class="cms-section-label">Advanced</div>
                    <div class="cms-nav-item ${activeNavId === 'raw-camera' ? 'active' : ''}" data-group="raw-camera" data-id="raw-camera">
                        <div class="cms-nav-item-inner">
                            <span class="cms-nav-item-title">Raw Camera JSON</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            html = `
                <div class="cms-nav-group">
                    <div class="cms-section-label">Voice & Speech</div>
                    <div class="cms-nav-item ${activeNavId === 'voice-settings' ? 'active' : ''}" data-group="voice-settings" data-id="voice-settings">
                        <div class="cms-nav-item-inner">
                            <span class="cms-nav-item-title">Voice Settings</span>
                        </div>
                        <span class="cms-nav-item-count" id="count-voice-sett">0</span>
                    </div>
                </div>

                <div class="cms-nav-group">
                    <div class="cms-section-label">RAG Knowledge</div>
                    <div class="cms-nav-item ${activeNavId === 'knowledge-config' ? 'active' : ''}" data-group="knowledge-config" data-id="knowledge-config">
                        <div class="cms-nav-item-inner">
                            <span class="cms-nav-item-title">Knowledge Config</span>
                            <span class="cms-nav-item-sub">Crawl, vector, memory</span>
                        </div>
                        <span class="cms-nav-item-count" id="count-voice-kn-conf">0</span>
                    </div>
                    <div class="cms-nav-item ${activeNavId === 'knowledge-md' ? 'active' : ''}" data-group="knowledge-md" data-id="knowledge-md">
                        <div class="cms-nav-item-inner">
                            <span class="cms-nav-item-title">AI Knowledge Manual</span>
                            <span class="cms-nav-item-sub">Markdown RAG source</span>
                        </div>
                        <span class="cms-nav-item-count" id="count-voice-kn-md">0</span>
                    </div>
                </div>

                <div class="cms-nav-group">
                    <div class="cms-section-label">Advanced</div>
                    <div class="cms-nav-item ${activeNavId === 'raw-voice' ? 'active' : ''}" data-group="raw-voice" data-id="raw-voice">
                        <div class="cms-nav-item-inner">
                            <span class="cms-nav-item-title">Raw Voice JSON</span>
                        </div>
                    </div>
                    <div class="cms-nav-item ${activeNavId === 'raw-knowledge' ? 'active' : ''}" data-group="raw-knowledge" data-id="raw-knowledge">
                        <div class="cms-nav-item-inner">
                            <span class="cms-nav-item-title">Raw Knowledge JSON</span>
                        </div>
                    </div>
                </div>
            `;
        }

        navContainer.innerHTML = html;

        // Render sections and waypoints if in lang mode
        if (activeMode === 'lang') {
            Sidebar.renderSidebarItems(activeNavId);
        }

        return html;
    }

    /**
     * Render sections and waypoints lists for language mode
     */
    static renderSidebarItems(activeNavId: string): void {
        const sectionsContainer = document.getElementById('sidebarSectionsList');
        const waypointsContainer = document.getElementById('sidebarWaypointsList');

        if (!sectionsContainer || !waypointsContainer) return;

        // Sections S1 – S10
        sectionsContainer.innerHTML = Object.entries(SECTION_LABELS).map(([id, label]) => `
            <div class="cms-nav-item ${activeNavId === id ? 'active' : ''}" data-group="sections" data-id="${id}">
                <div class="cms-nav-item-inner">
                    <span class="cms-nav-item-title">${label}</span>
                </div>
                <span class="cms-nav-item-count" id="count-sec-${id}">0</span>
            </div>
        `).join('');

        // Waypoints
        waypointsContainer.innerHTML = Object.entries(WAYPOINT_LABELS).map(([id, label]) => `
            <div class="cms-nav-item ${activeNavId === id ? 'active' : ''}" data-group="waypoints" data-id="${id}">
                <div class="cms-nav-item-inner">
                    <span class="cms-nav-item-title">${label}</span>
                </div>
                <span class="cms-nav-item-count" id="count-way-${id}">0</span>
            </div>
        `).join('');
    }

    /**
     * Render active languages list with toggle switches
     */
    static renderActiveLanguagesList(languages: Record<string, number>, onToggle: (langCode: string, enabled: boolean) => void): void {
        const container = document.getElementById('activeLangsList');
        if (!container) return;

        const langNames: Record<string, string> = {
            'EN': 'English',
            'AM': 'Amharic',
            'AR': 'Arabic'
        };

        container.innerHTML = Object.keys(languages).map(langCode => {
            const isChecked = languages[langCode] === 1;
            return `
                <div class="cms-lang-switch-item">
                    <span>${langCode} (${langNames[langCode] || langCode})</span>
                    <label class="cms-switch">
                        <input type="checkbox" id="lang-switch-${langCode}" ${isChecked ? 'checked' : ''}>
                        <span class="cms-slider"></span>
                    </label>
                </div>
            `;
        }).join('');

        // Attach event listeners
        Object.keys(languages).forEach(langCode => {
            const input = document.getElementById(`lang-switch-${langCode}`) as HTMLInputElement;
            if (input) {
                input.addEventListener('change', () => {
                    onToggle(langCode, input.checked);
                });
            }
        });
    }
}
