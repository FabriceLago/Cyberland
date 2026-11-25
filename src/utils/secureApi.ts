import { auth } from '../firebase';

export type ServerUserRole = 'learner' | 'instructor' | 'admin';

export interface ServerWhoAmIResponse {
  verified: boolean;
  uid: string;
  email: string;
  emailVerified: boolean;
  name: string;
  role: ServerUserRole;
  permissions: string[];
  issuer: string;
  expiresAt: string;
  enforcedBy: string;
  spoofAttemptsIgnored: string[];
}

export interface ServerAuditEventDto {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  actorUid: string;
  actorRole: ServerUserRole | 'anonymous';
  decision: 'ALLOW' | 'DENY';
  statusCode: number;
  reason: string;
  spoofDetected: boolean;
}

export interface ServerAdminAuditOverview {
  authorized: boolean;
  adminEmail: string;
  enforcedBy: string;
  stats: {
    totalAuditedRequests: number;
    blockedRequests: number;
    spoofAttemptsBlocked: number;
    activeServerRoleGrants: number;
  };
  roleGrants: {
    uid: string;
    role: ServerUserRole;
    assignedBy: string;
    updatedAt: string;
  }[];
  recentDecisions: ServerAuditEventDto[];
}

export async function getFreshIdToken(): Promise<string | null> {
  const current = auth.currentUser;
  if (!current) return null;
  try {
    return await current.getIdToken();
  } catch {
    return null;
  }
}

export interface ApiCallResult<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  latencyMs: number;
  data: T;
}

export async function callSecureApi<T = Record<string, unknown>>(
  url: string,
  options: {
    method?: 'GET' | 'POST';
    body?: unknown;
    includeAuth?: boolean;
    extraHeaders?: Record<string, string>;
  } = {}
): Promise<ApiCallResult<T>> {
  const { method = 'GET', body, includeAuth = true, extraHeaders = {} } = options;
  const headers: Record<string, string> = {
    ...extraHeaders,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (includeAuth) {
    const token = await getFreshIdToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const startedAt = performance.now();
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const latencyMs = Math.max(1, Math.round(performance.now() - startedAt));

  let data: unknown = {};
  try {
    data = await res.json();
  } catch {
    data = { message: res.statusText };
  }

  return {
    ok: res.ok,
    status: res.status,
    latencyMs,
    data: data as T,
  };
}
