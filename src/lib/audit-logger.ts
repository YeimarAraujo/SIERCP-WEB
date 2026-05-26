/**
 * audit-logger — Immutable audit trail for security-sensitive operations.
 *
 * All writes go to Firestore `audit_logs/` collection.
 * Only Cloud Functions and server-side API routes can write here.
 * CRITICAL severity events also log to stderr for external monitoring.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './firebase-admin';

export type AuditEventType =
  | 'payment_attempt'
  | 'payment_success'
  | 'payment_failed'
  | 'enrollment_created'
  | 'enrollment_free_bypass_attempt'
  | 'enrollment_unauthorized_attempt'
  | 'login'
  | 'logout'
  | 'role_change'
  | 'data_export'
  | 'suspicious_activity'
  | 'idor_attempt'
  | 'debug_access_blocked'
  | 'super_admin_action'
  | 'plan_override'
  | 'institution_created'
  | 'institution_modified'
  | 'user_impersonate'
  | 'transaction_forced_approved'
  | 'refund_issued'
  | 'plan_subscription_activated'
  | 'institution_created'
  | 'new_institution_checkout_started';

export type AuditSeverity = 'INFO' | 'WARN' | 'CRITICAL';

interface AuditLogEvent {
  type: AuditEventType;
  userId?: string;
  metadata: Record<string, unknown>;
  severity: AuditSeverity;
  ip: string;
  requestId?: string;
}

/**
 * Writes an audit log entry to Firestore.
 * Never throws — a logging failure must not crash the request.
 */
export async function auditLog(event: AuditLogEvent): Promise<void> {
  try {
    await adminDb.collection('audit_logs').add({
      type: event.type,
      userId: event.userId ?? null,
      metadata: event.metadata,
      severity: event.severity,
      ip: event.ip,
      requestId: event.requestId ?? null,
      timestamp: FieldValue.serverTimestamp(),
      environment: process.env.NODE_ENV ?? 'unknown',
    });

    if (event.severity === 'CRITICAL') {
      // Structured output for external log aggregation (Sentry, Logflare, etc.)
      console.error('[AUDIT:CRITICAL]', JSON.stringify({
        type: event.type,
        userId: event.userId,
        ip: event.ip,
        metadata: event.metadata,
        requestId: event.requestId,
        ts: new Date().toISOString(),
      }));
    } else if (event.severity === 'WARN') {
      console.warn('[AUDIT:WARN]', event.type, { userId: event.userId, ip: event.ip });
    }
  } catch (err) {
    // Silent fail — never let logging crash a request
    console.error('[audit-logger] Failed to persist audit log:', err);
  }
}
