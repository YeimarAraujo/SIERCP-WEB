/**
 * Distributed rate limiter — fixed-window counter backed by Firestore.
 *
 * Unlike an in-memory Map, this implementation is shared across all serverless
 * function instances, preventing per-instance bypass in multi-replica deploys.
 *
 * Design: fixed window keyed as `{action}:{ip}:{windowNumber}` where
 * windowNumber = Math.floor(Date.now() / windowMs).
 * A Firestore transaction reads the current count and increments atomically.
 * On Firestore failure, the limiter fails-open (allows the request) and logs
 * an error — a payment gateway outage should not block legitimate users.
 *
 * Documents expire after 2× windowMs (via `expiresAt` field; TTL policy
 * can be configured in Firebase Console → Firestore → TTL).
 */

import { adminDb } from '@/lib/firebase-admin';

// Fallback en memoria para cuando Firestore no está disponible.
// No es distribuido (cada instancia tiene su propio contador), pero es
// fail-closed: bloquea en lugar de abrir cuando Firestore falla.
const _memoryCounters = new Map<string, { count: number; resetAt: number }>();

function _memoryFallback(
  key: string,
  max: number,
  windowMs: number,
  now: number,
  windowEnd: number,
): RateLimitResult {
  const entry = _memoryCounters.get(key);
  if (!entry || entry.resetAt <= now) {
    _memoryCounters.set(key, { count: 1, resetAt: windowEnd });
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
  }
  if (entry.count >= max) {
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, entry.resetAt - now) };
  }
  entry.count++;
  return { allowed: true, remaining: max - entry.count, retryAfterMs: 0 };
}

export interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  max: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Milliseconds until the client may retry (0 when allowed) */
  retryAfterMs: number;
}

export const rateLimiter = {
  async check(key: string, opts: RateLimitOptions): Promise<RateLimitResult> {
    const { max, windowMs } = opts;
    const now = Date.now();
    const windowKey = Math.floor(now / windowMs);
    const windowEnd = (windowKey + 1) * windowMs;

    // En desarrollo NO tocamos Firestore: una sola instancia local no necesita
    // un contador distribuido, y la transacción (1 lectura + 1 escritura) en
    // cada request quema la cuota gratuita (Spark). Eso era lo que agotaba la
    // cuota → login lento (RESOURCE_EXHAUSTED) y KPIs del super-admin en 0.
    if (process.env.NODE_ENV !== 'production') {
        return _memoryFallback(key, max, windowMs, now, windowEnd);
    }

    // Sanitize the key so it is safe as a Firestore document ID
    const safeKey = key.replace(/[^a-zA-Z0-9_\-:.]/g, '_');
    const docId = `${safeKey}:${windowKey}`;
    const docRef = adminDb.collection('rate_limits').doc(docId);

    try {
      const result = await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);
        const current: number = snap.exists ? (snap.data()!.count ?? 0) : 0;

        if (current >= max) {
          return {
            allowed: false,
            remaining: 0,
            retryAfterMs: Math.max(0, windowEnd - now),
          };
        }

        const newCount = current + 1;
        tx.set(docRef, {
          count: newCount,
          key,
          windowKey,
          // TTL field — configure a Firestore TTL policy on this collection
          expiresAt: new Date(windowEnd + windowMs),
        });

        return {
          allowed: true,
          remaining: max - newCount,
          retryAfterMs: 0,
        };
      });

      return result;
    } catch (err) {
      // Firestore falló (outage, timeout, etc.).
      // Fallback en memoria: fail-CLOSED para endpoints sensibles.
      // No distribuido (por instancia), pero evita que una caída de Firestore
      // deje las APIs completamente sin protección.
      console.error('[rate-limiter] Firestore error, using in-memory fallback:', err);
      return _memoryFallback(key, max, windowMs, now, windowEnd);
    }
  },
};

/* ── Extracts the real client IP considering reverse proxies ────────────── */
export function getClientIp(req: Request): string {
  const headers = (req as unknown as { headers: Headers }).headers;
  return (
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}
