# Translink Scene System Structure

This directory houses the 3D WebGL engine layer, powered by **Three.js (0.175.0)**. It manages lighting, materials, model loaders, responsive rendering, and environment generation.

---

## 📁 3D Engine Architecture

```text
translinkscene/
├── assets/
│   └── manifests.ts               # Path lookups for Glb models and textures
├── core/
│   ├── lights.ts                  # Scene lighting setups (ambient, key, fill lights)
│   ├── scene.ts                   # Base WebGL scene initializer
│   └── loaders.ts                 # DRACO/Meshopt asset loading hooks
├── systems/
│   ├── audioSystem.ts             # Global background soundscapes
│   ├── responsiveSystem.ts        # FOV adjustments and mobile canvas scaling
│   ├── roadSystem.ts              # Road geometry generation and theme colors
│   ├── terrainSystem.ts           # Ground meshes and grid wireframes
│   └── truckAudioSystem.ts        # Dynamic spatial vehicle sound effects
├── types/
│   └── scene.ts                   # Camera and engine type signatures
├── utils/
│   └── helpers.ts                 # Math helpers and positioning utilities
├── world/
│   ├── AdaptiveLightingController.ts # Dynamic scroll-aware light animators
│   ├── environment.ts             # Sky background, HDR maps, stars and moon
│   ├── materials.ts               # Mesh material mappings and theme tinting
│   ├── MeshBehaviorController.ts  # Mesh shadow, visibility and wireframe states
│   └── World.ts                   # Root coordinator; integrates render loops & GSAP scroll
└── Structure.md                   # Core 3D engine structure guide
```

---

## 🌉 Communication & Design Principles
1. **The Bridge Pattern**: The 3D scene elements do not contain direct UI or DOM manipulation logic. Instead, camera triggers, waypoints, and popup visibility states are orchestrated through the communication layer (`translinkbridge/`).
2. **Dynamic Configuration**: Rather than importing static JSON files at compile time, the engine components (such as `World.ts` and `MeshBehaviorController.ts`) retrieve configurations dynamically from `ConfigStore` at runtime, supporting live CMS updates.
3. **Optimized Asset Pipeline**: Meshopt compression is applied to 3D GLB assets, and lighting updates are gated under demand-based frame rendering loops to reduce CPU/GPU overhead.