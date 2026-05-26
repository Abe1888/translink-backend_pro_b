/* ==========================================================================
   RAW JSON EDITOR - Generic JSON Editor Component
   ========================================================================== */

import type { StateManager } from '../../core/StateManager';

type ConfigType = 'config' | 'meshBehavior' | 'meshMaterial' | 'camera' | 'voice' | 'knowledge' | 'knowledgeMd';

export class RawJSONEditor {
    /**
     * Render a raw JSON editor for any configuration object
     */
    static render(
        stateManager: StateManager,
        container: HTMLElement,
        configType: ConfigType,
        title: string,
        description: string,
        onUpdate: () => void
    ): void {
        // Get the current config based on type
        let targetConfig: any;
        switch (configType) {
            case 'config':
                targetConfig = stateManager.getCurrentConfig();
                break;
            case 'meshBehavior':
                targetConfig = stateManager.getCurrentMeshBehavior();
                break;
            case 'meshMaterial':
                targetConfig = stateManager.getCurrentMeshMaterial();
                break;
            case 'camera':
                targetConfig = stateManager.getCurrentCamera();
                break;
            case 'voice':
                targetConfig = stateManager.getCurrentVoice();
                break;
            case 'knowledge':
                targetConfig = stateManager.getCurrentKnowledge();
                break;
            case 'knowledgeMd':
                targetConfig = stateManager.getCurrentKnowledgeMd();
                break;
        }

        container.innerHTML = `
            <div class="cms-view-container" style="height: calc(100vh - 80px); display: flex; flex-direction: column; padding-top: 10px;">
                <div class="cms-json-view" style="flex: 1; display: flex; flex-direction: column;">
                    <div id="jsonErrorContainer" class="cms-json-error" style="display: none;"></div>
                    <textarea class="cms-json-textarea" id="cmsJsonTextarea" style="flex: 1;" spellcheck="false"></textarea>
                </div>
            </div>
        `;

        const textarea = document.getElementById('cmsJsonTextarea') as HTMLTextAreaElement;
        const errContainer = document.getElementById('jsonErrorContainer')!;
        
        if (!textarea) {
            console.error('[RawJSONEditor] Textarea element not found');
            return;
        }

        // Handle markdown differently (plain text)
        if (configType === 'knowledgeMd') {
            textarea.value = targetConfig;
        } else {
            textarea.value = JSON.stringify(targetConfig, null, 2);
        }

        textarea.addEventListener('input', () => {
            try {
                let parsed: any;
                
                // Handle markdown differently
                if (configType === 'knowledgeMd') {
                    parsed = textarea.value;
                    stateManager.setCurrentKnowledgeMd(parsed);
                } else {
                    parsed = JSON.parse(textarea.value);
                    
                    // Update the state based on config type
                    switch (configType) {
                        case 'config':
                            stateManager.setCurrentConfig(parsed);
                            break;
                        case 'meshBehavior':
                            stateManager.setCurrentMeshBehavior(parsed);
                            break;
                        case 'meshMaterial':
                            stateManager.setCurrentMeshMaterial(parsed);
                            break;
                        case 'camera':
                            stateManager.setCurrentCamera(parsed);
                            break;
                        case 'voice':
                            stateManager.setCurrentVoice(parsed);
                            break;
                        case 'knowledge':
                            stateManager.setCurrentKnowledge(parsed);
                            break;
                    }
                }
                
                errContainer.style.display = 'none';
                onUpdate();
            } catch (e: any) {
                errContainer.textContent = `JSON Parsing Error: ${e.message}`;
                errContainer.style.display = 'block';
            }
        });
    }
}
