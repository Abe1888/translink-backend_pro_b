/* ==========================================================================
   KNOWLEDGE CONFIG COMPONENT - RAG Knowledge Base & Crawler Config
   ========================================================================== */

import type { StateManager } from '../../../core/StateManager';

export class KnowledgeConfig {
    /**
     * Setup tag editor for array fields
     */
    private static setupTagEditor(
        editorId: string,
        currentTags: string[],
        originalTags: string[],
        onUpdate: (newTags: string[]) => void,
        containerEl: HTMLElement
    ): void {
        const tagsList = containerEl.querySelector(`#tags-list-${editorId}`)!;
        const tagInput = containerEl.querySelector(`#tag-input-${editorId}`) as HTMLInputElement;

        if (!tagsList || !tagInput) return;

        // Render existing tags
        const renderTags = () => {
            tagsList.innerHTML = currentTags.map((tag, idx) => `
                <span class="cms-tag-badge">
                    ${tag}
                    <span class="cms-tag-remove" data-idx="${idx}">&times;</span>
                </span>
            `).join('');

            // Bind remove handlers
            tagsList.querySelectorAll('.cms-tag-remove').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.getAttribute('data-idx')!);
                    currentTags.splice(idx, 1);
                    onUpdate(currentTags);
                    renderTags();
                });
            });
        };

        renderTags();

        // Add new tag on Enter
        tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && tagInput.value.trim()) {
                e.preventDefault();
                currentTags.push(tagInput.value.trim());
                tagInput.value = '';
                onUpdate(currentTags);
                renderTags();
            }
        });
    }

    /**
     * Bind event handlers for form fields
     */
    private static bindSwitch(id: string, pathObj: any, key: string, onUpdate: () => void, containerEl: HTMLElement): void {
        const el = containerEl.querySelector(`#${id}`) as HTMLInputElement;
        if (!el) return;
        el.addEventListener('change', () => {
            pathObj[key] = el.checked;
            onUpdate();
            el.closest('.cms-field-card')!.classList.add('dirty');
        });
    }

    private static bindNumber(id: string, pathObj: any, key: string, onUpdate: () => void, containerEl: HTMLElement): void {
        const el = containerEl.querySelector(`#${id}`) as HTMLInputElement;
        if (!el) return;
        el.addEventListener('input', () => {
            pathObj[key] = parseFloat(el.value) || 0;
            onUpdate();
            el.closest('.cms-field-card')!.classList.add('dirty');
        });
    }

    private static bindText(id: string, pathObj: any, key: string, onUpdate: () => void, containerEl: HTMLElement): void {
        const el = containerEl.querySelector(`#${id}`) as HTMLInputElement;
        if (!el) return;
        el.addEventListener('input', () => {
            pathObj[key] = el.value;
            onUpdate();
            el.closest('.cms-field-card')!.classList.add('dirty');
        });
    }

    private static bindSelect(id: string, pathObj: any, key: string, onUpdate: () => void, containerEl: HTMLElement): void {
        const el = containerEl.querySelector(`#${id}`) as HTMLSelectElement;
        if (!el) return;
        el.addEventListener('change', () => {
            pathObj[key] = el.value;
            onUpdate();
            el.closest('.cms-field-card')!.classList.add('dirty');
        });
    }

    /**
     * Render the knowledge config workspace
     */
    static render(
        stateManager: StateManager,
        containerEl: HTMLElement,
        onUpdate: () => void
    ): void {
        const knowledge = stateManager.getCurrentKnowledge();
        const originalKnowledge = stateManager.getOriginalKnowledge();

        // Sync Engine card
        const se = knowledge.sync_engine;
        const seOrig = originalKnowledge.sync_engine;
        const seDirty = JSON.stringify(se) !== JSON.stringify(seOrig);

        // Chunking rules card
        const cr = knowledge.chunking_rules;
        const crOrig = originalKnowledge.chunking_rules;
        const crDirty = JSON.stringify(cr) !== JSON.stringify(crOrig);

        // Retrieval & Memory card
        const rp = knowledge.retrieval_policies;
        const rpOrig = originalKnowledge.retrieval_policies;
        const mt = knowledge.memory_tiers;
        const mtOrig = originalKnowledge.memory_tiers;
        const rmDirty = JSON.stringify(rp) !== JSON.stringify(rpOrig) || JSON.stringify(mt) !== JSON.stringify(mtOrig);

        // Taxonomy card
        const tax = knowledge.taxonomy_and_tagging;
        const taxOrig = originalKnowledge.taxonomy_and_tagging;
        const taxDirty = JSON.stringify(tax) !== JSON.stringify(taxOrig);

        // Sources card
        const ks = knowledge.knowledge_sources;
        const ksOrig = originalKnowledge.knowledge_sources;
        const ksDirty = JSON.stringify(ks) !== JSON.stringify(ksOrig);

        containerEl.innerHTML = `
            <div class="cms-view-container">
                <div class="cms-fields-grid" style="grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));">
                    <!-- 1. Crawler Sync Engine -->
                    <div class="cms-field-card ${seDirty ? 'dirty' : ''}">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label">Crawler Sync Engine</label>
                                <span class="cms-field-key">knowledge_config.sync_engine</span>
                            </div>
                            ${seDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                            <div style="display: flex; gap: 20px; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 11px; color: var(--text-secondary);">Sync Ingestion:</span>
                                    <label class="cms-switch">
                                        <input type="checkbox" id="field-kn-se-enabled" ${se.enabled ? 'checked' : ''}>
                                        <span class="cms-slider"></span>
                                    </label>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 11px; color: var(--text-secondary);">Robots.txt compliance:</span>
                                    <label class="cms-switch">
                                        <input type="checkbox" id="field-kn-se-robots" ${se.respect_robots_txt ? 'checked' : ''}>
                                        <span class="cms-slider"></span>
                                    </label>
                                </div>
                            </div>
                            
                            <div style="display: flex; gap: 10px;">
                                <div style="flex: 1;">
                                    <span style="font-size: 10px; color: var(--text-muted);">Sync Mode</span>
                                    <select class="cms-input" id="field-kn-se-mode" style="background-color: var(--bg-input); border-color: var(--border-color); color: var(--text-primary); padding: 5px;">
                                        <option value="polling" ${se.sync_mode === 'polling' ? 'selected' : ''}>polling (Interval-based)</option>
                                        <option value="realtime" ${se.sync_mode === 'realtime' ? 'selected' : ''}>realtime (Webhook Push)</option>
                                    </select>
                                </div>
                                <div style="width: 120px;">
                                    <span style="font-size: 10px; color: var(--text-muted);">Polling Interval (Hrs)</span>
                                    <input type="number" class="cms-input" id="field-kn-se-interval" value="${se.polling_interval_hours}" style="padding: 5px;">
                                </div>
                                <div style="width: 90px;">
                                    <span style="font-size: 10px; color: var(--text-muted);">Crawl Depth</span>
                                    <input type="number" class="cms-input" id="field-kn-se-depth" value="${se.crawl_depth}" style="padding: 5px;">
                                </div>
                            </div>

                            <div>
                                <span style="font-size: 10px; color: var(--text-muted);">Ingestion Targets (Domains)</span>
                                <div class="cms-tag-editor" id="tag-editor-se-domains" style="margin-top: 4px;">
                                    <div class="cms-tags-list" id="tags-list-se-domains"></div>
                                    <input type="text" class="cms-tag-input" id="tag-input-se-domains" placeholder="+ Add crawl domain...">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Chunking & Ingestion Rules -->
                    <div class="cms-field-card ${crDirty ? 'dirty' : ''}">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label">Semantic Text Chunking</label>
                                <span class="cms-field-key">knowledge_config.chunking_rules</span>
                            </div>
                            ${crDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Target Chunk Size (Tokens)</span>
                                    <input type="number" class="cms-input" id="field-kn-cr-target" value="${cr.target_chunk_size_tokens}" style="padding: 5px;">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Overlap Percentage (%)</span>
                                    <input type="number" class="cms-input" id="field-kn-cr-overlap" value="${cr.overlap_percentage}" style="padding: 5px;">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Min Chunk size (Tokens)</span>
                                    <input type="number" class="cms-input" id="field-kn-cr-min" value="${cr.min_chunk_size_tokens}" style="padding: 5px;">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Max Chunk size (Tokens)</span>
                                    <input type="number" class="cms-input" id="field-kn-cr-max" value="${cr.max_chunk_size_tokens}" style="padding: 5px;">
                                </div>
                            </div>

                            <div>
                                <span style="font-size: 10px; color: var(--text-muted);">Semantic parsing separators</span>
                                <div class="cms-tag-editor" id="tag-editor-cr-bounds" style="margin-top: 4px;">
                                    <div class="cms-tags-list" id="tags-list-cr-bounds"></div>
                                    <input type="text" class="cms-tag-input" id="tag-input-cr-bounds" placeholder="+ Add tag boundary...">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Vector Retrieval & Memory Tiers Policies -->
                    <div class="cms-field-card ${rmDirty ? 'dirty' : ''}">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label">Vector Retrieval & Memory Tiers</label>
                                <span class="cms-field-key">knowledge_config.retrieval_policies</span>
                            </div>
                            ${rmDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Vector Dimensions</span>
                                    <input type="number" class="cms-input" id="field-kn-rp-dim" value="${rp.vector_dimensions}" style="padding: 5px;">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Freshness Boost (Days)</span>
                                    <input type="number" class="cms-input" id="field-kn-rp-fresh" value="${rp.freshness_boost_days}" style="padding: 5px;">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Max Retrieved chunks</span>
                                    <input type="number" class="cms-input" id="field-kn-rp-max" value="${rp.max_retrieved_chunks}" style="padding: 5px;">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Session Memory limit</span>
                                    <input type="number" class="cms-input" id="field-kn-mt-messages" value="${mt.session_memory_messages}" style="padding: 5px;" title="session_memory_messages">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Short-Term Memory (Days)</span>
                                    <input type="number" class="cms-input" id="field-kn-mt-days" value="${mt.short_term_memory_days}" style="padding: 5px;" title="short_term_memory_days">
                                </div>
                                <div>
                                    <span style="font-size: 10px; color: var(--text-muted);">Long-Term Memory tier</span>
                                    <input type="text" class="cms-input" id="field-kn-mt-ltm" value="${mt.long_term_memory}" style="padding: 5px; font-size: 11px;" title="long_term_memory">
                                </div>
                            </div>

                            <div style="display: flex; gap: 20px; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 11px; color: var(--text-secondary);">Include Citations:</span>
                                    <label class="cms-switch">
                                        <input type="checkbox" id="field-kn-rp-citations" ${rp.include_citations ? 'checked' : ''}>
                                        <span class="cms-slider"></span>
                                    </label>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 11px; color: var(--text-secondary);">PII Redaction:</span>
                                    <label class="cms-switch">
                                        <input type="checkbox" id="field-kn-mt-pii" ${mt.pii_redaction_enabled ? 'checked' : ''}>
                                        <span class="cms-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 4. Taxonomy & Intelligent Tagging -->
                    <div class="cms-field-card ${taxDirty ? 'dirty' : ''}">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label">Taxonomy & Intelligent Tagging</label>
                                <span class="cms-field-key">knowledge_config.taxonomy_and_tagging</span>
                            </div>
                            ${taxDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                            <div>
                                <span style="font-size: 10px; color: var(--text-muted);">Taxonomy Knowledge Domains</span>
                                <div class="cms-tag-editor" id="tag-editor-tax-domains" style="margin-top: 4px;">
                                    <div class="cms-tags-list" id="tags-list-tax-domains"></div>
                                    <input type="text" class="cms-tag-input" id="tag-input-tax-domains" placeholder="+ Add domain tag...">
                                </div>
                            </div>
                            <div>
                                <span style="font-size: 10px; color: var(--text-muted);">Target Audiences</span>
                                <div class="cms-tag-editor" id="tag-editor-tax-audiences" style="margin-top: 4px;">
                                    <div class="cms-tags-list" id="tags-list-tax-audiences"></div>
                                    <input type="text" class="cms-tag-input" id="tag-input-tax-audiences" placeholder="+ Add audience tag...">
                                </div>
                            </div>
                            <div>
                                <span style="font-size: 10px; color: var(--text-muted);">Intelligent Intent classifications</span>
                                <div class="cms-tag-editor" id="tag-editor-tax-intents" style="margin-top: 4px;">
                                    <div class="cms-tags-list" id="tags-list-tax-intents"></div>
                                    <input type="text" class="cms-tag-input" id="tag-input-tax-intents" placeholder="+ Add intent tag...">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 5. Knowledge Sources Files -->
                    <div class="cms-field-card ${ksDirty ? 'dirty' : ''}" style="grid-column: 1 / -1;">
                        <div class="cms-field-label-row">
                            <div class="cms-field-label-wrapper">
                                <label class="cms-field-label">Primary Knowledge Sources (Files)</label>
                                <span class="cms-field-key">knowledge_config.knowledge_sources</span>
                            </div>
                            ${ksDirty ? '<span class="cms-field-dirty-marker">Modified</span>' : ''}
                        </div>
                        
                        <div style="margin-top: 10px; overflow-x: auto;">
                            <table class="cms-table" style="width: 100%; border-collapse: collapse; font-size: 11px;">
                                <thead>
                                    <tr style="border-bottom: 1px solid var(--border-color); text-align: left; color: var(--text-secondary);">
                                        <th style="padding: 6px;">ID</th>
                                        <th style="padding: 6px;">Resource Path</th>
                                        <th style="padding: 6px;">Type</th>
                                        <th style="padding: 6px;">Priority</th>
                                        <th style="padding: 6px; text-align: center;">Enabled</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${ks.map((src: any, idx: number) => {
                                        return `
                                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                                <td style="padding: 6px; font-family: monospace; font-weight: 700;">${src.id}</td>
                                                <td style="padding: 6px;">
                                                    <input type="text" class="cms-input" id="field-kn-src-file-${idx}" value="${src.file}" style="padding: 3px 6px; font-size: 11px; width: 180px;">
                                                </td>
                                                <td style="padding: 6px;">
                                                    <select class="cms-input" id="field-kn-src-type-${idx}" style="padding: 3px 6px; font-size: 11px; background-color: var(--bg-input); border-color: var(--border-color); color: var(--text-primary); width: 100px;">
                                                        <option value="markdown" ${src.type === 'markdown' ? 'selected' : ''}>markdown</option>
                                                        <option value="text" ${src.type === 'text' ? 'selected' : ''}>text</option>
                                                        <option value="pdf" ${src.type === 'pdf' ? 'selected' : ''}>pdf</option>
                                                    </select>
                                                </td>
                                                <td style="padding: 6px;">
                                                    <select class="cms-input" id="field-kn-src-priority-${idx}" style="padding: 3px 6px; font-size: 11px; background-color: var(--bg-input); border-color: var(--border-color); color: var(--text-primary); width: 100px;">
                                                        <option value="high" ${src.priority === 'high' ? 'selected' : ''}>high</option>
                                                        <option value="medium" ${src.priority === 'medium' ? 'selected' : ''}>medium</option>
                                                        <option value="low" ${src.priority === 'low' ? 'selected' : ''}>low</option>
                                                    </select>
                                                </td>
                                                <td style="padding: 6px; text-align: center;">
                                                    <label class="cms-switch" style="display: inline-block;">
                                                        <input type="checkbox" id="field-kn-src-enabled-${idx}" ${src.enabled ? 'checked' : ''}>
                                                        <span class="cms-slider"></span>
                                                    </label>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // --- BIND EVENT HANDLERS ---

        // Bind Crawler Sync Engine
        this.bindSwitch('field-kn-se-enabled', se, 'enabled', onUpdate, containerEl);
        this.bindSwitch('field-kn-se-robots', se, 'respect_robots_txt', onUpdate, containerEl);
        this.bindSelect('field-kn-se-mode', se, 'sync_mode', onUpdate, containerEl);
        this.bindNumber('field-kn-se-interval', se, 'polling_interval_hours', onUpdate, containerEl);
        this.bindNumber('field-kn-se-depth', se, 'crawl_depth', onUpdate, containerEl);

        // Target domains tag editor
        this.setupTagEditor('se-domains', se.target_domains, seOrig.target_domains, (newTags) => {
            se.target_domains = newTags;
            onUpdate();
        }, containerEl);

        // Chunking rules
        this.bindNumber('field-kn-cr-target', cr, 'target_chunk_size_tokens', onUpdate, containerEl);
        this.bindNumber('field-kn-cr-overlap', cr, 'overlap_percentage', onUpdate, containerEl);
        this.bindNumber('field-kn-cr-min', cr, 'min_chunk_size_tokens', onUpdate, containerEl);
        this.bindNumber('field-kn-cr-max', cr, 'max_chunk_size_tokens', onUpdate, containerEl);

        this.setupTagEditor('cr-bounds', cr.semantic_boundaries, crOrig.semantic_boundaries, (newTags) => {
            cr.semantic_boundaries = newTags;
            onUpdate();
        }, containerEl);

        // Retrieval & Memory
        this.bindNumber('field-kn-rp-dim', rp, 'vector_dimensions', onUpdate, containerEl);
        this.bindNumber('field-kn-rp-fresh', rp, 'freshness_boost_days', onUpdate, containerEl);
        this.bindNumber('field-kn-rp-max', rp, 'max_retrieved_chunks', onUpdate, containerEl);
        this.bindSwitch('field-kn-rp-citations', rp, 'include_citations', onUpdate, containerEl);

        this.bindNumber('field-kn-mt-messages', mt, 'session_memory_messages', onUpdate, containerEl);
        this.bindNumber('field-kn-mt-days', mt, 'short_term_memory_days', onUpdate, containerEl);
        this.bindText('field-kn-mt-ltm', mt, 'long_term_memory', onUpdate, containerEl);
        this.bindSwitch('field-kn-mt-pii', mt, 'pii_redaction_enabled', onUpdate, containerEl);

        // Taxonomy
        this.setupTagEditor('tax-domains', tax.domains, taxOrig.domains, (newTags) => {
            tax.domains = newTags;
            onUpdate();
        }, containerEl);
        this.setupTagEditor('tax-audiences', tax.audiences, taxOrig.audiences, (newTags) => {
            tax.audiences = newTags;
            onUpdate();
        }, containerEl);
        this.setupTagEditor('tax-intents', tax.intents, taxOrig.intents, (newTags) => {
            tax.intents = newTags;
            onUpdate();
        }, containerEl);

        // Knowledge Sources table bindings
        ks.forEach((src: any, idx: number) => {
            const fileInput = containerEl.querySelector(`#field-kn-src-file-${idx}`) as HTMLInputElement;
            const typeSelect = containerEl.querySelector(`#field-kn-src-type-${idx}`) as HTMLSelectElement;
            const prioritySelect = containerEl.querySelector(`#field-kn-src-priority-${idx}`) as HTMLSelectElement;
            const enabledInput = containerEl.querySelector(`#field-kn-src-enabled-${idx}`) as HTMLInputElement;

            if (!fileInput || !typeSelect || !prioritySelect || !enabledInput) return;

            const updateSource = () => {
                src.file = fileInput.value;
                src.type = typeSelect.value;
                src.priority = prioritySelect.value;
                src.enabled = enabledInput.checked;
                onUpdate();
                fileInput.closest('.cms-field-card')!.classList.add('dirty');
            };

            fileInput.addEventListener('input', updateSource);
            typeSelect.addEventListener('change', updateSource);
            prioritySelect.addEventListener('change', updateSource);
            enabledInput.addEventListener('change', updateSource);
        });
    }
}
