import { NextFunction, Request, Response, Router } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dashboardService } from "../brain/DashboardService.js";
import { ragService } from "../brain/knowledge/RagService.js";
import { memoryService } from "../brain/memory/MemoryService.js";
import { agentOrchestrator } from "../services/AgentOrchestrator.js";
import { voiceTelemetryService } from "../services/VoiceTelemetryService.js";
import { rateLimitService } from "../services/RateLimitService.js";
import { voiceReadinessService } from "../services/VoiceReadinessService.js";
import { rtcSessionService } from "../services/RtcSessionService.js";

const router = Router();
const isProduction = process.env.NODE_ENV === 'production';
const TELEMETRY_RATE_LIMIT = Number(process.env.TELEMETRY_RATE_LIMIT || 60);
const TELEMETRY_RATE_WINDOW_MS = Number(process.env.TELEMETRY_RATE_WINDOW_MS || 60 * 1000);
const RTC_SESSION_RATE_LIMIT = Number(process.env.RTC_SESSION_RATE_LIMIT || 20);
const RTC_SESSION_RATE_WINDOW_MS = Number(process.env.RTC_SESSION_RATE_WINDOW_MS || 60 * 1000);
const telemetryToken = process.env.VOICE_TELEMETRY_TOKEN || process.env.ADMIN_API_TOKEN || '';

// ── Config directory resolution ────────────────────────────────────────────────
// In production the compiled server lives at dist-server/routes/api.js.
// process.cwd() is always the repo root on Render, so resolve from there.
// Fall back to relative-to-file path for local compiled runs.
const __filename_api = fileURLToPath(import.meta.url);
const __dirname_api = path.dirname(__filename_api);

const resolveConfigDir = (): string => {
  const fromCwd = path.resolve(process.cwd(), 'src', 'translinkconfig');
  if (fs.existsSync(fromCwd)) return fromCwd;
  // dist-server/routes/ → go up two levels to repo root, then into src/
  const fromFile = path.resolve(__dirname_api, '..', '..', 'src', 'translinkconfig');
  return fromFile;
};

const CONFIG_DIR = resolveConfigDir();

interface CmsRouteConfig {
  filename: string;
  subDir?: string;
  requiredKey: string | null; // null = plain text (markdown)
}

const CMS_ROUTES: Record<string, CmsRouteConfig> = {
  '/config/language':      { filename: 'language_config.json',       requiredKey: 'languages' },
  '/config/mesh/behavior': { filename: 'mesh_behavior_config.json',   requiredKey: 'meshes' },
  '/config/mesh/material': { filename: 'mesh_material_config.json',   requiredKey: 'materials' },
  '/config/camera':        { filename: 'camera_config.json',          requiredKey: 'cameraKeyframesDesktop' },
  '/config/voice':         { filename: 'voice_config.json',  subDir: 'live-voice', requiredKey: 'voiceMetadata' },
  '/config/knowledge':     { filename: 'knowledge_config.json', subDir: 'live-voice', requiredKey: 'sync_engine' },
  '/config/knowledge-md':  { filename: 'knowledge.md',       subDir: 'live-voice', requiredKey: null },
};

// ── CMS Rate Limiting ──────────────────────────────────────────────────────────
const CMS_WRITE_RATE_LIMIT = Number(process.env.CMS_WRITE_RATE_LIMIT || 30);
const CMS_WRITE_RATE_WINDOW_MS = Number(process.env.CMS_WRITE_RATE_WINDOW_MS || 60 * 1000);
const cmsWriteToken = process.env.CMS_WRITE_TOKEN || process.env.ADMIN_API_TOKEN || '';

const requireCmsWrite = (req: Request, res: Response, next: NextFunction) => {
  const ip = getRequestIp(req);
  const rateResult = rateLimitService.check(
    `cms-write:${ip}`,
    CMS_WRITE_RATE_LIMIT,
    CMS_WRITE_RATE_WINDOW_MS
  );
  if (!rateResult.allowed) {
    res.setHeader('Retry-After', Math.ceil((rateResult.retryAfterMs || 1000) / 1000));
    res.status(429).json({ error: 'Too many CMS write requests' });
    return;
  }

  // In production, require the CMS write token for POST operations
  if (isProduction && cmsWriteToken) {
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const headerToken = req.headers['x-admin-token'] as string | undefined;
    if (bearerToken !== cmsWriteToken && headerToken !== cmsWriteToken) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
  }

  next();
};

