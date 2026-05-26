/* ==========================================================================
   VOICE TYPES - Live Voice module types
   ========================================================================== */

export interface VoiceConfig {
    voices: Record<string, VoiceLanguageConfig>;
    [key: string]: any;
}

export interface VoiceLanguageConfig {
    activeVoice: string;
    availableVoices: VoiceSpeaker[];
}

export interface VoiceSpeaker {
    id: string;
    name: string;
    gender: 'male' | 'female';
    tone: string;
    [key: string]: any;
}

export interface KnowledgeConfig {
    crawling: CrawlingConfig;
    parsing: ParsingConfig;
    rag: RAGConfig;
    memory: MemoryConfig;
    [key: string]: any;
}

export interface CrawlingConfig {
    maxDepth: number;
    allowedDomains: string[];
    [key: string]: any;
}

export interface ParsingConfig {
    chunkSize: number;
    overlap: number;
    [key: string]: any;
}

export interface RAGConfig {
    vectorDimensions: number;
    topK: number;
    [key: string]: any;
}

export interface MemoryConfig {
    shortTerm: number;
    longTerm: number;
    [key: string]: any;
}
