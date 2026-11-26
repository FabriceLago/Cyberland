import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FirebaseAppletConfig {
  projectId: string;
  firestoreDatabaseId?: string;
}

const firebaseConfigPath = path.resolve(__dirname, 'firebase-applet-config.json');
const firebaseConfig: FirebaseAppletConfig = JSON.parse(
  fs.readFileSync(firebaseConfigPath, 'utf8')
);
const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

const BOOTSTRAP_ADMIN_EMAIL = 'delapipen@gmail.com';
const UID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
const KID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
const DEBUG_ID_REGEX = /^[a-zA-Z0-9_-]{1,48}$/;
const TRANSFER_CODE_TTL_SEC = 30 * 24 * 60 * 60; // 30 days max validity
const MAX_ROLE_OVERRIDES = 200;
const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// Ephemeral CSPRNG fallback when TRANSFER_SIGNING_SECRET is not set in environment.
// Never hardcoded and never exposed to the client.
const TRANSFER_HMAC_SECRET: Buffer = process.env.TRANSFER_SIGNING_SECRET
  ? Buffer.from(process.env.TRANSFER_SIGNING_SECRET, 'utf8')
  : crypto.randomBytes(32);

type UserRole = 'learner' | 'instructor' | 'admin';

interface VerifiedAuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  name: string;
  role: UserRole;
  authTime: number;
  expiresAt: number;
  issuer: string;
}

interface AuthenticatedRequest extends Request {
  authUser?: VerifiedAuthUser;
  spoofAttempts?: string[];
}

interface ServerAuditEvent {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  actorUid: string;
  actorRole: UserRole | 'anonymous';
  decision: 'ALLOW' | 'DENY';
  statusCode: number;
  reason: string;
  spoofDetected: boolean;
}

interface TransferPayload {
  name: string;
  completedIslands: number[];
  starsByIsland: Record<number, number>;
  quizBonusXp: number;
  solvedDebugIds: string[];
  extraBonusXp: number;
}

const serverRoleOverrides = new Map<string, { role: UserRole; assignedBy: string; updatedAt: string }>();
const auditRingBuffer: ServerAuditEvent[] = [];
const MAX_AUDIT_EVENTS = 60;

