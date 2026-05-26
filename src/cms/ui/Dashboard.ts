/* ==========================================================================
   DASHBOARD - Main Dashboard Shell Structure
   ========================================================================== */

export class Dashboard {
    /**
     * Render the main dashboard HTML structure
     */
    static render(): string {
        return `
            <div class="cms-dashboard">
                <!-- ═══ SIDEBAR — Pure Navigation ═══ -->
                <aside class="cms-sidebar" id="cmsSidebar">

                    <!-- Brand -->
                    <div class="cms-brand">
                        <div class="cms-brand-logo">T</div>
                        <div>
                            <div class="cms-brand-name">TRANSLINK</div>
                            <div class="cms-brand-sub">CMS Studio</div>
                        </div>
                    </div>

                    <!-- Active Languages (Copy Editor mode only) -->
                    <div class="cms-lang-toggles" id="sidebarLangToggles">
                        <div class="cms-section-label">Active Languages</div>
                        <div id="activeLangsList"></div>
                    </div>

                    <!-- Navigation -->
                    <nav class="cms-nav" id="cmsSidebarNav"></nav>

                    <!-- Footer -->
                    <div class="cms-sidebar-footer">
                        <span class="cms-footer-text">Translink CMS v1.2.0</span>
                    </div>
                </aside>

                <!-- ═══ MAIN CONTENT ═══ -->
                <main class="cms-main-content">

                    <!-- Top Header Bar: Logo area + Actions -->
                    <header class="cms-header">
                        <div class="cms-header-left">
                            <button class="cms-menu-toggle" id="sidebarToggle" aria-label="Toggle Menu">
                                <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
                                    <rect width="15" height="1.5" rx="0.75" fill="currentColor"/>
                                    <rect y="5.25" width="11" height="1.5" rx="0.75" fill="currentColor"/>
                                    <rect y="10.5" width="15" height="1.5" rx="0.75" fill="currentColor"/>
                                </svg>
                            </button>
                            <div class="cms-header-title-block">
                                <h1 class="cms-header-title" id="cmsHeaderTitle">Language Config Editor</h1>
                                <p class="cms-header-subtitle" id="cmsHeaderSubtitle">Direct, visual editing of website localization copy</p>
                            </div>
                        </div>

                        <div class="cms-header-actions">
                            <div class="cms-dirty-badge" id="cmsDirtyBadge" style="display: none;">
                                <div class="cms-dirty-dot"></div>
                                <span id="dirtyCountText">0 changes</span>
                            </div>
                            <button class="cms-btn cms-btn-ghost" id="cmsExportBtn">Export JSON</button>
                            <button class="cms-btn cms-btn-outline" id="cmsDiscardBtn" disabled>Discard</button>
                            <button class="cms-btn cms-btn-primary" id="cmsSaveBtn" disabled>Save Changes</button>
                        </div>
                    </header>

                    <!-- Mode Navigation Row (below header) -->
                    <div class="cms-mode-nav" id="cmsModeNav">
                        <button class="cms-mode-tab active" id="modeBtnLang" data-mode="lang">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                            Copy Editor
                        </button>
                        <button class="cms-mode-tab" id="modeBtn3d" data-mode="3d">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                            </svg>
                            3D Meshes
                        </button>
                        <button class="cms-mode-tab" id="modeBtnCamera" data-mode="camera">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M20.188 10.934l-1.688.507A7 7 0 0016.5 8l.507-1.688A2 2 0 0015.095 4.4l-1.503.901A7 7 0 0012 5a7 7 0 00-1.592.3L8.905 4.4A2 2 0 007 6.312L7.507 8A7 7 0 005.5 11.066L3.812 10.56A2 2 0 002 12.5v.014a2 2 0 001.811 1.992l1.7.255A7 7 0 007.5 16l-.507 1.688A2 2 0 008.905 19.6l1.503-.9A7 7 0 0012 19a7 7 0 001.592-.3l1.503.9a2 2 0 001.906-1.912L16.5 16a7 7 0 002-2.261l1.7-.255A2 2 0 0022 11.514V11.5a2 2 0 00-1.812-1.566z"/>
                            </svg>
                            Camera Path
                        </button>
                        <button class="cms-mode-tab" id="modeBtnVoice" data-mode="voice">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
                            </svg>
                            Live Voice
                        </button>
                    </div>

                    <!-- Inner Workspace body -->
                    <div class="cms-workspace-body" id="cmsWorkspaceBody"></div>
                </main>
            </div>
            <div class="cms-toast-container" id="cmsToastContainer"></div>
        `;
    }
}
