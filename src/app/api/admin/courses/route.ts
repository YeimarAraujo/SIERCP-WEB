import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { sanitize } from '@/lib/utils';
import admin from 'firebase-admin';

/**
 * POST /api/admin/courses
 * Creates a new course template (for MANUAL institutions).
 *
 * PUT /api/admin/courses
 * Updates an existing course template.
 *
 * GET /api/admin/courses
 * Lists all templates for the admin's institution.
 *
 * DELETE /api/admin/courses
 * Deactivates a course template.
 */

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No autorizado');
  }

  const token = authHeader.split('Bearer ')[1];
  const decoded = await adminAuth.verifyIdToken(token);
  const userSnap = await adminDb.collection('users').doc(decoded.uid).get();

  if (!userSnap.exists) throw new Error('Usuario no encontrado');

  const user = userSnap.data()!;
  if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    throw new Error('Acceso denegado: se requiere rol ADMIN');
  }

  return { uid: decoded.uid, user, institutionId: user.institutionId };
}

// ─── GET: List templates ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { institutionId } = await verifyAdmin(req);

    const snaps = await adminDb
      .collection('course_templates')
      .where('institutionId', '==', institutionId)
      .orderBy('createdAt', 'desc')
      .get();

    const templates = snaps.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ templates });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST: Create template ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { uid, institutionId } = await verifyAdmin(req);
    const body = await req.json();

    // Validate required fields
    const title = sanitize(body.title);
    const slug = sanitize(body.slug) || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (!title) {
      return NextResponse.json({ error: 'El título del curso es requerido' }, { status: 400 });
    }

    // Check slug uniqueness within institution
    const existing = await adminDb
      .collection('course_templates')
      .where('institutionId', '==', institutionId)
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: `Ya existe un curso con el slug "${slug}" en tu institución` },
        { status: 409 },
      );
    }

    const templateData = {
      institutionId,
      slug,
      title,
      description: sanitize(body.description) || '',
      descriptionLong: sanitize(body.descriptionLong) || '',
      level: body.level || 'basico',
      modality: body.modality || 'presencial',
      duration: sanitize(body.duration) || '',
      sessions: Number(body.sessions) || 1,
      priceCOP: Number(body.priceCOP) || 0,
      priceUSD: Number(body.priceUSD) || 0,
      objectives: Array.isArray(body.objectives) ? body.objectives.map(sanitize) : [],
      requirements: Array.isArray(body.requirements) ? body.requirements.map(sanitize) : [],
      includesCertificate: Boolean(body.includesCertificate),
      regulations: Array.isArray(body.regulations) ? body.regulations.map(sanitize) : [],
      tags: Array.isArray(body.tags) ? body.tags.map(sanitize) : [],
      icon: sanitize(body.icon) || 'bi-book',
      targetAudience: sanitize(body.targetAudience) || '',
      isAutomated: false, // Manual institutions create non-automated templates
      modules: Array.isArray(body.modules) ? body.modules.map((m: any, i: number) => ({
        title: sanitize(m.title) || `Módulo ${i + 1}`,
        topics: Array.isArray(m.topics) ? m.topics.map(sanitize) : [],
        duration: sanitize(m.duration) || '',
        order: i,
      })) : [],
      isActive: true,
      createdBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = adminDb.collection('course_templates').doc();
    await ref.set(templateData);

    return NextResponse.json({
      success: true,
      templateId: ref.id,
      message: `Curso "${title}" creado exitosamente`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── PUT: Update template ────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const { institutionId } = await verifyAdmin(req);
    const body = await req.json();

    const templateId = sanitize(body.id);
    if (!templateId) {
      return NextResponse.json({ error: 'ID del template requerido' }, { status: 400 });
    }

    // Verify ownership
    const templateSnap = await adminDb.collection('course_templates').doc(templateId).get();
    if (!templateSnap.exists) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }
    if (templateSnap.data()?.institutionId !== institutionId) {
      return NextResponse.json({ error: 'No tienes permisos para editar este curso' }, { status: 403 });
    }

    const updateData: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Only update provided fields
    const allowedFields = [
      'title', 'description', 'descriptionLong', 'level', 'modality',
      'duration', 'sessions', 'priceCOP', 'priceUSD', 'objectives',
      'requirements', 'includesCertificate', 'regulations', 'tags',
      'icon', 'targetAudience', 'modules', 'isActive',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    await adminDb.collection('course_templates').doc(templateId).update(updateData);

    return NextResponse.json({ success: true, message: 'Curso actualizado exitosamente' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── DELETE: Deactivate template ─────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { institutionId } = await verifyAdmin(req);
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'ID del template requerido' }, { status: 400 });
    }

    const templateSnap = await adminDb.collection('course_templates').doc(templateId).get();
    if (!templateSnap.exists) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }
    if (templateSnap.data()?.institutionId !== institutionId) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    }

    await adminDb.collection('course_templates').doc(templateId).update({
      isActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: 'Curso desactivado exitosamente' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