function recordAuditEvent(event: Omit<ServerAuditEvent, 'id' | 'timestamp'>): void {
  auditRingBuffer.unshift({
    id: `AUD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    timestamp: new Date().toISOString(),
    ...event,
  });
  if (auditRingBuffer.length > MAX_AUDIT_EVENTS) {
    auditRingBuffer.length = MAX_AUDIT_EVENTS;
  }
}

// Cache for Google's official Firebase Auth X.509 public certificates
let cachedCerts: Record<string, string> | null = null;
let cachedCertsExpiresAt = 0;

const GOOGLE_CERTS_TIMEOUT_MS = 5000;

async function getGoogleFirebaseCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedCerts && now < cachedCertsExpiresAt) {
    return cachedCerts;
  }
  const response = await fetch(GOOGLE_CERTS_URL, {
    signal: AbortSignal.timeout(GOOGLE_CERTS_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error('CERT_FETCH_FAILED');
  }
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const ttlSec = maxAgeMatch ? Math.min(21600, Math.max(60, Number(maxAgeMatch[1]))) : 3600;
  const rawCerts = (await response.json()) as unknown;
  if (!rawCerts || typeof rawCerts !== 'object' || Array.isArray(rawCerts)) {
    throw new Error('CERT_RESPONSE_INVALID');
  }
  const safeCerts: Record<string, string> = Object.create(null);
  for (const [kid, pem] of Object.entries(rawCerts as Record<string, unknown>)) {
    if (KID_REGEX.test(kid) && !FORBIDDEN_OBJECT_KEYS.has(kid) && typeof pem === 'string') {
      safeCerts[kid] = pem;
    }
  }
  cachedCerts = safeCerts;
  cachedCertsExpiresAt = now + ttlSec * 1000;
  return safeCerts;
}

function decodeBase64UrlJson<T>(segment: string): T {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const buf = Buffer.from(padded, 'base64');
  return JSON.parse(buf.toString('utf8')) as T;
}

interface FirebaseJwtHeader {
  alg?: string;
  kid?: string;
  typ?: string;
}

interface FirebaseJwtPayload {
  iss?: string;
  aud?: string;
  sub?: string;
  uid?: string;
  user_id?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  iat?: number;
  exp?: number;
  auth_time?: number;
}

async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedAuthUser> {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('MALFORMED_TOKEN');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = decodeBase64UrlJson<FirebaseJwtHeader>(headerB64);

  // Strictly require RS256 and a safe key ID to prevent alg confusion or prototype lookups
  if (
    header.alg !== 'RS256' ||
    typeof header.kid !== 'string' ||
    !KID_REGEX.test(header.kid) ||
    FORBIDDEN_OBJECT_KEYS.has(header.kid)
  ) {
    throw new Error('INVALID_TOKEN_ALGORITHM');
  }

  const certs = await getGoogleFirebaseCerts();
  let certPem = Object.prototype.hasOwnProperty.call(certs, header.kid) ? certs[header.kid] : undefined;
  if (typeof certPem !== 'string' || !certPem) {
    // Force refresh once in case Google rotated keys
    cachedCertsExpiresAt = 0;
    const refreshedCerts = await getGoogleFirebaseCerts();
    certPem = Object.prototype.hasOwnProperty.call(refreshedCerts, header.kid)
      ? refreshedCerts[header.kid]
      : undefined;
    if (typeof certPem !== 'string' || !certPem) {
      throw new Error('UNKNOWN_KEY_ID');
    }
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  const sigBuf = Buffer.from(signatureB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  if (!verifier.verify(certPem, sigBuf)) {
    throw new Error('INVALID_SIGNATURE');
  }

  const payload = decodeBase64UrlJson<FirebaseJwtPayload>(payloadB64);
  const nowSec = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;

  if (payload.iss !== expectedIssuer) {
    throw new Error('INVALID_ISSUER');
  }
  if (payload.aud !== FIREBASE_PROJECT_ID) {
    throw new Error('INVALID_AUDIENCE');
  }
  if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp) || payload.exp <= nowSec) {
    throw new Error('TOKEN_EXPIRED');
  }
  if (typeof payload.iat !== 'number' || !Number.isFinite(payload.iat) || payload.iat > nowSec + 60) {
    throw new Error('TOKEN_FUTURE_IAT');
  }
  if (
    typeof payload.auth_time === 'number' &&
    (!Number.isFinite(payload.auth_time) || payload.auth_time > nowSec + 60)
  ) {
    throw new Error('INVALID_AUTH_TIME');
  }
  if (typeof payload.sub !== 'string' || !UID_REGEX.test(payload.sub)) {
    throw new Error('INVALID_SUBJECT');
  }
  if (typeof payload.user_id === 'string' && payload.user_id !== payload.sub) {
    throw new Error('SUBJECT_MISMATCH');
  }
  if (payload.email_verified !== true || typeof payload.email !== 'string') {
    throw new Error('EMAIL_NOT_VERIFIED');
  }

  const emailLower = payload.email.toLowerCase();
  let role: UserRole = 'learner';
  if (emailLower === BOOTSTRAP_ADMIN_EMAIL) {
    role = 'admin';
  } else {
    const serverGrant = serverRoleOverrides.get(payload.sub);
    if (serverGrant) {
      role = serverGrant.role;
    }
  }

  return {
    uid: payload.sub,
    email: payload.email,
    emailVerified: true,
    name: typeof payload.name === 'string' && payload.name.trim() ? payload.name.slice(0, 48) : 'Apprenant',
    role,
    authTime: typeof payload.auth_time === 'number' ? payload.auth_time : payload.iat,
    expiresAt: payload.exp,
    issuer: expectedIssuer,
  };
}

function detectClientRoleSpoofing(req: Request): string[] {
  const suspicious: string[] = [];
  if (req.headers['x-user-role']) suspicious.push(`Header x-user-role=${String(req.headers['x-user-role']).slice(0, 32)}`);
  if (req.headers['x-admin']) suspicious.push(`Header x-admin=${String(req.headers['x-admin']).slice(0, 32)}`);
  if (req.headers['x-role']) suspicious.push(`Header x-role=${String(req.headers['x-role']).slice(0, 32)}`);
  if (typeof req.query.isAdmin !== 'undefined') suspicious.push(`Query isAdmin=${String(req.query.isAdmin).slice(0, 16)}`);
  if (typeof req.query.role !== 'undefined') suspicious.push(`Query role=${String(req.query.role).slice(0, 24)}`);
  if (req.body && typeof req.body === 'object') {
    const b = req.body as Record<string, unknown>;
    if (typeof b.isAdmin !== 'undefined') suspicious.push('Body isAdmin');
    if (typeof b.bypassAuth !== 'undefined') suspicious.push('Body bypassAuth');
  }
  return suspicious;
}

async function requireFirebaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const spoofAttempts = detectClientRoleSpoofing(req);
  req.spoofAttempts = spoofAttempts;

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    recordAuditEvent({
      method: req.method,
      path: req.path,
      actorUid: 'anonymous',
      actorRole: 'anonymous',
      decision: 'DENY',
      statusCode: 401,
      reason: 'Missing Bearer Firebase ID token (server auth gate)',
      spoofDetected: spoofAttempts.length > 0,
    });
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentification requise : aucun jeton Firebase Bearer valide fourni au serveur.',
      enforcedBy: 'server-middleware:requireFirebaseAuth',
      spoofAttemptsIgnored: spoofAttempts,
    });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token || token.length > 8192) {
    recordAuditEvent({
      method: req.method,
      path: req.path,
      actorUid: 'anonymous',
      actorRole: 'anonymous',
      decision: 'DENY',
      statusCode: 401,
      reason: 'Invalid token format or length',
      spoofDetected: spoofAttempts.length > 0,
    });
    res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Jeton d’authentification mal formé.',
      enforcedBy: 'server-middleware:requireFirebaseAuth',
      spoofAttemptsIgnored: spoofAttempts,
    });
    return;
  }

  const SAFE_AUTH_ERROR_CODES = new Set([
    'MALFORMED_TOKEN',
    'INVALID_TOKEN_ALGORITHM',
    'UNKNOWN_KEY_ID',
    'INVALID_SIGNATURE',
    'INVALID_ISSUER',
    'INVALID_AUDIENCE',
    'TOKEN_EXPIRED',
    'TOKEN_FUTURE_IAT',
    'INVALID_AUTH_TIME',
    'INVALID_SUBJECT',
    'SUBJECT_MISMATCH',
    'EMAIL_NOT_VERIFIED',
    'CERT_FETCH_FAILED',
    'CERT_RESPONSE_INVALID',
  ]);

  try {
    const verifiedUser = await verifyFirebaseIdToken(token);
    req.authUser = verifiedUser;
    next();
  } catch (err) {
    const rawCode = err instanceof Error ? err.message : '';
    const code = SAFE_AUTH_ERROR_CODES.has(rawCode) ? rawCode : 'TOKEN_VERIFICATION_FAILED';
    recordAuditEvent({
      method: req.method,
      path: req.path,
      actorUid: 'unverified',
      actorRole: 'anonymous',
      decision: 'DENY',
      statusCode: 401,
      reason: `Firebase JWT verification failed (${code})`,
      spoofDetected: spoofAttempts.length > 0,
    });
    res.status(401).json({
      error: code,
      message: 'Jeton Firebase rejeté par vérification cryptographique RS256 côté serveur.',
      enforcedBy: 'server-middleware:requireFirebaseAuth',
      spoofAttemptsIgnored: spoofAttempts,
    });
  }
}

function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.authUser;
    const spoofAttempts = req.spoofAttempts ?? [];
    if (!user) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Contexte utilisateur vérifié absent.',
        enforcedBy: 'server-middleware:requireRole',
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      recordAuditEvent({
        method: req.method,
        path: req.path,
        actorUid: user.uid,
        actorRole: user.role,
        decision: 'DENY',
        statusCode: 403,
        reason: `Role '${user.role}' denied; required one of [${allowedRoles.join(', ')}]`,
        spoofDetected: spoofAttempts.length > 0,
      });
      res.status(403).json({
        error: 'FORBIDDEN_INSUFFICIENT_ROLE',
        message: `Accès refusé côté serveur : votre rôle vérifié est "${user.role}" (requis : ${allowedRoles.join(' ou ')}).`,
        enforcedBy: 'server-middleware:requireRole',
        callerRole: user.role,
        requiredRoles: allowedRoles,
        spoofAttemptsIgnored: spoofAttempts,
      });
      return;
    }

    next();
  };
}

function sanitizeTransferPayload(input: unknown): TransferPayload | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  if (!Array.isArray(raw.completedIslands)) return null;

  const cleanName =
    typeof raw.name === 'string' && raw.name.trim()
      ? raw.name.trim().slice(0, 48)
      : 'Élève Cyberland';

  const cleanIslands = Array.from(
    new Set(
      raw.completedIslands
        .filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 35)
    )
  )
    .sort((a, b) => a - b)
    .slice(0, 35);

  const cleanStars: Record<number, number> = {};
  if (raw.starsByIsland && typeof raw.starsByIsland === 'object') {
    for (const [k, v] of Object.entries(raw.starsByIsland as Record<string, unknown>)) {
      const id = Number(k);
      if (Number.isInteger(id) && id >= 1 && id <= 35 && typeof v === 'number' && Number.isInteger(v)) {
        cleanStars[id] = Math.max(0, Math.min(3, v));
      }
    }
  }

  const cleanDebugIds = Array.isArray(raw.solvedDebugIds)
    ? Array.from(
        new Set(
          raw.solvedDebugIds.filter(
            (id): id is string => typeof id === 'string' && DEBUG_ID_REGEX.test(id)
          )
        )
      ).slice(0, 30)
    : [];

  const quizBonusXp =
    typeof raw.quizBonusXp === 'number' && Number.isFinite(raw.quizBonusXp)
      ? Math.max(0, Math.min(15000, Math.round(raw.quizBonusXp)))
      : 0;

  const extraBonusXp =
    typeof raw.extraBonusXp === 'number' && Number.isFinite(raw.extraBonusXp)
      ? Math.max(0, Math.min(8000, Math.round(raw.extraBonusXp)))
      : 0;

  return {
    name: cleanName,
    completedIslands: cleanIslands,
    starsByIsland: cleanStars,
    quizBonusXp,
    solvedDebugIds: cleanDebugIds,
    extraBonusXp,
  };
}

function signTransferCode(payload: TransferPayload, ownerUid: string): string {
  const envelope = {
    v: 2,
    uid: ownerUid,
    iat: Math.floor(Date.now() / 1000),
    data: payload,
  };
  const payloadB64 = Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', TRANSFER_HMAC_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `GEM2.${payloadB64}.${sig}`;
}

function verifySignedTransferCode(
  code: string
): { ok: true; payload: TransferPayload; signedByUid: string; issuedAt: number } | { ok: false; error: string } {
  const trimmed = code.trim();
  const segments = trimmed.split('.');
  if (segments.length !== 3 || segments[0] !== 'GEM2') {
    return { ok: false, error: 'FORMAT_INVALID_UNSIGNED' };
  }
  const [, payloadB64, providedSig] = segments;
  if (!payloadB64 || !providedSig || payloadB64.length > 8192 || providedSig.length > 128) {
    return { ok: false, error: 'PAYLOAD_OUT_OF_BOUNDS' };
  }

  const expectedSig = crypto
    .createHmac('sha256', TRANSFER_HMAC_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const providedBuf = Buffer.from(providedSig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return { ok: false, error: 'INVALID_HMAC_SIGNATURE' };
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      v?: unknown;
      uid?: unknown;
      iat?: unknown;
      data?: unknown;
    };
    const nowSec = Math.floor(Date.now() / 1000);
    if (parsed.v !== 2) {
      return { ok: false, error: 'UNSUPPORTED_TRANSFER_VERSION' };
    }
    if (typeof parsed.iat !== 'number' || !Number.isInteger(parsed.iat) || parsed.iat <= 0) {
      return { ok: false, error: 'INVALID_ISSUED_AT' };
    }
    if (parsed.iat > nowSec + 60) {
      return { ok: false, error: 'TRANSFER_CODE_FUTURE_IAT' };
    }
    if (nowSec - parsed.iat > TRANSFER_CODE_TTL_SEC) {
      return { ok: false, error: 'TRANSFER_CODE_EXPIRED' };
    }
    const sanitized = sanitizeTransferPayload(parsed.data);
    if (!sanitized || typeof parsed.uid !== 'string' || !UID_REGEX.test(parsed.uid)) {
      return { ok: false, error: 'SCHEMA_VALIDATION_FAILED' };
    }
    return {
      ok: true,
      payload: sanitized,
      signedByUid: parsed.uid,
      issuedAt: parsed.iat,
    };
  } catch {
    return { ok: false, error: 'MALFORMED_JSON' };
  }
}

function getPermissionsForRole(role: UserRole): string[] {
  if (role === 'admin') {
    return [
      'progress:read:own',
      'progress:write:own',
      'profile:read:any',
      'transfer:sign',
      'instructor:roster:read',
      'admin:audit:read',
      'admin:roles:manage',
      'firestore:vault:read_write',
    ];
  }
  if (role === 'instructor') {
    return [
      'progress:read:own',
      'progress:write:own',
      'transfer:sign',
      'instructor:roster:read',
    ];
  }
  return ['progress:read:own', 'progress:write:own', 'transfer:sign'];
}

async function startServer(): Promise<void> {
  const app = express();
  const PORT = 3000;

  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  // Defensive security headers (compatible with AI Studio iframe embedding — never set X-Frame-Options)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Prevent browser/proxy caching of sensitive API responses
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    next();
  });

  // Bounded in-memory per-IP rate limiter to prevent brute-force, CPU exhaustion, and audit log flooding
  const MAX_TRACKED_RATE_KEYS = 2000;
  function createRateLimiter(maxRequests: number, windowMs: number, bucketName: string) {
    const hits = new Map<string, { count: number; resetAt: number }>();
    return (req: Request, res: Response, next: NextFunction): void => {
      const now = Date.now();
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `${bucketName}:${ip}`;

      if (hits.size >= MAX_TRACKED_RATE_KEYS && !hits.has(key)) {
        for (const [k, entry] of hits) {
          if (entry.resetAt <= now) hits.delete(k);
        }
        if (hits.size >= MAX_TRACKED_RATE_KEYS) {
          const oldestKey = hits.keys().next().value;
          if (oldestKey) hits.delete(oldestKey);
        }
      }

      const current = hits.get(key);
      if (!current || current.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        next();
        return;
      }

      if (current.count >= maxRequests) {
        const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
        res.setHeader('Retry-After', String(retryAfterSec));
        res.status(429).json({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Trop de requêtes sur cette route API. Veuillez patienter quelques secondes.',
          retryAfterSec,
          enforcedBy: `server-middleware:rateLimit(${bucketName})`,
        });
        return;
      }

      current.count += 1;
      next();
    };
  }

  app.use('/api', createRateLimiter(120, 60_000, 'api-global'));
  const sensitiveRouteLimiter = createRateLimiter(30, 60_000, 'api-sensitive');

  // Public non-sensitive policy summary (no PII, no secrets)
  app.get('/api/security/policy', (_req, res) => {
    res.json({
      architecture: 'Defense-in-Depth (Server RS256 AuthZ + Firestore Security Rules)',
      tokenVerification: 'RS256 against Google Firebase X.509 certificates',
      firebaseProjectId: FIREBASE_PROJECT_ID,
      firestoreProtectedCollections: [
        '/user_progress/{userId} (Owner + Admin get, list denied)',
        '/leaderboard/{userId} (PII-free, list restricted to isPublic == true)',
        '/roles/{userId} (Admin-only writes, prevents self-escalation)',
        '/protected_admin_vault/{docId} (Strict Admin-only get/write, list denied)',
        '/security_audit_logs/{logId} (Admin-only append-only immutable log)',
      ],
      serverProtectedRoutes: [
        'GET /api/auth/whoami (requireFirebaseAuth)',
        'GET /api/user/profile/:targetUid (requireFirebaseAuth + ownership/admin IDOR guard)',
        'GET /api/instructor/roster-summary (requireFirebaseAuth + requireRole(admin, instructor))',
        'GET /api/admin/audit-overview (requireFirebaseAuth + requireRole(admin))',
        'POST /api/admin/roles (requireFirebaseAuth + requireRole(admin))',
        'POST /api/transfer/sign (requireFirebaseAuth + HMAC-SHA256)',
        'POST /api/transfer/verify (HMAC-SHA256 timingSafeEqual + server schema clamp)',
      ],
    });
  });

  // 1. Server-verified identity & role introspection
  app.get('/api/auth/whoami', requireFirebaseAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.authUser!;
    const spoofAttempts = req.spoofAttempts ?? [];
    recordAuditEvent({
      method: req.method,
      path: req.path,
      actorUid: user.uid,
      actorRole: user.role,
      decision: 'ALLOW',
      statusCode: 200,
      reason: 'Firebase ID token cryptographically verified via RS256',
      spoofDetected: spoofAttempts.length > 0,
    });
    res.json({
      verified: true,
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      role: user.role,
      permissions: getPermissionsForRole(user.role),
      issuer: user.issuer,
      expiresAt: new Date(user.expiresAt * 1000).toISOString(),
      enforcedBy: 'server-middleware:requireFirebaseAuth',
      spoofAttemptsIgnored: spoofAttempts,
    });
  });

  // 2. Ownership-protected profile endpoint (blocks horizontal IDOR)
  app.get(
    '/api/user/profile/:targetUid',
    requireFirebaseAuth,
    (req: AuthenticatedRequest, res: Response) => {
      const user = req.authUser!;
      const targetUid = String(req.params.targetUid || '');
      const spoofAttempts = req.spoofAttempts ?? [];

      if (!UID_REGEX.test(targetUid)) {
        recordAuditEvent({
          method: req.method,
          path: req.path,
          actorUid: user.uid,
          actorRole: user.role,
          decision: 'DENY',
          statusCode: 400,
          reason: 'Invalid targetUid format',
          spoofDetected: spoofAttempts.length > 0,
        });
        res.status(400).json({
          error: 'INVALID_TARGET_UID',
          message: 'Identifiant cible invalide.',
          enforcedBy: 'server-route:ownership-guard',
        });
        return;
      }

      if (user.uid !== targetUid && user.role !== 'admin') {
        recordAuditEvent({
          method: req.method,
          path: req.path,
          actorUid: user.uid,
          actorRole: user.role,
          decision: 'DENY',
          statusCode: 403,
          reason: `IDOR blocked: caller ${user.uid} attempted to read ${targetUid}`,
          spoofDetected: spoofAttempts.length > 0,
        });
        res.status(403).json({
          error: 'FORBIDDEN_IDOR_BLOCKED',
          message: `Accès refusé côté serveur : vous ne pouvez pas consulter le profil privé de "${targetUid}" (contrôle d'appartenance UID).`,
          enforcedBy: 'server-route:ownership-guard',
          callerUid: user.uid,
          targetUid,
          spoofAttemptsIgnored: spoofAttempts,
        });
        return;
      }

      recordAuditEvent({
        method: req.method,
        path: req.path,
        actorUid: user.uid,
        actorRole: user.role,
        decision: 'ALLOW',
        statusCode: 200,
        reason: user.uid === targetUid ? 'Owner verified' : 'Admin override verified',
        spoofDetected: spoofAttempts.length > 0,
      });

      res.json({
        ok: true,
        targetUid,
        accessBasis: user.uid === targetUid ? 'RESOURCE_OWNER' : 'VERIFIED_ADMIN',
        enforcedBy: 'server-route:ownership-guard',
        spoofAttemptsIgnored: spoofAttempts,
      });
    }
  );

  // 3. Instructor & Admin protected route
  app.get(
    '/api/instructor/roster-summary',
    requireFirebaseAuth,
    requireRole('admin', 'instructor'),
    (req: AuthenticatedRequest, res: Response) => {
      const user = req.authUser!;
      recordAuditEvent({
        method: req.method,
        path: req.path,
        actorUid: user.uid,
        actorRole: user.role,
        decision: 'ALLOW',
        statusCode: 200,
        reason: `Instructor/Admin role '${user.role}' verified server-side`,
        spoofDetected: (req.spoofAttempts ?? []).length > 0,
      });
      res.json({
        authorized: true,
        role: user.role,
        signedTransferRequired: true,
        enforcedBy: 'server-middleware:requireRole(admin,instructor)',
        capabilities: [
          'Vérification cryptographique HMAC-SHA256 des codes de transfert élèves',
          'Export CSV de classe autorisé côté serveur',
          'Contrôle d’intégrité des bornes XP et étoiles',
        ],
      });
    }
  );

  // 4. Strictly Admin-only audit & governance overview
  app.get(
    '/api/admin/audit-overview',
    requireFirebaseAuth,
    requireRole('admin'),
    (req: AuthenticatedRequest, res: Response) => {
      const user = req.authUser!;
      recordAuditEvent({
        method: req.method,
        path: req.path,
        actorUid: user.uid,
        actorRole: user.role,
        decision: 'ALLOW',
        statusCode: 200,
        reason: 'Verified admin accessed live server authorization audit log',
        spoofDetected: (req.spoofAttempts ?? []).length > 0,
      });

      const deniedCount = auditRingBuffer.filter((e) => e.decision === 'DENY').length;
      const spoofCount = auditRingBuffer.filter((e) => e.spoofDetected).length;

      res.json({
        authorized: true,
        adminEmail: user.email,
        enforcedBy: 'server-middleware:requireRole(admin)',
        stats: {
          totalAuditedRequests: auditRingBuffer.length,
          blockedRequests: deniedCount,
          spoofAttemptsBlocked: spoofCount,
          activeServerRoleGrants: serverRoleOverrides.size,
        },
        roleGrants: Array.from(serverRoleOverrides.entries()).map(([uid, info]) => ({
          uid,
          ...info,
        })),
        recentDecisions: auditRingBuffer.slice(0, 20),
      });
    }
  );

  // 5. Strictly Admin-only server role grant synchronization
  app.post(
    '/api/admin/roles',
    sensitiveRouteLimiter,
    requireFirebaseAuth,
    requireRole('admin'),
    (req: AuthenticatedRequest, res: Response) => {
      const user = req.authUser!;
      const body = (req.body ?? {}) as { targetUid?: unknown; role?: unknown };
      const targetUid = typeof body.targetUid === 'string' ? body.targetUid.trim() : '';
      const role = body.role;

      if (!UID_REGEX.test(targetUid) || FORBIDDEN_OBJECT_KEYS.has(targetUid)) {
        res.status(400).json({
          error: 'INVALID_TARGET_UID',
          message: 'UID cible invalide (alphanumérique, tirets et underscores uniquement).',
        });
        return;
      }

      if (targetUid === user.uid) {
        res.status(400).json({
          error: 'CANNOT_MODIFY_SELF_ROLE',
          message: 'Modification de votre propre rôle interdite depuis cette route.',
        });
        return;
      }

      if (role !== 'learner' && role !== 'instructor' && role !== 'admin') {
        res.status(400).json({
          error: 'INVALID_ROLE',
          message: 'Rôle autorisé : learner, instructor ou admin.',
        });
        return;
      }

      const updatedAt = new Date().toISOString();
      if (role === 'learner') {
        serverRoleOverrides.delete(targetUid);
      } else {
        if (!serverRoleOverrides.has(targetUid) && serverRoleOverrides.size >= MAX_ROLE_OVERRIDES) {
          res.status(429).json({
            error: 'ROLE_REGISTRY_CAPACITY_REACHED',
            message: 'Capacité maximale du registre de rôles serveur atteinte.',
          });
          return;
        }
        serverRoleOverrides.set(targetUid, {
          role,
          assignedBy: user.uid,
          updatedAt,
        });
      }

      recordAuditEvent({
        method: req.method,
        path: req.path,
        actorUid: user.uid,
        actorRole: user.role,
        decision: 'ALLOW',
        statusCode: 200,
        reason: `Admin set server role '${role}' for ${targetUid}`,
        spoofDetected: false,
      });

      res.json({
        ok: true,
        targetUid,
        role,
        assignedBy: user.uid,
        updatedAt,
        enforcedBy: 'server-middleware:requireRole(admin)',
      });
    }
  );

  // 6. Server-signed progress transfer code (prevents base64 XP tampering)
  app.post(
    '/api/transfer/sign',
    requireFirebaseAuth,
    (req: AuthenticatedRequest, res: Response) => {
      const user = req.authUser!;
      const sanitized = sanitizeTransferPayload(req.body?.progress ?? req.body);
      if (!sanitized) {
        res.status(400).json({
          error: 'INVALID_PROGRESS_PAYLOAD',
          message: 'Format de progression invalide pour la signature serveur.',
        });
        return;
      }

      const signedCode = signTransferCode(sanitized, user.uid);
      recordAuditEvent({
        method: req.method,
        path: req.path,
        actorUid: user.uid,
        actorRole: user.role,
        decision: 'ALLOW',
        statusCode: 200,
        reason: 'Signed progress transfer payload with server HMAC-SHA256',
        spoofDetected: false,
      });

      res.json({
        ok: true,
        code: signedCode,
        algorithm: 'HMAC-SHA256',
        signedByUid: user.uid,
      });
    }
  );

  // 7. Server-side cryptographic verification of signed transfer codes
  app.post('/api/transfer/verify', sensitiveRouteLimiter, (req: Request, res: Response) => {
    const code = typeof req.body?.code === 'string' ? req.body.code : '';
    const result = verifySignedTransferCode(code);
    if (!result.ok) {
      recordAuditEvent({
        method: req.method,
        path: req.path,
        actorUid: 'caller',
        actorRole: 'anonymous',
        decision: 'DENY',
        statusCode: 403,
        reason: `Transfer code rejected (${result.error})`,
        spoofDetected: true,
      });
      res.status(403).json({
        ok: false,
        error: result.error,
        message:
          result.error === 'INVALID_HMAC_SIGNATURE'
            ? 'Signature cryptographique HMAC-SHA256 invalide : le code a été modifié ou falsifié.'
            : result.error === 'TRANSFER_CODE_EXPIRED'
              ? 'Ce code de transfert signé a expiré (validité maximale : 30 jours).'
              : 'Code non signé ou invalide (format GEM2.<payload>.<hmac> requis).',
        enforcedBy: 'server-crypto:HMAC-SHA256',
      });
      return;
    }

    recordAuditEvent({
      method: req.method,
      path: req.path,
      actorUid: result.signedByUid,
      actorRole: 'learner',
      decision: 'ALLOW',
      statusCode: 200,
      reason: 'HMAC-SHA256 transfer signature verified server-side',
      spoofDetected: false,
    });

    res.json({
      ok: true,
      verified: true,
      signedByUid: result.signedByUid,
      issuedAt: result.issuedAt,
      progress: result.payload,
      enforcedBy: 'server-crypto:HMAC-SHA256',
    });
  });

  // Catch-all for unknown /api/* routes (never fall through to SPA HTML)
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API_NOT_FOUND', message: 'Route API introuvable.' });
  });

  // Dev Vite middleware vs Production static serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cyberland secure server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
