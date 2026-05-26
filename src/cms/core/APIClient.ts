/* ==========================================================================
   API CLIENT - Server Communication & Config Persistence
   ========================================================================== */

import type { StateManager } from './StateManager';

export class APIClient {
    constructor(private stateManager: StateManager) {}

    /**
     * Save JSON configuration to server
     */
    async saveFileToServer(endpoint: string, payload: any): Promise<any> {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        // Check if response has content before parsing JSON
        const contentType = response.headers.get('content-type');
        const text = await response.text();
        
        if (!text || text.trim() === '') {
            if (!response.ok) {
                throw new Error('Server responded with write error (empty response)');
            }
            // Empty response but successful status - treat as success
            return { status: 'ok', message: 'Saved successfully' };
        }
        
        let data: any;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('[CMS] Failed to parse server response:', text);
            throw new Error('Server returned invalid JSON response');
        }
        
        if (!response.ok) throw new Error(data.error || 'Server responded with write error');
        return data;
    }

    /**
     * Save raw text content to server (for markdown files)
     */
    async saveRawTextToServer(endpoint: string, payload: string): Promise<any> {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body: payload
        });
        
        // Check if response has content before parsing JSON
        const text = await response.text();
        
        if (!text || text.trim() === '') {
            if (!response.ok) {
                throw new Error('Server responded with write error (empty response)');
            }
            // Empty response but successful status - treat as success
            return { status: 'ok', message: 'Saved successfully' };
        }
        
        let data: any;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('[CMS] Failed to parse server response:', text);
            throw new Error('Server returned invalid JSON response');
        }
        
        if (!response.ok) throw new Error(data.error || 'Server responded with write error');
        return data;
    }

    /**
     * Save all changed configurations
     */
    async saveAllChanges(changesCount: Record<string, number>): Promise<void> {
        const savesList: Promise<any>[] = [];

        // 1. Save language config if changed
        if (changesCount.lang > 0) {
            savesList.push(
                this.saveFileToServer('/api/config/language', this.stateManager.getCurrentConfig())
            );
        }

        // 2. Save mesh behavior if changed
        if (changesCount.behavior > 0) {
            savesList.push(
                this.saveFileToServer('/api/config/mesh/behavior', this.stateManager.getCurrentMeshBehavior())
            );
        }

        // 3. Save mesh material if changed
        if (changesCount.material > 0) {
            savesList.push(
                this.saveFileToServer('/api/config/mesh/material', this.stateManager.getCurrentMeshMaterial())
            );
        }

        // 4. Save camera config if changed
        if (changesCount.camera > 0) {
            savesList.push(
                this.saveFileToServer('/api/config/camera', this.stateManager.getCurrentCamera())
            );
        }

        // 5. Save voice config if changed
        if (changesCount.voice > 0) {
            savesList.push(
                this.saveFileToServer('/api/config/voice', this.stateManager.getCurrentVoice())
            );
        }

        // 6. Save knowledge config if changed
        if (changesCount.knowledge > 0) {
            savesList.push(
                this.saveFileToServer('/api/config/knowledge', this.stateManager.getCurrentKnowledge())
            );
        }

        // 7. Save knowledge markdown if changed
        if (changesCount.knowledgeMd > 0) {
            savesList.push(
                this.saveRawTextToServer('/api/config/knowledge-md', this.stateManager.getCurrentKnowledgeMd())
            );
        }

        // Execute all saves in parallel
        await Promise.all(savesList);

        // Broadcast changes to other tabs
        this.broadcastConfigChanges();

        // Sync original state with current state
        this.stateManager.syncOriginalWithCurrent();
    }

    /**
     * Broadcast configuration changes to other browser tabs
     */
    private broadcastConfigChanges(): void {
        // Try BroadcastChannel first
        try {
            const bc = new BroadcastChannel('translink:cms');
            bc.postMessage({ type: 'cms:saved', timestamp: Date.now() });
            bc.close();
        } catch {
            // BroadcastChannel unavailable — fall back to localStorage event
        }

        // localStorage fallback for same-origin tabs
        try {
            localStorage.setItem('translink:cms:last-save', String(Date.now()));
        } catch {
            // quota or security restrictions
        }
    }
}
