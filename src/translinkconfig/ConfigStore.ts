/**
 * ConfigStore — Runtime Configuration Manager
 *
 * PROBLEM SOLVED:
 *   Vite bakes all `import X from '*.json'` calls into the compiled JS bundle.
 *   Even after a CMS save, the live website keeps serving the OLD bundle data until
 *   a fresh production build is deployed. This store fixes that by fetching all
 *   config files from the live API at runtime, with the static JSON imports kept
 *   ONLY as offline/first-paint fallbacks.
 *
 * HOW IT WORKS:
 *   1. On `ConfigStore.initialize()` (called once in main.ts before anything else),
 *      every config is fetched from /api/config/* with a cache-busting timestamp.
 *   2. Successful API responses overwrite the bundled defaults in the in-memory cache.
 *   3. On network failure the bundled defaults are used transparently.
 *   4. A BroadcastChannel listens for CMS saves (`translink:cms:saved`) and
 *      re-fetches the updated configs, then fires `translink:config-updated` so
 *      components can react without a page reload.
 *
 * USAGE:
 *   // In main.ts — before anything else:
 *   await ConfigStore.initialize();
 *
 *   // In any component:
 *   const lang = ConfigStore.get('language');
 *   const cam  = ConfigStore.get('camera');
 *
 *   // To react to CMS saves (optional):
 *   window.addEventListener('translink:config-updated', () => applyNewConfig());
 */

// ── Bundled fallbacks (baked at build-time, used when API is unreachable) ──────
import langFallback      from './language_config.json';
import cameraFallback    from './camera_config.json';
import materialFallback  from './mesh_material_config.json';
import behaviorFallback  from './mesh_behavior_config.json';
import waypointFallback  from './waypoint_config.json';
import knowledgeMdFallback from './live-voice/knowledge.md?raw';
import voiceFallback     from './live-voice/voice_config.json';
import knowledgeFallback from './live-voice/knowledge_config.json';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ConfigKey =
  | 'language'
  | 'camera'
  | 'material'
  | 'behavior'
  | 'waypoint'
  | 'knowledgeMd'
  | 'voice'
  | 'knowledge';

interface ConfigEntry {
  apiPath: string;
  kind: 'json' | 'text';
  fallback: any;
}

// ── Endpoint registry ──────────────────────────────────────────────────────────

const REGISTRY: Record<ConfigKey, ConfigEntry> = {
  language:    { apiPath: '/api/config/language',      kind: 'json', fallback: langFallback },
  camera:      { apiPath: '/api/config/camera',        kind: 'json', fallback: cameraFallback },
  material:    { apiPath: '/api/config/mesh/material', kind: 'json', fallback: materialFallback },
  behavior:    { apiPath: '/api/config/mesh/behavior', kind: 'json', fallback: behaviorFallback },
  waypoint:    { apiPath: '/api/config/waypoint',      kind: 'json', fallback: waypointFallback },
  voice:       { apiPath: '/api/config/voice',         kind: 'json', fallback: voiceFallback },
  knowledge:   { apiPath: '/api/config/knowledge',     kind: 'json', fallback: knowledgeFallback },
  knowledgeMd: { apiPath: '/api/config/knowledge-md',  kind: 'text', fallback: knowledgeMdFallback },
};

// ── Store implementation ───────────────────────────────────────────────────────

class RuntimeConfigStore {
  private cache: Record<string, any> = {};
  private initPromise: Promise<void> | null = null;
  private channel: BroadcastChannel | null = null;
  /** Monotonic counter — incremented on every successful refresh */
  public version = 0;

  constructor() {
    // Pre-populate with bundled defaults so `get()` never returns undefined
    for (const [key, entry] of Object.entries(REGISTRY)) {
      this.cache[key] = entry.fallback;
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * Fetch all configs from the live API.
   * Safe to call multiple times — only runs once per page load.
   */
  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._fetchAll();
    return this.initPromise;
  }

  /**
   * Synchronous getter — returns the latest cached value.
   * Will return the bundled fallback until `initialize()` resolves.
   */
  get<T = any>(key: ConfigKey): T {
    return this.cache[key] as T;
  }

  /**
   * Refresh a single config from the API (used internally after CMS save).
   */
  async refresh(key: ConfigKey): Promise<void> {
    await this._fetchOne(key, Date.now());
  }

  /**
   * Refresh all configs from the API (called when CMS broadcasts a save).
   */
  async refreshAll(): Promise<void> {
    await this._fetchAll();
    this.version++;
    window.dispatchEvent(new CustomEvent('translink:config-updated', {
      detail: { version: this.version }
    }));
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private async _fetchAll(): Promise<void> {
    const ts = Date.now();
    const fetches = Object.keys(REGISTRY).map((key) =>
      this._fetchOne(key as ConfigKey, ts)
    );
    await Promise.allSettled(fetches);
    this._setupBroadcastListener();
  }

  private async _fetchOne(key: ConfigKey, ts: number): Promise<void> {
    const entry = REGISTRY[key];
    try {
      const res = await fetch(`${entry.apiPath}?_t=${ts}`, {
        cache: 'no-store',
        headers: { 'Accept': entry.kind === 'json' ? 'application/json' : 'text/plain' },
      });
      if (!res.ok) return; // Keep bundled fallback on 4xx/5xx
      const contentType = res.headers.get('content-type') || '';
      // Guard against CDN/proxy serving the SPA index.html instead of JSON
      if (entry.kind === 'json' && contentType.includes('text/html')) return;
      const data = entry.kind === 'json' ? await res.json() : await res.text();
      if (data !== null && data !== undefined) {
        this.cache[key] = data;
      }
    } catch {
      // Network failure — silently keep bundled fallback
    }
  }

  private _setupBroadcastListener(): void {
    if (this.channel) return; // Already set up
    try {
      this.channel = new BroadcastChannel('translink:cms');
      this.channel.addEventListener('message', (event) => {
        if (event.data?.type === 'cms:saved') {
          this.refreshAll().catch(console.error);
        }
      });
    } catch {
      // BroadcastChannel not available (e.g., HTTP/iframe cross-origin) — fall back
      // to localStorage storage event which works across same-origin tabs.
      window.addEventListener('storage', (event) => {
        if (event.key === 'translink:cms:last-save') {
          this.refreshAll().catch(console.error);
        }
      });
    }
  }
}

// ── Singleton export ───────────────────────────────────────────────────────────
export const ConfigStore = new RuntimeConfigStore();
