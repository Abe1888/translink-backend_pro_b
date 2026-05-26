/* ==========================================================================
   MESH TYPES - 3D Meshes module types
   ========================================================================== */

export interface MeshBehaviorConfig {
    defaults: BehaviorDefaults;
    meshes: Record<string, MeshBehavior>;
}

export interface BehaviorDefaults {
    rotationSpeed: number;
    hoverLift: number;
    clickScale: number;
    [key: string]: any;
}

export interface MeshBehavior {
    rotationSpeed?: number;
    hoverLift?: number;
    clickScale?: number;
    [key: string]: any;
}

export interface MeshMaterialConfig {
    materials: Record<string, MaterialProperties>;
}

export interface MaterialProperties {
    color: string;
    metalness: number;
    roughness: number;
    emissive: string;
    emissiveIntensity: number;
    [key: string]: any;
}
