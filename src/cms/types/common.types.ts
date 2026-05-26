/* ==========================================================================
   COMMON TYPES - Shared across all CMS modules
   ========================================================================== */

export type CMSMode = 'lang' | '3d' | 'camera' | 'voice';
export type LanguageCode = 'en' | 'am' | 'ar';
export type ToastType = 'success' | 'error' | 'info';

export interface CMSState {
    activeMode: CMSMode;
    activeLangTab: LanguageCode;
    activeNavGroup: string;
    activeNavId: string;
}

export interface NavItem {
    id: string;
    group: string;
    title: string;
    subtitle?: string;
    count?: number;
}

export interface CMSElements {
    appEl: HTMLElement;
    saveBtn: HTMLButtonElement;
    discardBtn: HTMLButtonElement;
    exportBtn: HTMLButtonElement;
    dirtyBadge: HTMLElement;
    mainContentEl: HTMLElement;
}
