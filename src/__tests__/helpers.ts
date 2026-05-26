/**
 * Test helpers — shared utilities for building mock requests and Firestore stubs.
 */
import { NextRequest } from 'next/server';

// ── Request builders ───────────────────────────────────────────────────────

export function makeRequest(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {},
): NextRequest {
  const url = new URL(path, 'http://localhost:3000');
  if (options.searchParams) {
    for (const [k, v] of Object.entries(options.searchParams)) {
      url.searchParams.set(k, v);
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return new NextRequest(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

export function makeAuthRequest(
  path: string,
  token: string,
  options: {
    method?: string;
    body?: unknown;
    searchParams?: Record<string, string>;
  } = {},
): NextRequest {
  return makeRequest(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Firestore doc stub builders ────────────────────────────────────────────

export function firestoreDoc(data: Record<string, unknown> | null): {
  exists: boolean;
  data: () => Record<string, unknown> | undefined;
  id: string;
} {
  return {
    exists: data !== null,
    data: () => data ?? undefined,
    id: data ? (data.id as string) ?? 'doc-id' : '',
  };
}

export function firestoreQueryResult(docs: Record<string, unknown>[]): {
  empty: boolean;
  size: number;
  docs: ReturnType<typeof firestoreDoc>[];
} {
  const mapped = docs.map(d => firestoreDoc(d));
  return { empty: docs.length === 0, size: docs.length, docs: mapped };
}

// ── Common mock data ───────────────────────────────────────────────────────

export const SUPER_ADMIN_TOKEN = 'token-super-admin';
export const ADMIN_TOKEN = 'token-admin';
export const USER_TOKEN = 'token-user';
export const OTHER_USER_TOKEN = 'token-other-user';

export const SUPER_ADMIN_UID = 'uid-super-admin';
export const ADMIN_UID = 'uid-admin';
export const USER_UID = 'uid-user';
export const OTHER_USER_UID = 'uid-other-user';

export const PAID_COURSE_SLUG = 'rcp-basico';
export const FREE_COURSE_SLUG = 'primeros-auxilios-gratis';

export const APPROVED_TX_ID = 'tx-approved-123';
export const PENDING_TX_ID = 'tx-pending-456';
export const OTHER_USER_TX_ID = 'tx-other-user-789';
