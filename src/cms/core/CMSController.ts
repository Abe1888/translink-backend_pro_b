/* ==========================================================================
   CMS CONTROLLER - Main Orchestrator & Entry Point
   ========================================================================== */

import { StateManager } from './StateManager';
import { ConfigLoader } from './ConfigLoader';
import { APIClient } from './APIClient';
import { hideLoader } from '../shared/utils/dom.utils';
import { Dashboard, Sidebar, Header, ModeNav } from '../ui';
import type { CMSMode } from '../types';

export class CMSController {
    private stateManager: StateManager;
    private configLoader: ConfigLoader;
    private apiClient: APIClient;

    // Elements Cache
    private appEl!: HTMLElement;
    private saveBtn!: HTMLButtonElement;
    private discardBtn!: HTMLButtonElement;
    private exportBtn!: HTMLButtonElement;
    private dirtyBadge!: HTMLElement;
    private mainContentEl!: HTMLElement;

    // Module registry (to be populated in Phase 4)
    private modules: Map<string, any> = new Map();

    constructor() {
        this.stateManager = new StateManager();
        this.configLoader = new ConfigLoader(this.stateManager);
        this.apiClient = new APIClient(this.stateManager);
    }

    /**
     * Initialize the CMS
     */
    async init(): Promise<void> {
        this.appEl = document.getElementById('app')!;
        
        try {
            await this.configLoader.loadAllConfigs();
            hideLoader();
            this.renderDashboard();
            this.showToast('CMS multi-database engine active', 'success');
        } catch (error: any) {
            console.error('[CMS] Initialization failed:', error);
            this.showToast(`Failed to load databases: ${error.message}`, 'error');
            this.appEl.innerHTML = `
                <div class="cms-loading-wrapper">
                    <div class="cms-loader-text" style="color: #ef4444; text-shadow: 0 0 10px rgba(239, 68, 68, 0.4);">
                        DATABASE RETRIEVAL FAILED
                    </div>
                    <div style="color: var(--text-secondary); margin-top: 10px; font-size: 13px; font-family: monospace;">
                        ${error.message || 'Check local Vite server or file system paths.'}
                    </div>
                    <button class="cms-btn cms-btn-primary" style="margin-top: 20px;" onclick="window.location.reload()">
                        Retry Engine Initialize
                    </button>
                </div>
            `;
        }
    }

    /**
     * Render the main dashboard structure
     */
    private renderDashboard(): void {
        // Render dashboard HTML
        this.appEl.innerHTML = Dashboard.render();

        // Cache Elements
        this.saveBtn = document.getElementById('cmsSaveBtn') as HTMLButtonElement;
        this.discardBtn = document.getElementById('cmsDiscardBtn') as HTMLButtonElement;
        this.exportBtn = document.getElementById('cmsExportBtn') as HTMLButtonElement;
        this.dirtyBadge = document.getElementById('cmsDirtyBadge')!;
        this.mainContentEl = document.getElementById('cmsWorkspaceBody')!;

        // Setup event listeners
        this.setupEventListeners();

        // Render initial UI state
        Sidebar.renderNav(this.stateManager.getActiveMode(), this.stateManager.getActiveNavId());
        Sidebar.renderActiveLanguagesList(
            this.stateManager.getCurrentConfig().languages,
            (langCode, enabled) => this.handleLanguageToggle(langCode, enabled)
        );
        Header.update(this.stateManager.getActiveMode());
        this.renderActiveWorkspace();
        this.updateChangesCount();
    }

    /**
     * Register a module
     */
    registerModule(mode: CMSMode, module: any): void {
        this.modules.set(mode, module);
    }

    /**
     * Get a registered module
     */
    getModule(mode: CMSMode): any {
        return this.modules.get(mode);
    }

    /**
     * Get state manager instance
     */
    getStateManager(): StateManager {
        return this.stateManager;
    }

    /**
     * Get API client instance
     */
    getAPIClient(): APIClient {
        return this.apiClient;
    }

    /**
     * Save all changes
     */
    async saveChanges(): Promise<void> {
        if (!this.saveBtn) return;

        this.saveBtn.disabled = true;
        this.saveBtn.textContent = 'Saving...';

        try {
            const counts = this.stateManager.calculateChangesCount();
            await this.apiClient.saveAllChanges(counts);
            
            this.showToast('Config files successfully saved and backed up on disk', 'success');
            this.updateChangesCount();
            this.renderActiveWorkspace();
        } catch (error: any) {
            console.error('[CMS] Multi-Save failed:', error);
            this.showToast(`Disk write failed: ${error.message || 'Internal connection error'}`, 'error');
        } finally {
            this.saveBtn.textContent = 'Save Changes';
            this.updateChangesCount();
        }
    }

    /**
     * Discard all changes
     */
    discardChanges(): void {
        if (!confirm('Discard all unsaved changes? This action cannot be undone.')) {
            return;
        }

        this.stateManager.discardAllChanges();
        this.updateChangesCount();
        this.renderActiveWorkspace();
        this.showToast('All changes discarded', 'info');
    }

