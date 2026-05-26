/* ==========================================================================
   CMS APPLICATION - Main Entry Point
   ========================================================================== */

import { CMSController } from './core/CMSController';
import { CopyEditorModule } from './modules/copy-editor';
import { Meshes3DModule } from './modules/meshes-3d';
import { CameraPathModule } from './modules/camera-path';
import { LiveVoiceModule } from './modules/live-voice';

/**
 * Initialize and bootstrap the CMS application
 */
async function initializeCMS(): Promise<void> {
    // Create the main controller
    const controller = new CMSController();

    // Register modules
    const copyEditorModule = new CopyEditorModule();
    copyEditorModule.initialize(controller);
    controller.registerModule('lang', copyEditorModule);

    const meshes3DModule = new Meshes3DModule();
    meshes3DModule.initialize(controller);
    controller.registerModule('3d', meshes3DModule);

    const cameraPathModule = new CameraPathModule();
    cameraPathModule.initialize(controller);
    controller.registerModule('camera', cameraPathModule);

    const liveVoiceModule = new LiveVoiceModule();
    liveVoiceModule.initialize(controller);
    controller.registerModule('voice', liveVoiceModule);

    // Initialize the CMS
    await controller.init();
}

// Bootstrap the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCMS);
} else {
    initializeCMS();
}

export { initializeCMS };
