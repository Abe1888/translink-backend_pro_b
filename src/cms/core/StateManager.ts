/* ==========================================================================
   STATE MANAGER - Centralized State Management & Dirty Tracking
   ========================================================================== */

import type { CMSMode, LanguageCode } from '../types';

export class StateManager {
    // Config files states (original and active)
    private originalConfig!: any;
    private currentConfig!: any;
    
    private originalMeshBehavior!: any;
    private currentMeshBehavior!: any;
    
    private originalMeshMaterial!: any;
    private currentMeshMaterial!: any;

    private originalCamera!: any;
    private currentCamera!: any;

    private originalVoice!: any;
    private currentVoice!: any;

    private originalKnowledge!: any;
    private currentKnowledge!: any;

    private originalKnowledgeMd!: string;
    private currentKnowledgeMd!: string;
    
    // UI state
    private activeMode: CMSMode = 'lang';
    private activeLangTab: LanguageCode = 'en';
    private activeNavGroup: string = 'global';
    private activeNavId: string = 'global';

    // Getters for config states
    getOriginalConfig() { return this.originalConfig; }
    getCurrentConfig() { return this.currentConfig; }
    setOriginalConfig(config: any) { this.originalConfig = config; }
    setCurrentConfig(config: any) { this.currentConfig = config; }

    getOriginalMeshBehavior() { return this.originalMeshBehavior; }
    getCurrentMeshBehavior() { return this.currentMeshBehavior; }
    setOriginalMeshBehavior(config: any) { this.originalMeshBehavior = config; }
    setCurrentMeshBehavior(config: any) { this.currentMeshBehavior = config; }

    getOriginalMeshMaterial() { return this.originalMeshMaterial; }
    getCurrentMeshMaterial() { return this.currentMeshMaterial; }
    setOriginalMeshMaterial(config: any) { this.originalMeshMaterial = config; }
    setCurrentMeshMaterial(config: any) { this.currentMeshMaterial = config; }

    getOriginalCamera() { return this.originalCamera; }
    getCurrentCamera() { return this.currentCamera; }
    setOriginalCamera(config: any) { this.originalCamera = config; }
    setCurrentCamera(config: any) { this.currentCamera = config; }

    getOriginalVoice() { return this.originalVoice; }
    getCurrentVoice() { return this.currentVoice; }
    setOriginalVoice(config: any) { this.originalVoice = config; }
    setCurrentVoice(config: any) { this.currentVoice = config; }

    getOriginalKnowledge() { return this.originalKnowledge; }
    getCurrentKnowledge() { return this.currentKnowledge; }
    setOriginalKnowledge(config: any) { this.originalKnowledge = config; }
    setCurrentKnowledge(config: any) { this.currentKnowledge = config; }

    getOriginalKnowledgeMd() { return this.originalKnowledgeMd; }
    getCurrentKnowledgeMd() { return this.currentKnowledgeMd; }
    setOriginalKnowledgeMd(content: string) { this.originalKnowledgeMd = content; }
    setCurrentKnowledgeMd(content: string) { this.currentKnowledgeMd = content; }

    // Getters and setters for UI state
    getActiveMode(): CMSMode { return this.activeMode; }
    setActiveMode(mode: CMSMode) { this.activeMode = mode; }

    getActiveLangTab(): LanguageCode { return this.activeLangTab; }
    setActiveLangTab(lang: LanguageCode) { this.activeLangTab = lang; }

    getActiveNavGroup(): string { return this.activeNavGroup; }
    setActiveNavGroup(group: string) { this.activeNavGroup = group; }

    getActiveNavId(): string { return this.activeNavId; }
    setActiveNavId(id: string) { this.activeNavId = id; }

