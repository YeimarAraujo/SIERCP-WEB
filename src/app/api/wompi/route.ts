/**
 * POST /api/wompi/create-transaction
 *
 * API Route del SERVIDOR que crea transacciones en Wompi.
 * La llave privada y la integrity key NUNCA llegan al cliente.
 *
 * Flujo:
 *  1. Cliente envía: método de pago tokenizado + datos del cliente + referencia
 *  2. Este route genera la firma de integridad (SHA-256)
 *  3. Llama a Wompi con la PRIVATE KEY
 *  4. Guarda la referencia en Firestore (estado: pending)
 *  5. Retorna la transacción al cliente
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { rateLimiter, getClientIp } from '@/lib/rate-limiter';

const WOMPI_API_BASE =
  process.env.WOMPI_ENV === 'production'
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1';

const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY!;
const WOMPI_INTEGRITY_KEY = process.env.WOMPI_INTEGRITY_KEY!;
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL!;

// ─── Integridad SHA-256 ────────────────────────────────────────────────────

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
  currency: string
): Promise<string> {
  return sha256(`${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_KEY}`);
}

// ─── Input validation ─────────────────────────────────────────────────────

function validateBody(body: Record<string, unknown>): string | null {
  if (!body.reference || typeof body.reference !== 'string')
    return 'Referencia inválida';
  if (!body.amount_in_cents || typeof body.amount_in_cents !== 'number' || body.amount_in_cents < 100)
    return 'Monto inválido (mínimo 100 centavos)';
  if (!body.customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customer_email as string))
    return 'Email inválido';
  if (!body.acceptance_token || typeof body.acceptance_token !== 'string')
    return 'Falta el acceptance_token de términos y condiciones';
  if (!body.payment_method || typeof body.payment_method !== 'object')
    return 'Método de pago inválido';
  if (!body.customer_data || typeof body.customer_data !== 'object')
    return 'Datos del cliente incompletos';
  if (!body.curso_slug || typeof body.curso_slug !== 'string')
    return 'Identificador del curso requerido';
  return null;
}

// ─── Route Handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    /* 0. Rate limiting: máximo 5 intentos de pago por IP cada 60 s */
    const ip = getClientIp(req);
    const rl = rateLimiter.check(`wompi:${ip}`, { max: 5, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Espera un momento antes de reintentar.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // 1. Autenticación: el usuario debe estar logueado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // 2. Parsear y validar el cuerpo
    const body = await req.json();
    const validationError = validateBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const {
      reference,
      amount_in_cents,
      customer_email,
      acceptance_token,
      payment_method,
      customer_data,
      curso_slug,
      grupo_id,
      cohort_id,
      template_id,
      institution_id,
    } = body;

    // 3. Idempotencia: verificar que la referencia no haya sido usada ya (APPROVED)
    const existingTx = await adminDb
      .collection('transactions')
      .where('reference', '==', reference)
      .where('status', '==', 'APPROVED')
      .limit(1)
      .get();

    if (!existingTx.empty) {
      return NextResponse.json(
        { error: 'Esta transacción ya fue procesada exitosamente' },
        { status: 409 }
      );
    }

    // 4. Generar firma de integridad (SHA-256 con INTEGRITY_KEY del servidor)
    const signature = await buildIntegritySignature(reference, amount_in_cents, 'COP');

    // 5. Construir el payload para Wompi
    const wompiPayload: Record<string, unknown> = {
      amount_in_cents,
      currency: 'COP',
      customer_email,
      payment_method,
      reference,
      customer_data,
      acceptance_token,
      signature,
    };

    // PSE y NEQUI requieren redirect_url
    const methodType = (payment_method as { type: string }).type;
    if (methodType === 'PSE' || methodType === 'NEQUI') {
      const redirectParams = new URLSearchParams({
        ref: reference,
        curso: curso_slug || '',
        grupo: grupo_id || '',
        cohort: cohort_id || '',
        template: template_id || '',
        institution: institution_id || '',
      });
      wompiPayload.redirect_url = `${APP_BASE_URL}/checkout/resultado?${redirectParams.toString()}`;
    }

    // 6. Crear la transacción en Wompi
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
      return NextResponse.json({ error: reason }, { status: wompiRes.status });
    }

    const transaction = wompiJson.data;

    // 7. Guardar estado en Firestore para seguimiento y webhook
    await adminDb.collection('transactions').doc(transaction.id).set({
      wompi_id: transaction.id,
      reference,
      status: transaction.status,
      amount_in_cents,
      currency: 'COP',
      payment_method_type: methodType,
      curso_slug,
      grupo_id: grupo_id || null,
      cohort_id: cohort_id || null,
      template_id: template_id || null,
      institution_id: institution_id || null,
      user_id: userId,
      customer_email,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 8. Retornar la transacción al cliente (sin exponer datos sensibles)
    return NextResponse.json({
      transaction_id: transaction.id,
      status: transaction.status,
      redirect_url: transaction.redirect_url ?? null,
      payment_method_type: methodType,
      reference,
    });
  } catch (err: unknown) {
    console.error('[wompi/create-transaction]', err);
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}