/**
 * Server-side idempotency helper.
 *
 * Usage: call `checkIdempotency` at the start of a mutating API route.
 * If the key was already used and succeeded, returns the cached response.
 * Otherwise returns null → the handler must process normally and call
 * `storeIdempotencyResult` at the end.
 *
 * Keys expire after IDEMPOTENCY_TTL_MS (24 h).
 */

import { adminDb } from '@/lib/firebase-admin';
import { IDEMPOTENCY_HEADER, IDEMPOTENCY_TTL_MS } from '@/shared/lib/constants';
import type { NextRequest } from 'next/server';

const COLLECTION = 'idempotency_keys';

export function getIdempotencyKey(req: NextRequest): string | null {
  return req.headers.get(IDEMPOTENCY_HEADER) ?? null;
}

export async function checkIdempotency(
  key: string,
  userId: string,
): Promise<{ status: number; body: unknown } | null> {
  const docRef = adminDb.collection(COLLECTION).doc(`${userId}:${key}`);
  const snap = await docRef.get();

  if (!snap.exists) return null;

  const data = snap.data()!;

  // Expired → treat as new request
  const createdAt = data.createdAt?.toMillis?.() ?? 0;
  if (Date.now() - createdAt > IDEMPOTENCY_TTL_MS) return null;

  // In-progress (concurrent duplicate) — return 409
  if (data.state === 'processing') {
    return { status: 409, body: { error: 'Solicitud duplicada en progreso. Intenta de nuevo en unos segundos.' } };
  }

  // Completed — replay cached response
  return { status: data.responseStatus, body: data.responseBody };
}

export async function markIdempotencyProcessing(
  key: string,
  userId: string,
): Promise<void> {
  await adminDb.collection(COLLECTION).doc(`${userId}:${key}`).set({
    state: 'processing',
    userId,
    createdAt: new Date(),
  });
}

export async function storeIdempotencyResult(
  key: string,
  userId: string,
  responseStatus: number,
  responseBody: unknown,
): Promise<void> {
  await adminDb.collection(COLLECTION).doc(`${userId}:${key}`).set({
    state: 'completed',
    userId,
    responseStatus,
    responseBody,
    createdAt: new Date(),
    completedAt: new Date(),
  });
}
