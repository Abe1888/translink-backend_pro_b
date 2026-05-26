# TRANSLINK Configuration Library

This directory serves as the **Single Source of Truth** for the application's configuration, localization, and animation metrics. It holds JSON files that drive the 3D scene, UI, and live voice configurations at runtime.

---

## 🔄 Dynamic Runtime Synchronization
To prevent browser and CDN caching issues in production, these JSON files are loaded dynamically at runtime via the **`ConfigStore`** (`src/translinkconfig/ConfigStore.ts`) hitting `/api/config/*` endpoints. 

In production, if the backend server is absent or unreachable, the application falls back transparently to the bundled version of these files baked at build-time.

---

## 📁 Configuration Files Directory

### 1. `mesh_material_config.json`
Defines the physical appearance and materials of the loaded 3D meshes (e.g., color, metalness, roughness, clearcoat, emissive, and HDR intensity).

### 2. `mesh_behavior_config.json`
Specifies mesh visibility limits, shadow-casting properties, geometric thresholds, and animation override gates.

### 3. `camera_config.json`
Orchestrates the camera path keyframes (positions, targets, and field-of-view values) mapped to scroll progress ranges for desktop, tablet, and mobile views.

### 4. `waypoint_config.json`
Manages 3D annotation labels (Waypoints) including their active scroll progress ranges, GLB locator anchors, title/subtitle copy, stats, and placement alignment.

### 5. `language_config.json`
Holds translation keyframes for English (`en`), Amharic (`am`), and Arabic (`ar`) locales, enabling dynamic, real-time UI text updates.

### 6. `audio_config.json`
Configures volume limits, sound effect trigger files, and easing transitions.

### 7. `live-voice/`
- **`voice_config.json`**: Maps active AI assistant voices (e.g., `Zephyr`, `Puck`) to specific languages.
- **`knowledge_config.json`**: Configures the voice assistant RAG synchronization variables.
- **`knowledge.md`**: The raw text manual defining corporate details, RAG snippets, and fallback system instructions consumed by the Gemini Live voice assistant.