// ── CMS GET/POST Handlers ──────────────────────────────────────────────────────
for (const [routePath, cfg] of Object.entries(CMS_ROUTES)) {
  const configFilePath = cfg.subDir
    ? path.join(CONFIG_DIR, cfg.subDir, cfg.filename)
    : path.join(CONFIG_DIR, cfg.filename);
  const backupFilePath = cfg.subDir
    ? path.join(CONFIG_DIR, cfg.subDir, cfg.filename.replace(/\.(json|md)$/, '.backup.$1'))
    : path.join(CONFIG_DIR, cfg.filename.replace(/\.(json|md)$/, '.backup.$1'));

  // GET — read config file
  router.get(routePath, (req: Request, res: Response) => {
    try {
      if (!fs.existsSync(configFilePath)) {
        res.status(404).json({ error: `Config file not found: ${cfg.filename}` });
        return;
      }
      const raw = fs.readFileSync(configFilePath, 'utf8');
      res.status(200)
        .setHeader('Content-Type', cfg.requiredKey !== null
          ? 'application/json'
          : 'text/plain; charset=utf-8')
        .send(raw);
    } catch (err: any) {
      console.error(`[API] CMS GET ${routePath} error:`, err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // POST — write config file (rate-limited + auth-gated in production)
  router.post(routePath, requireCmsWrite, (req: Request, res: Response) => {
    let body = '';
    
    req.on('data', (chunk) => { 
      body += chunk.toString(); 
    });
    
    req.on('end', () => {
      try {
        if (cfg.requiredKey !== null) {
          // JSON config — validate required root key
          let payload: any;
          try {
            payload = JSON.parse(body);
          } catch (parseErr) {
            console.error(`[API] CMS POST ${routePath} JSON parse error:`, parseErr);
            res.status(400).json({ error: 'Invalid JSON payload' });
            return;
          }
          if (!payload || typeof payload !== 'object' || !payload[cfg.requiredKey]) {
            res.status(400).json({
              error: `Invalid config payload: missing required key '${cfg.requiredKey}'`,
            });
            return;
          }
          // Backup existing file
          if (fs.existsSync(configFilePath)) {
            fs.copyFileSync(configFilePath, backupFilePath);
          }
          fs.mkdirSync(path.dirname(configFilePath), { recursive: true });
          fs.writeFileSync(configFilePath, JSON.stringify(payload, null, 2), 'utf8');
        } else {
          // Plain text (markdown)
          if (fs.existsSync(configFilePath)) {
            fs.copyFileSync(configFilePath, backupFilePath);
          }
          fs.mkdirSync(path.dirname(configFilePath), { recursive: true });
          fs.writeFileSync(configFilePath, body, 'utf8');
        }
        
        // Ensure response is sent with proper headers
        res.status(200)
          .setHeader('Content-Type', 'application/json')
          .json({ status: 'ok', message: `${cfg.filename} saved successfully` });
          
      } catch (writeErr: any) {
        console.error(`[API] CMS POST ${routePath} write error:`, writeErr.message);
        res.status(500).json({ error: `Disk write failed: ${writeErr.message}` });
      }
    });
    
    req.on('error', (err) => {
      console.error(`[API] CMS POST ${routePath} request error:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: `Request read error: ${err.message}` });
      }
    });
  });
}

// ── Utility ────────────────────────────────────────────────────────────────────
const getRequestIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

const requireTelemetryAccess = (req: Request, res: Response, next: NextFunction) => {
  const ip = getRequestIp(req);
  const rateResult = rateLimitService.check(
    `voice-telemetry:${ip}`,
    TELEMETRY_RATE_LIMIT,
    TELEMETRY_RATE_WINDOW_MS
  );
  if (!rateResult.allowed) {
    res.setHeader('Retry-After', Math.ceil((rateResult.retryAfterMs || 1000) / 1000));
    res.status(429).json({ error: 'Too many telemetry requests' });
    return;
  }

  if (!isProduction) {
    next();
    return;
  }

  if (!telemetryToken) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const headerToken = req.headers['x-admin-token'];
  if (bearerToken === telemetryToken || headerToken === telemetryToken) {
    next();
    return;
  }

  res.status(403).json({ error: 'Forbidden' });
};

// ── Core API Routes ────────────────────────────────────────────────────────────
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.get("/brain/status", async (req, res) => {
  try {
    const status = await dashboardService.getBrainStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch brain status" });
  }
});

router.post("/rtc/session", (req, res) => {
  const ip = getRequestIp(req);
  const rateResult = rateLimitService.check(
    `rtc-session:${ip}`,
    RTC_SESSION_RATE_LIMIT,
    RTC_SESSION_RATE_WINDOW_MS
  );
  if (!rateResult.allowed) {
    res.setHeader('Retry-After', Math.ceil((rateResult.retryAfterMs || 1000) / 1000));
    res.status(429).json({ error: 'Too many RTC session requests' });
    return;
  }

  res.json(rtcSessionService.createSession());
});

router.get("/voice/telemetry", requireTelemetryAccess, (req, res) => {
  const includeSnapshot = req.query.detail === '1' || req.query.detail === 'true';
  res.json({
    status: "ok",
    summary: voiceTelemetryService.getSummary(),
    ...(includeSnapshot ? { snapshot: voiceTelemetryService.getSnapshot() } : {}),
  });
});

router.get("/voice/readiness", requireTelemetryAccess, (req, res) => {
  const report = voiceReadinessService.getReport();
  const httpStatus = report.status === 'error' ? 503 : 200;
  res.status(httpStatus).json(report);
});

router.get("/voice/memory", requireTelemetryAccess, (req, res) => {
  res.json({
    status: "ok",
    memory: memoryService.getStats(),
    retrieval: ragService.getStats(),
    orchestrator: agentOrchestrator.getStats(),
    rtc: rtcSessionService.getStats(),
  });
});

router.post("/voice/memory/cleanup", requireTelemetryAccess, (req, res) => {
  const requestedTtlMs = Number(req.body?.maxAgeMs);
  const removed = memoryService.cleanupExpiredSessions(
    Number.isFinite(requestedTtlMs) && requestedTtlMs > 0 ? requestedTtlMs : undefined
  );

  res.json({
    status: "ok",
    removed,
    memory: memoryService.getStats(),
  });
});

export default router;
