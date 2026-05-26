/* ==========================================================================
   MARKDOWN EDITOR COMPONENT - Knowledge.md Editor
   ========================================================================== */

import type { StateManager } from '../../../core/StateManager';

export class MarkdownEditor {
    /**
     * Render the markdown knowledge editor workspace
     */
    static render(
        stateManager: StateManager,
        containerEl: HTMLElement,
        onUpdate: () => void
    ): void {
        const currentKnowledgeMd = stateManager.getCurrentKnowledgeMd();
        const originalKnowledgeMd = stateManager.getOriginalKnowledgeMd();
        const isDirty = currentKnowledgeMd !== originalKnowledgeMd;

        containerEl.innerHTML = `
            <div class="cms-view-container" style="height: calc(100vh - 80px); display: flex; flex-direction: column; padding-top: 10px;">
                <div style="font-family: monospace; font-size: 10px; color: var(--t3); display: flex; justify-content: space-between; align-items: center; padding: 4px 0 8px; flex-shrink: 0;">
                    <span>Path: src/translinkconfig/live-voice/knowledge.md ${isDirty ? '<span class="cms-field-dirty-marker" style="margin-top: 0; margin-left: 8px; display: inline-block;">Modified</span>' : ''}</span>
                    <span id="mdCharCounter">Characters: ${currentKnowledgeMd.length}</span>
                </div>
                <textarea class="cms-json-textarea" id="cmsKnowledgeMdTextarea" style="flex: 1; resize: none; font-family: var(--fm); font-size: 12px; line-height: 1.5; padding: 16px; background-color: var(--bg-4); border: 1px solid var(--bd-1); color: var(--t1); outline: none; border-radius: 4px;" spellcheck="false"></textarea>
            </div>
        `;

        const textarea = document.getElementById('cmsKnowledgeMdTextarea') as HTMLTextAreaElement;
        const charCounter = document.getElementById('mdCharCounter')!;

        textarea.value = currentKnowledgeMd;

        textarea.addEventListener('input', () => {
            stateManager.setCurrentKnowledgeMd(textarea.value);
            charCounter.textContent = `Characters: ${textarea.value.length}`;
            onUpdate();

            // Set modified state visually on save buttons and badges
            const badge = document.querySelector('.cms-field-dirty-marker');
            const hasChanges = stateManager.getCurrentKnowledgeMd() !== originalKnowledgeMd;
            if (hasChanges && !badge) {
                const pathSpan = textarea.previousElementSibling?.firstElementChild;
                if (pathSpan) {
                    pathSpan.insertAdjacentHTML('beforeend', '<span class="cms-field-dirty-marker" style="margin-top: 0; margin-left: 8px; display: inline-block;">Modified</span>');
                }
            } else if (!hasChanges && badge) {
                badge.remove();
            }
        });
    }
}