    /**
     * Export configuration as JSON
     */
    exportConfig(): void {
        const mode = this.stateManager.getActiveMode();
        let data: any;
        let filename: string;

        switch (mode) {
            case 'lang':
                data = this.stateManager.getCurrentConfig();
                filename = 'language_config.json';
                break;
            case '3d':
                const navId = this.stateManager.getActiveNavId();
                if (navId.includes('material')) {
                    data = this.stateManager.getCurrentMeshMaterial();
                    filename = 'mesh_material_config.json';
                } else {
                    data = this.stateManager.getCurrentMeshBehavior();
                    filename = 'mesh_behavior_config.json';
                }
                break;
            case 'camera':
                data = this.stateManager.getCurrentCamera();
                filename = 'camera_config.json';
                break;
            case 'voice':
                const voiceNavId = this.stateManager.getActiveNavId();
                if (voiceNavId === 'knowledge-md') {
                    data = this.stateManager.getCurrentKnowledgeMd();
                    filename = 'knowledge.md';
                } else if (voiceNavId === 'knowledge-config') {
                    data = this.stateManager.getCurrentKnowledge();
                    filename = 'knowledge_config.json';
                } else {
                    data = this.stateManager.getCurrentVoice();
                    filename = 'voice_config.json';
                }
                break;
        }

        const blob = new Blob(
            [typeof data === 'string' ? data : JSON.stringify(data, null, 2)],
            { type: typeof data === 'string' ? 'text/plain' : 'application/json' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast(`Exported ${filename}`, 'success');
    }

    /**
     * Update changes count badge
     */
    public updateChangesCount(): void {
        if (!this.dirtyBadge) return;

        const totalChanges = this.stateManager.getTotalChangesCount();
        
        if (totalChanges > 0) {
            this.dirtyBadge.textContent = String(totalChanges);
            this.dirtyBadge.style.display = 'flex';
            this.saveBtn.disabled = false;
            this.discardBtn.disabled = false;
        } else {
            this.dirtyBadge.style.display = 'none';
            this.saveBtn.disabled = true;
            this.discardBtn.disabled = true;
        }
    }

    /**
     * Render active workspace
     * Delegates to the appropriate module based on active mode
     */
    private renderActiveWorkspace(): void {
        const mode = this.stateManager.getActiveMode();
        const navId = this.stateManager.getActiveNavId();
        const module = this.modules.get(mode);

        if (module) {
            module.renderWorkspace(navId);
        } else {
            console.warn(`[CMSController] No module registered for mode: ${mode}`);
        }
    }

    /**
     * Setup all event listeners
     */
    private setupEventListeners(): void {
        // Toggle Sidebar Drawer on mobile
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            document.getElementById('cmsSidebar')?.classList.toggle('active');
        });

        // Close sidebar drawer if clicking outside
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const sidebar = document.getElementById('cmsSidebar');
            const toggle = document.getElementById('sidebarToggle');
            if (sidebar?.classList.contains('active') && !sidebar.contains(target) && !toggle?.contains(target)) {
                sidebar.classList.remove('active');
            }
        });

        // Mode switching
        ModeNav.setupEventListeners((mode) => this.handleModeChange(mode));

        // Save, Discard, Export actions
        this.saveBtn.addEventListener('click', () => this.saveChanges());
        this.discardBtn.addEventListener('click', () => this.discardChanges());
        this.exportBtn.addEventListener('click', () => this.exportConfig());

        // Sidebar navigation routing
        this.appEl.addEventListener('click', (e) => {
            const navItem = (e.target as HTMLElement).closest('.cms-nav-item');
            if (navItem) {
                document.querySelectorAll('.cms-nav-item').forEach(el => el.classList.remove('active'));
                navItem.classList.add('active');
                
                const group = navItem.getAttribute('data-group')!;
                const id = navItem.getAttribute('data-id')!;
                
                this.stateManager.setActiveNavGroup(group);
                this.stateManager.setActiveNavId(id);
                
                // Close mobile sidebar drawer
                document.getElementById('cmsSidebar')?.classList.remove('active');
                
                this.renderActiveWorkspace();
            }
        });
    }

    /**
     * Handle mode change
     */
    private handleModeChange(mode: CMSMode): void {
        this.stateManager.setActiveMode(mode);

        // Update UI
        ModeNav.setActiveMode(mode);
        Header.update(mode);
        Header.toggleLanguageControls(mode === 'lang');

        // Set default navigation for each mode
        switch (mode) {
            case 'lang':
                this.stateManager.setActiveNavGroup('global');
                this.stateManager.setActiveNavId('global');
                break;
            case '3d':
                this.stateManager.setActiveNavGroup('behavior-defaults');
                this.stateManager.setActiveNavId('behavior-defaults');
                break;
            case 'camera':
                this.stateManager.setActiveNavGroup('camera-desktop');
                this.stateManager.setActiveNavId('camera-desktop');
                break;
            case 'voice':
                this.stateManager.setActiveNavGroup('voice-settings');
                this.stateManager.setActiveNavId('voice-settings');
                break;
        }

        // Re-render sidebar and workspace
        Sidebar.renderNav(mode, this.stateManager.getActiveNavId());
        if (mode === 'lang') {
            Sidebar.renderActiveLanguagesList(
                this.stateManager.getCurrentConfig().languages,
                (langCode, enabled) => this.handleLanguageToggle(langCode, enabled)
            );
        }
        this.renderActiveWorkspace();
        this.updateChangesCount();
    }

    /**
     * Handle language toggle
     */
    private handleLanguageToggle(langCode: string, enabled: boolean): void {
        const config = this.stateManager.getCurrentConfig();
        config.languages[langCode] = enabled ? 1 : 0;
        this.stateManager.setCurrentConfig(config);
        this.updateChangesCount();
    }

    /**
     * Show toast notification
     */
    private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        const toastContainer = document.getElementById('cmsToastContainer') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `cms-toast cms-toast-${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Create toast container if it doesn't exist
     */
    private createToastContainer(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'cmsToastContainer';
        container.className = 'cms-toast-container';
        document.body.appendChild(container);
        return container;
    }
}