    /**
     * Calculate changes count across all config files
     */
    calculateChangesCount(): Record<string, number> {
        const counts: Record<string, number> = {
            lang: 0,
            behavior: 0,
            material: 0,
            camera: 0,
            voice: 0,
            knowledge: 0,
            knowledgeMd: 0
        };

        // Language config changes
        counts.lang = this.deepCountChanges(this.originalConfig, this.currentConfig);

        // Mesh behavior changes
        counts.behavior = this.deepCountChanges(this.originalMeshBehavior, this.currentMeshBehavior);

        // Mesh material changes
        counts.material = this.deepCountChanges(this.originalMeshMaterial, this.currentMeshMaterial);

        // Camera config changes
        counts.camera = this.deepCountChanges(this.originalCamera, this.currentCamera);

        // Voice config changes
        counts.voice = this.deepCountChanges(this.originalVoice, this.currentVoice);

        // Knowledge config changes
        counts.knowledge = this.deepCountChanges(this.originalKnowledge, this.currentKnowledge);

        // Knowledge markdown changes
        counts.knowledgeMd = this.originalKnowledgeMd !== this.currentKnowledgeMd ? 1 : 0;

        return counts;
    }

    /**
     * Deep comparison to count changes between two objects
     */
    private deepCountChanges(original: any, current: any, path: string = ''): number {
        let count = 0;

        if (typeof original !== typeof current) {
            return 1;
        }

        if (Array.isArray(original) && Array.isArray(current)) {
            if (original.length !== current.length) {
                count += Math.abs(original.length - current.length);
            }
            const maxLen = Math.max(original.length, current.length);
            for (let i = 0; i < maxLen; i++) {
                if (i >= original.length || i >= current.length) {
                    count++;
                } else {
                    count += this.deepCountChanges(original[i], current[i], `${path}[${i}]`);
                }
            }
            return count;
        }

        if (typeof original === 'object' && original !== null && current !== null) {
            const allKeys = new Set([...Object.keys(original), ...Object.keys(current)]);
            for (const key of allKeys) {
                if (!(key in original)) {
                    count++;
                } else if (!(key in current)) {
                    count++;
                } else {
                    count += this.deepCountChanges(original[key], current[key], path ? `${path}.${key}` : key);
                }
            }
            return count;
        }

        // Primitive comparison
        return original !== current ? 1 : 0;
    }

    /**
     * Check if there are any changes across all configs
     */
    hasChanges(): boolean {
        const counts = this.calculateChangesCount();
        return Object.values(counts).some(count => count > 0);
    }

    /**
     * Get total changes count
     */
    getTotalChangesCount(): number {
        const counts = this.calculateChangesCount();
        return Object.values(counts).reduce((sum, count) => sum + count, 0);
    }

    /**
     * Discard all changes and reset to original state
     */
    discardAllChanges(): void {
        this.currentConfig = JSON.parse(JSON.stringify(this.originalConfig));
        this.currentMeshBehavior = JSON.parse(JSON.stringify(this.originalMeshBehavior));
        this.currentMeshMaterial = JSON.parse(JSON.stringify(this.originalMeshMaterial));
        this.currentCamera = JSON.parse(JSON.stringify(this.originalCamera));
        this.currentVoice = JSON.parse(JSON.stringify(this.originalVoice));
        this.currentKnowledge = JSON.parse(JSON.stringify(this.originalKnowledge));
        this.currentKnowledgeMd = this.originalKnowledgeMd;
    }

    /**
     * Sync original state with current state (after successful save)
     */
    syncOriginalWithCurrent(): void {
        this.originalConfig = JSON.parse(JSON.stringify(this.currentConfig));
        this.originalMeshBehavior = JSON.parse(JSON.stringify(this.currentMeshBehavior));
        this.originalMeshMaterial = JSON.parse(JSON.stringify(this.currentMeshMaterial));
        this.originalCamera = JSON.parse(JSON.stringify(this.currentCamera));
        this.originalVoice = JSON.parse(JSON.stringify(this.currentVoice));
        this.originalKnowledge = JSON.parse(JSON.stringify(this.currentKnowledge));
        this.originalKnowledgeMd = this.currentKnowledgeMd;
    }
}
