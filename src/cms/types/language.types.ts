/* ==========================================================================
   LANGUAGE TYPES - Copy Editor module types
   ========================================================================== */

export interface LanguageConfig {
    languages: Record<string, number>;
    [key: string]: any;
}

export interface GlobalContent {
    nav: Record<string, string>;
    footer: Record<string, string>;
    [key: string]: any;
}

export interface SectionContent {
    title: string;
    subtitle: string;
    description: string;
    features: string[];
    [key: string]: any;
}

export interface WaypointContent {
    title: string;
    description: string;
    tags: string[];
    [key: string]: any;
}
