/**
 * push-sender.service.ts — Dispara notificaciones push vía el Cloudflare Worker
 * gratuito de SIERCP (ver carpeta `cloudflare-worker/`).
 *
 * No requiere Cloud Functions de pago. El Worker valida que quien llama sea
 * admin (con el ID token de Firebase) antes de enviar a FCM.
 *
 * Configura la URL del Worker en `.env.local`:
 *   NEXT_PUBLIC_PUSH_WORKER_URL=https://siercp-push.<tu-subdominio>.workers.dev
 */

import { getAuth } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const WORKER_URL = process.env.NEXT_PUBLIC_PUSH_WORKER_URL ?? '';

export interface PushPayload {
  /** Destino por tópico: "all" | "role_<rol>" | "inst_<institutionId>". */
  topic?: string;
  /** Destino por tokens FCM concretos (alternativa a topic). */
  tokens?: string[];
  title: string;
  body: string;
  /** Ruta interna para deep-link al tocar (p.ej. "/notifications"). */
  link?: string;
  data?: Record<string, string>;
}

export interface PushResult {
  ok: boolean;
  sent?: number;
  failed?: number;
  error?: string;
}

/**
 * Envía un push. Debe llamarse desde una sesión de admin (el Worker rechaza
 * a no-admins). Devuelve el resultado sin lanzar para facilitar el manejo en UI.
 */
export async function sendPush(payload: PushPayload): Promise<PushResult> {
  if (!WORKER_URL) {
    return { ok: false, error: 'NEXT_PUBLIC_PUSH_WORKER_URL no está configurada' };
  }

  const user = getAuth().currentUser;
  if (!user) return { ok: false, error: 'No hay sesión activa' };

  try {
    const idToken = await user.getIdToken();
    const res = await fetch(`${WORKER_URL.replace(/\/$/, '')}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as PushResult;
    if (!res.ok) return { ok: false, error: json.error ?? `HTTP ${res.status}` };
    return json;
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Broadcast in-app (colección `broadcasts`) ────────────────────────────────

export interface BroadcastInput {
  audience: 'all' | 'role' | 'institution';
  role?: string; // requerido si audience === 'role'
  institutionId?: string; // requerido si audience === 'institution'
  title: string;
  message: string;
  type?: string; // tipo de notificación (system, payment, ...)
  link?: string;
  data?: Record<string, string>;
}

/**
 * Escribe el anuncio en la colección `broadcasts` de Firestore.
 *
 * Esto es lo que hace que el anuncio aparezca en la CAMPANA in-app (Flutter)
 * aunque el dispositivo no tenga push o la app esté instalada después. El push
 * FCM (sendPush) es complementario: notifica al instante; el broadcast persiste
 * y se ve al abrir la app.
 *
 * Requiere sesión de admin (las reglas de Firestore exigen rol admin).
 */
export async function createBroadcast(input: BroadcastInput): Promise<PushResult> {
  try {
    await addDoc(collection(db, 'broadcasts'), {
      audience: input.audience,
      ...(input.audience === 'role' ? { role: input.role ?? null } : {}),
      ...(input.audience === 'institution'
        ? { institutionId: input.institutionId ?? null }
        : {}),
      title: input.title,
      message: input.message,
      type: input.type ?? 'system',
      link: input.link ?? '/notifications',
      data: input.data ?? {},
      createdAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Atajo: anuncio a todos los usuarios. */
export function broadcastToAll(title: string, body: string, link?: string) {
  return sendPush({ topic: 'all', title, body, link });
}

/** Atajo: a todos los usuarios de un rol. */
export function sendToRole(role: string, title: string, body: string, link?: string) {
  return sendPush({ topic: `role_${role}`, title, body, link });
}

/** Atajo: a todos los miembros de una institución. */
export function sendToInstitution(institutionId: string, title: string, body: string, link?: string) {
  return sendPush({ topic: `inst_${institutionId}`, title, body, link });
}
