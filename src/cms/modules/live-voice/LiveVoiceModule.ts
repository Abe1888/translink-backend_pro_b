/* ==========================================================================
   LIVE VOICE MODULE - Voice & RAG Knowledge Management
   ========================================================================== */

import type { ICMSModule } from '../../types/module.types';
import type { CMSController } from '../../core/CMSController';
import { VoiceSettings } from './components/VoiceSettings';
import { KnowledgeConfig } from './components/KnowledgeConfig';
import { MarkdownEditor } from './components/MarkdownEditor';
import { RawJSONEditor } from '../../shared/components/RawJSONEditor';

export class LiveVoiceModule implements ICMSModule {
    name = 'Live Voice';
    mode: 'lang' | '3d' | 'camera' | 'voice' = 'voice';

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
            console.error('[LiveVoiceModule] cmsWorkspaceBody element not found');
            return;
        }

        const stateManager = this.controller.getStateManager();

        const onUpdate = () => {
            // Trigger changes count update in controller
            (this.controller as any).updateChangesCount?.();
        };

        if (navId === 'voice-settings') {
            VoiceSettings.render(stateManager, mainContentEl, onUpdate);
        } else if (navId === 'knowledge-config') {
            KnowledgeConfig.render(stateManager, mainContentEl, onUpdate);
        } else if (navId === 'knowledge-md') {
            MarkdownEditor.render(stateManager, mainContentEl, onUpdate);
        } else if (navId === 'raw-voice') {
            RawJSONEditor.render(
                stateManager,
                mainContentEl,
                'voice',
                'Raw Gemini Voice Config JSON',
                'Direct speaker active selection and metadata details.',
                onUpdate
            );
        } else if (navId === 'raw-knowledge') {
            RawJSONEditor.render(
                stateManager,
                mainContentEl,
                'knowledge',
                'Raw RAG Knowledge Config JSON',
                'Crawl intervals, vector rules, tags, and memory settings.',
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
        return counts.voice > 0 || counts.knowledge > 0 || counts.knowledgeMd > 0;
    }

    /**
     * Get changes count for this module
     */
    getChangesCount(): Record<string, number> {
        const stateManager = this.controller.getStateManager();
        const counts = stateManager.calculateChangesCount();
        return {
            voice: counts.voice,
            knowledge: counts.knowledge,
            knowledgeMd: counts.knowledgeMd
        };
    }
}
