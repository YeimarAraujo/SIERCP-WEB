/**
 * POST /api/wompi
 *
 * Creates a Wompi transaction for course enrollment.
 *
 * SECURITY: The client NEVER controls the price. The server looks up
 * the canonical price from Firestore (cohorts/{cohortId}.priceCOP or
 * course_templates/{templateId}.priceCOP) and uses that for the signature.
 * Any amount sent by the client is IGNORED.
 *
 * Client sends: { cohortId?, templateId?, cursoSlug, paymentMethod, customerData, acceptanceToken }
 * Server returns: { transactionId, status, redirectUrl?, reference }
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { rateLimiter, getClientIp } from '@/lib/rate-limiter';
import { auditLog } from '@/lib/audit-logger';
import { WompiRequestSchema, parseBody } from '@/lib/schemas';
import {
  getIdempotencyKey,
  checkIdempotency,
  markIdempotencyProcessing,
  storeIdempotencyResult,
} from '@/lib/idempotency';

const WOMPI_API_BASE =
  process.env.WOMPI_ENV === 'production'
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1';

const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY!;
const WOMPI_INTEGRITY_KEY = process.env.WOMPI_INTEGRITY_KEY!;
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL!;

// ── Integrity signature ────────────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function buildIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
): Promise<string> {
  return sha256(`${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_KEY}`);
}

// ── Server-side price resolution ──────────────────────────────────────────

/**
 * Resolves the canonical price (in COP cents) from Firestore.
 * Priority: cohortId → templateId → cursoSlug.
 * Returns null if the course cannot be found or is free.
 */
async function resolveServerPrice(
  cohortId?: string,
  templateId?: string,
  cursoSlug?: string,
): Promise<{ priceCents: number; courseTitle: string; resolvedCohortId: string; resolvedTemplateId: string } | null> {
  let priceCOP = 0;
  let courseTitle = cursoSlug ?? '';
  let resolvedCohortId = cohortId ?? '';
  let resolvedTemplateId = templateId ?? '';

  // 1. Try cohort first (most specific — prices can vary per cohort)
  if (resolvedCohortId) {
    const cohortDoc = await adminDb.collection('cohorts').doc(resolvedCohortId).get();
    if (cohortDoc.exists) {
      const cohortData = cohortDoc.data()!;
      priceCOP = cohortData.priceCOP ?? 0;
      courseTitle = cohortData.courseTitle ?? courseTitle;
      // Resolve templateId from cohort if missing
      if (!resolvedTemplateId) resolvedTemplateId = cohortData.templateId ?? '';
    }
  }

  // 2. Fall back to template if no cohort price
  if (!priceCOP && resolvedTemplateId) {
    const templateDoc = await adminDb
      .collection('course_templates')
      .doc(resolvedTemplateId)
      .get();
    if (templateDoc.exists) {
      const templateData = templateDoc.data()!;
      priceCOP = templateData.priceCOP ?? 0;
      courseTitle = templateData.title ?? courseTitle;
    }
  }

  // 3. Fall back to slug search
  if (!priceCOP && !resolvedTemplateId && cursoSlug) {
    const templateSnap = await adminDb
      .collection('course_templates')
      .where('slug', '==', cursoSlug)
      .limit(1)
      .get();
    if (!templateSnap.empty) {
      const templateData = templateSnap.docs[0].data();
      priceCOP = templateData.priceCOP ?? 0;
      courseTitle = templateData.title ?? courseTitle;
      resolvedTemplateId = templateSnap.docs[0].id;
    }
  }

  if (!priceCOP) return null; // Free course or not found

  return {
    priceCents: priceCOP * 100, // Convert COP to cents
    courseTitle,
    resolvedCohortId,
    resolvedTemplateId,
  };
}

// WompiRequestBody type is now derived from the Zod schema in @/lib/schemas

