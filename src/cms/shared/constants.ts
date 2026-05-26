/* ==========================================================================
   SHARED CONSTANTS - Labels, mappings, and configuration
   ========================================================================== */

// Waypoints Mapping for Human Readable Labels
export const WAYPOINT_LABELS: Record<string, string> = {
    'fuel-head': 'Sensor Head',
    'harness': 'Wiring Harness',
    'base-mount': 'Mounting Base',
    'precision-tracking': 'Precision Probe',
    'iot-sensor': 'IoT Module',
    'vision-ai': 'Vision AI',
    'contact': 'Contact Us',
    'visit-us': 'Visit Us',
    'security-bolt': 'Security Bolt',
    'precision-filter': 'Precision Filter'
};

// Sections Mapping for Human Readable Labels
export const SECTION_LABELS: Record<string, string> = {
    's1': 'Hero & Overview',
    's2': 'Real-Time Tracking',
    's3': 'Fuel Management',
    's4': 'CAN/OBD Analytics',
    's5': 'AI Video Safety',
    's6': 'Smart IoT Solutions',
    's7': 'Sensor Network',
    's8': 'AI / IoT Edge',
    's9': 'Video Telematics',
    's10': '24/7 Connect'
};

// API Endpoints
export const API_ENDPOINTS = {
    LANGUAGE: '/api/config/language',
    MESH_BEHAVIOR: '/api/config/mesh/behavior',
    MESH_MATERIAL: '/api/config/mesh/material',
    CAMERA: '/api/config/camera',
    VOICE: '/api/config/voice',
    KNOWLEDGE: '/api/config/knowledge',
    KNOWLEDGE_MD: '/api/config/knowledge-md'
} as const;

// Static Fallback Paths
export const STATIC_PATHS = {
    LANGUAGE: '/src/translinkconfig/language_config.json',
    MESH_BEHAVIOR: '/src/translinkconfig/mesh_behavior_config.json',
    MESH_MATERIAL: '/src/translinkconfig/mesh_material_config.json',
    CAMERA: '/src/translinkconfig/camera_config.json',
    VOICE: '/src/translinkconfig/live-voice/voice_config.json',
    KNOWLEDGE: '/src/translinkconfig/live-voice/knowledge_config.json',
    KNOWLEDGE_MD: '/src/translinkconfig/live-voice/knowledge.md'
} as const;
