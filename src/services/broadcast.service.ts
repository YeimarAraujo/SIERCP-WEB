/**
 * broadcast.service.ts — Persiste anuncios masivos (in-app) en Firestore.
 *
 * Complemento de `push-sender.service.ts`: mientras ese envía el push FCM al
 * celular, este escribe UN documento en la colección `broadcasts` para que la
 * campanita in-app (app Flutter / web) muestre el anuncio. La app fusiona estos
 * broadcasts con las notificaciones personales y filtra por audiencia en cliente.
 *
 * Diseño "doc global + filtro en app": un único documento por envío (en vez de
 * uno por usuario), con la audiencia descrita en el propio doc.
 */

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';

export type BroadcastAudience = 'all' | 'role' | 'institution';

export interface BroadcastInput {
  audience: BroadcastAudience;
  /** Requerido si audience === 'role'. */
  role?: string;
  /** Requerido si audience === 'institution'. */
  institutionId?: string;
  title: string;
  message: string;
  /** Tipo de notificación (ej. 'system', 'payment', 'course_update'). */
  type: string;
  /** Deep-link al tocar la notificación. */
  link?: string;
}

/**
 * Escribe el documento de broadcast. Las reglas de Firestore exigen rol admin.
 * No lanza para errores de red controlados; relanza el error de Firestore para
 * que el caller decida cómo informarlo en la UI.
 */
export async function writeBroadcast(input: BroadcastInput): Promise<void> {
  await addDoc(collection(db, 'broadcasts'), {
    audience: input.audience,
    role: input.audience === 'role' ? input.role ?? null : null,
    institutionId:
      input.audience === 'institution' ? input.institutionId ?? null : null,
    title: input.title,
    message: input.message,
    type: input.type,
    link: input.link ?? '/notifications',
    createdAt: serverTimestamp(),
  });
}
