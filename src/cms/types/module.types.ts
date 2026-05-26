/* ==========================================================================
   MODULE INTERFACE - Base Interface for CMS Modules
   ========================================================================== */

import type { CMSController } from '../core/CMSController';
import type { CMSMode } from './common.types';

export interface ICMSModule {
    name: string;
    mode: CMSMode;
    
    // Lifecycle
    initialize(controller: CMSController): void;
    destroy(): void;
    
    // Workspace rendering
    renderWorkspace(navId: string): void;
    
    // State management
    hasChanges(): boolean;
    getChangesCount(): Record<string, number>;
}
