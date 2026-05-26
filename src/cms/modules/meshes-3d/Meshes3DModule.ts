/* ==========================================================================
   MESHES 3D MODULE - 3D Mesh Behavior & Material Management
   ========================================================================== */

import type { ICMSModule } from '../../types/module.types';
import type { CMSController } from '../../core/CMSController';
import { BehaviorDefaults } from './components/BehaviorDefaults';
import { MeshMaterials } from './components/MeshMaterials';
import { RawJSONEditor } from '../../shared/components/RawJSONEditor';

export class Meshes3DModule implements ICMSModule {
    name = '3D Meshes';
    mode: 'lang' | '3d' | 'camera' | 'voice' = '3d';

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
            console.error('[Meshes3DModule] cmsWorkspaceBody element not found');
            return;
        }

        const stateManager = this.controller.getStateManager();

        const onUpdate = () => {
            // Trigger changes count update in controller
            (this.controller as any).updateChangesCount?.();
        };

        if (navId === 'behavior-defaults') {
            BehaviorDefaults.render(stateManager, mainContentEl, onUpdate);
        } else if (navId === 'mesh-materials') {
            MeshMaterials.render(stateManager, mainContentEl, onUpdate);
        } else if (navId === 'raw-behavior') {
            RawJSONEditor.render(
                stateManager,
                mainContentEl,
                'meshBehavior',
                'Raw Mesh Behaviors JSON',
                'Direct overrides code configurations for shadows and visibilities.',
                onUpdate
            );
        } else if (navId === 'raw-material') {
            RawJSONEditor.render(
                stateManager,
                mainContentEl,
                'meshMaterial',
                'Raw Mesh Materials PBR JSON',
                'Metallic, roughness, envMap reflection parameters and self-glow hex colors configurations.',
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
        return counts.behavior > 0 || counts.material > 0;
    }

    /**
     * Get changes count for this module
     */
    getChangesCount(): Record<string, number> {
        const stateManager = this.controller.getStateManager();
        const counts = stateManager.calculateChangesCount();
        return {
            behavior: counts.behavior,
            material: counts.material
        };
    }
}
