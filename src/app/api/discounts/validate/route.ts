/**
 * POST /api/discounts/validate
 *
 * Validates a promotional discount code against the Firestore `discount_codes` collection.
 * Rate-limited to prevent brute-force enumeration.
 *
 * Collection schema: discount_codes/{code}
 *   code: string
 *   discountType: 'percent' | 'fixed'
 *   discountValue: number  (percent 0–100, or fixed COP amount)
 *   maxUses: number | null
 *   usedCount: number
 *   validUntil: Timestamp | null
 *   active: boolean
 *   description: string
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { rateLimiter, getClientIp } from '@/lib/rate-limiter';
import { z } from 'zod';

const Schema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  amountCents: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimiter.check(`discount-validate:${ip}`, { max: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ valid: false, error: 'Demasiados intentos.' }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ valid: false, error: 'Cuerpo inválido.' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ valid: false, error: 'Datos inválidos.' }, { status: 400 });
  }

  const { code, amountCents } = parsed.data;

  try {
    const snap = await adminDb.collection('discount_codes').doc(code).get();

    if (!snap.exists) {
      return NextResponse.json({ valid: false, error: 'Código no encontrado.' });
    }

    const data = snap.data()!;

    if (!data.active) {
      return NextResponse.json({ valid: false, error: 'Este código ya no está activo.' });
    }

    if (data.maxUses !== null && data.usedCount >= data.maxUses) {
      return NextResponse.json({ valid: false, error: 'Este código ha alcanzado su límite de usos.' });
    }

    if (data.validUntil && data.validUntil.toDate() < new Date()) {
      return NextResponse.json({ valid: false, error: 'Este código ha expirado.' });
    }

    let discountCents = 0;
    if (data.discountType === 'percent') {
      discountCents = Math.round((amountCents * data.discountValue) / 100);
    } else {
      discountCents = Math.min(data.discountValue * 100, amountCents);
    }

    return NextResponse.json({
      valid: true,
      discountCents,
      discountPercent: data.discountType === 'percent' ? data.discountValue : 0,
      description: data.description ?? '',
    });
  } catch (err) {
    console.error('[discounts/validate] error:', err);
    return NextResponse.json({ valid: false, error: 'Error interno. Intenta de nuevo.' }, { status: 500 });
  }
}
