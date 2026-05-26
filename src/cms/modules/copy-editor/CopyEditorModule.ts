/* ==========================================================================
   COPY EDITOR MODULE - Language Content Management
   ========================================================================== */

import type { ICMSModule } from '../../types/module.types';
import type { CMSController } from '../../core/CMSController';
import { GlobalWorkspace } from './components/GlobalWorkspace';
import { SectionsWorkspace } from './components/SectionsWorkspace';
import { WaypointsWorkspace } from './components/WaypointsWorkspace';
import { RawJSONEditor } from '../../shared/components/RawJSONEditor';

export class CopyEditorModule implements ICMSModule {
    name = 'Copy Editor';
    mode: 'lang' | '3d' | 'camera' | 'voice' = 'lang';

    private controller!: CMSController;

    /**
     * Initialize the module
     */
    initialize(controller: CMSController): void {
        this.controller = controller;
    }

    /**
     * Cleanup and destroy the module
     */
    destroy(): void {
        // Cleanup if needed
    }

    /**
     * Render the appropriate workspace based on navigation
     */
    renderWorkspace(navId: string): void {
        const mainContentEl = document.getElementById('cmsWorkspaceBody')!;
        if (!mainContentEl) {
            console.error('[CopyEditorModule] cmsWorkspaceBody element not found');
            return;
        }

        const stateManager = this.controller.getStateManager();
        const navGroup = stateManager.getActiveNavGroup();

        const onUpdate = () => {
            // Trigger changes count update in controller
            (this.controller as any).updateChangesCount?.();
        };

        if (navGroup === 'global') {
            GlobalWorkspace.render(stateManager, mainContentEl, onUpdate);
        } else if (navGroup === 'sections') {
            SectionsWorkspace.render(stateManager, mainContentEl, onUpdate);
        } else if (navGroup === 'waypoints') {
            WaypointsWorkspace.render(stateManager, mainContentEl, onUpdate);
        } else if (navId === 'raw') {
            RawJSONEditor.render(
                stateManager,
                mainContentEl,
                'config',
                'Raw Translation Copy JSON',
                'Inspect copy text dictionary files directly.',
                onUpdate
            );
        }
    }

    /**
     * Check if module has unsaved changes
     */
    hasChanges(): boolean {
        const stateManager = this.controller.getStateManager();
        const counts = stateManager.calculateChangesCount();
        return counts.language > 0;
    }

    /**
     * Get changes count for this module
     */
    getChangesCount(): Record<string, number> {
        const stateManager = this.controller.getStateManager();
        const counts = stateManager.calculateChangesCount();
        return {
            language: counts.language
        };
    }
}
