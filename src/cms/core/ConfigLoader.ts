/* ==========================================================================
   CONFIG LOADER - Parallel Configuration Loading
   ========================================================================== */

import type { StateManager } from './StateManager';

export class ConfigLoader {
    constructor(private stateManager: StateManager) {}

    /**
     * Load all configurations in parallel
     */
    async loadAllConfigs(): Promise<void> {
        const fetchJSON = async (devUrl: string, staticUrl: string) => {
            try {
                const response = await fetch(devUrl);
                if (!response.ok) throw new Error();
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    throw new Error('Received HTML instead of JSON');
                }
                return await response.json();
            } catch {
                const response = await fetch(staticUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    throw new Error('Received HTML instead of JSON');
                }
                return await response.json();
            }
        };

        const fetchText = async (devUrl: string, staticUrl: string) => {
            try {
                const response = await fetch(devUrl);
                if (!response.ok) throw new Error();
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    throw new Error('Received HTML instead of text');
                }
                return await response.text();
            } catch {
                const response = await fetch(staticUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    throw new Error('Received HTML instead of text');
                }
                return await response.text();
            }
        };

        const [langData, behaviorData, materialData, cameraData, voiceData, knowledgeData, knowledgeMdData] = await Promise.all([
            fetchJSON('/api/config/language', '/src/translinkconfig/language_config.json'),
            fetchJSON('/api/config/mesh/behavior', '/src/translinkconfig/mesh_behavior_config.json'),
            fetchJSON('/api/config/mesh/material', '/src/translinkconfig/mesh_material_config.json'),
            fetchJSON('/api/config/camera', '/src/translinkconfig/camera_config.json'),
            fetchJSON('/api/config/voice', '/src/translinkconfig/live-voice/voice_config.json'),
            fetchJSON('/api/config/knowledge', '/src/translinkconfig/live-voice/knowledge_config.json'),
            fetchText('/api/config/knowledge-md', '/src/translinkconfig/live-voice/knowledge.md')
        ]);

        // Isolate current & original deep states
        this.stateManager.setOriginalConfig(JSON.parse(JSON.stringify(langData)));
        this.stateManager.setCurrentConfig(JSON.parse(JSON.stringify(langData)));

        this.stateManager.setOriginalMeshBehavior(JSON.parse(JSON.stringify(behaviorData)));
        this.stateManager.setCurrentMeshBehavior(JSON.parse(JSON.stringify(behaviorData)));

        this.stateManager.setOriginalMeshMaterial(JSON.parse(JSON.stringify(materialData)));
        this.stateManager.setCurrentMeshMaterial(JSON.parse(JSON.stringify(materialData)));

        this.stateManager.setOriginalCamera(JSON.parse(JSON.stringify(cameraData)));
        this.stateManager.setCurrentCamera(JSON.parse(JSON.stringify(cameraData)));

        this.stateManager.setOriginalVoice(JSON.parse(JSON.stringify(voiceData)));
        this.stateManager.setCurrentVoice(JSON.parse(JSON.stringify(voiceData)));

        this.stateManager.setOriginalKnowledge(JSON.parse(JSON.stringify(knowledgeData)));
        this.stateManager.setCurrentKnowledge(JSON.parse(JSON.stringify(knowledgeData)));

        this.stateManager.setOriginalKnowledgeMd(knowledgeMdData);
        this.stateManager.setCurrentKnowledgeMd(knowledgeMdData);
    }
}
