/* ==========================================================================
   DIFF UTILITIES - Change detection and comparison
   ========================================================================== */

/**
 * Deep compare two objects to detect changes
 */
export function hasChanges(original: any, current: any): boolean {
    return JSON.stringify(original) !== JSON.stringify(current);
}

/**
 * Count the number of changed fields between two objects
 */
export function countChanges(original: any, current: any): number {
    if (typeof original !== 'object' || typeof current !== 'object') {
        return original !== current ? 1 : 0;
    }

    let count = 0;
    const allKeys = new Set([...Object.keys(original), ...Object.keys(current)]);

    for (const key of allKeys) {
        if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) {
            count++;
        }
    }

    return count;
}

/**
 * Get list of changed field paths
 */
export function getChangedFields(original: any, current: any, prefix = ''): string[] {
    const changes: string[] = [];

    if (typeof original !== 'object' || typeof current !== 'object') {
        if (original !== current) {
            changes.push(prefix);
        }
        return changes;
    }

    const allKeys = new Set([...Object.keys(original || {}), ...Object.keys(current || {})]);

    for (const key of allKeys) {
        const path = prefix ? `${prefix}.${key}` : key;
        const origVal = original?.[key];
        const currVal = current?.[key];

        if (JSON.stringify(origVal) !== JSON.stringify(currVal)) {
            if (typeof origVal === 'object' && typeof currVal === 'object') {
                changes.push(...getChangedFields(origVal, currVal, path));
            } else {
                changes.push(path);
            }
        }
    }

    return changes;
}
