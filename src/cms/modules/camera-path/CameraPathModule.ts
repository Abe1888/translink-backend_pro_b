/* ==========================================================================
   CAMERA PATH MODULE - Camera Timeline Management
   ========================================================================== */

import type { ICMSModule } from '../../types/module.types';
import type { CMSController } from '../../core/CMSController';
import type { TimelineType } from '../../types/camera.types';
import { TimelineRenderer } from './components/TimelineRenderer';
import { RawJSONEditor } from '../../shared/components/RawJSONEditor';

export class CameraPathModule implements ICMSModule {
    name = 'Camera Path';
    mode: 'lang' | '3d' | 'camera' | 'voice' = 'camera';

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
     * Get timeline type from navigation ID
     */
    private getTimelineType(navId: string): TimelineType {
        if (navId === 'camera-tablet') return 'tablet';
        if (navId === 'camera-mobile') return 'mobile';
        return 'desktop';
    }

    /**
     * Render the appropriate workspace based on navigation
     */
    renderWorkspace(navId: string): void {
        const mainContentEl = document.getElementById('cmsWorkspaceBody')!;
        if (!mainContentEl) {
            console.error('[CameraPathModule] cmsWorkspaceBody element not found');
            return;
        }

        const stateManager = this.controller.getStateManager();

        const onUpdate = () => {
            // Trigger changes count update in controller
            (this.controller as any).updateChangesCount?.();
        };

        // Handle raw JSON editor
        if (navId === 'raw-camera') {
            RawJSONEditor.render(
                stateManager,
                mainContentEl,
                'camera',
                'Raw Camera Scroll Keyframes JSON',
                'Inspect yaw, pitch, radius distance, lookAt coordinate vectors and easings transitions.',
                onUpdate
            );
            return;
        }

        // Handle timeline rendering
        const timelineType = this.getTimelineType(navId);

        const onShowToast = (message: string, type: 'success' | 'error' | 'info') => {
            // Trigger toast notification in controller
            (this.controller as any).showToast?.(message, type);
        };

        TimelineRenderer.render(
            stateManager,
            mainContentEl,
            timelineType,
            onUpdate,
            onShowToast
        );
    }

    /**
     * Check if module has unsaved changes
     */
    hasChanges(): boolean {
        const stateManager = this.controller.getStateManager();
        const counts = stateManager.calculateChangesCount();
        return counts.camera > 0;
    }

    /**
     * Get changes count for this module
     */
    getChangesCount(): Record<string, number> {
        const stateManager = this.controller.getStateManager();
        const counts = stateManager.calculateChangesCount();
        return {
            camera: counts.camera
        };
    }
}