// ── Route Handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    // 0. Rate limiting
    const rl = await rateLimiter.check(`wompi:${ip}`, { max: 5, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Espera un momento antes de reintentar.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }

    // 1. Authentication — JWT required
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }
    let decodedToken: { uid: string };
    try {
      decodedToken = await adminAuth.verifyIdToken(authHeader.slice(7));
    } catch {
      return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    // 1b. Idempotency-Key
    const idemKey = getIdempotencyKey(req);
    if (idemKey) {
      const cached = await checkIdempotency(idemKey, userId);
      if (cached) {
        return NextResponse.json(cached.body, { status: cached.status });
      }
      await markIdempotencyProcessing(idemKey, userId);
    }

    // 2. Parse and validate body with Zod
    const parsed = await parseBody(req, WompiRequestSchema);
    if (parsed.error) return parsed.error;

    const {
      customer_email,
      acceptance_token,
      payment_method,
      customer_data,
      curso_slug,
      cohort_id,
      template_id,
      institution_id,
      grupo_id,
    } = parsed.data;

    // 3. ── SERVER-SIDE PRICE RESOLUTION ───────────────────────────────────
    // The client NEVER controls the amount. We look it up from Firestore.
    const priceInfo = await resolveServerPrice(cohort_id, template_id, curso_slug);

    if (!priceInfo) {
      return NextResponse.json(
        { error: 'Curso no encontrado o no tiene precio asignado. Contacta al soporte.' },
        { status: 422 },
      );
    }

    const { priceCents, courseTitle, resolvedCohortId, resolvedTemplateId } = priceInfo;

    // Generate reference if not provided (or always generate fresh one for security)
    const reference = `SIERCP-${curso_slug ?? resolvedTemplateId}-${userId}-${Date.now()}`;

    // 4. Idempotency: check for existing APPROVED transaction with same reference pattern
    const existingTx = await adminDb
      .collection('transactions')
      .where('user_id', '==', userId)
      .where('curso_slug', '==', curso_slug ?? '')
      .where('cohort_id', '==', resolvedCohortId)
      .where('status', '==', 'APPROVED')
      .limit(1)
      .get();

    if (!existingTx.empty) {
      return NextResponse.json(
        { error: 'Ya tienes una inscripción aprobada para este curso.' },
        { status: 409 },
      );
    }

    // 5. Build integrity signature with SERVER price (not client-provided amount)
    const signature = await buildIntegritySignature(reference, priceCents, 'COP');

    // 6. Build Wompi payload
    const wompiPayload: Record<string, unknown> = {
      amount_in_cents: priceCents,  // ← Server-calculated, never from client
      currency: 'COP',
      customer_email,
      payment_method,
      reference,
      customer_data,
      acceptance_token,
      signature,
    };

    // PSE and Nequi require redirect_url
    const methodType = (payment_method as { type: string }).type;
    if (methodType === 'PSE' || methodType === 'NEQUI') {
      const redirectParams = new URLSearchParams({
        ref: reference,
        curso: curso_slug ?? '',
        grupo: grupo_id ?? '',
        cohort: resolvedCohortId,
        template: resolvedTemplateId,
        institution: institution_id ?? '',
      });
      wompiPayload.redirect_url = `${APP_BASE_URL}/checkout/resultado?${redirectParams.toString()}`;
    }

    // 7. Call Wompi API
    const wompiRes = await fetch(`${WOMPI_API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WOMPI_PRIVATE_KEY}`,
      },
      body: JSON.stringify(wompiPayload),
    });

    const wompiJson = await wompiRes.json();

    if (!wompiRes.ok) {
      const reason =
        wompiJson?.error?.messages
          ? Object.values(wompiJson.error.messages).flat().join('. ')
          : wompiJson?.error?.reason || 'Error en el procesador de pagos';

      await auditLog({
        type: 'payment_failed',
        userId,
        severity: 'WARN',
        ip,
        metadata: { reason, reference, courseSlug: curso_slug, cohortId: resolvedCohortId },
      });

      return NextResponse.json({ error: reason }, { status: wompiRes.status });
    }

    const transaction = wompiJson.data;

    // 8. Persist transaction to Firestore (user_id is from JWT, not from client)
    await adminDb.collection('transactions').doc(transaction.id).set({
      wompi_id: transaction.id,
      reference,
      status: transaction.status,
      amount_in_cents: priceCents,       // ← Server-calculated price persisted
      currency: 'COP',
      payment_method_type: methodType,
      curso_slug: curso_slug ?? '',
      cohort_id: resolvedCohortId,
      template_id: resolvedTemplateId,
      grupo_id: grupo_id ?? null,
      institution_id: institution_id ?? null,
      user_id: userId,                   // ← From JWT, never from client body
      customer_email,
      course_title: courseTitle,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await auditLog({
      type: 'payment_attempt',
      userId,
      severity: 'INFO',
      ip,
      metadata: {
        txId: transaction.id,
        reference,
        priceCents,
        courseSlug: curso_slug,
        cohortId: resolvedCohortId,
        method: methodType,
      },
    });

    // 9. Return response (no sensitive data)
    const responseBody = {
      transaction_id: transaction.id,
      status: transaction.status,
      redirect_url: transaction.redirect_url ?? null,
      payment_method_type: methodType,
      reference,
      amount_in_cents: priceCents,  // Return actual server price so client can show it
      course_title: courseTitle,
    };

    if (idemKey) {
      await storeIdempotencyResult(idemKey, userId, 200, responseBody);
    }

    return NextResponse.json(responseBody);
  } catch (err: unknown) {
    console.error('[wompi/create-transaction]', err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
