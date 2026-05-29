'use client';

/**
 * Servicio de telemetría en tiempo real vía Firebase Realtime Database.
 *
 * Estructura RTDB:
 *   telemetry/{sessionId}          → datos en vivo de la sesión activa
 *   live_sessions/{institutionId}/{courseId}/{sessionId} → metadata de sesión activa
 */

import { ref, onValue, off, type DatabaseReference } from 'firebase/database';
import { rtdb } from '@/shared/lib/firebase';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface LiveTelemetry {
  depthMm:                 number;
  ratePerMin:              number;
  forceKg:                 number;
  compressionCount:        number;
  correctCompressionCount: number;
  correctPct:              number;
  sessionScore:            number;
  decompressedFully:       boolean;
  recoilPct:               number;
  pauseCount:              number;
  maxPauseSec:             number;
  sensorOk:                boolean;
  calibrated:              boolean;
  updatedAt:               number;
}

export interface LiveSessionEntry {
  studentId:     string;
  studentName:   string;
  scenarioId:    string;
  scenarioTitle: string;
  manikinId:     string;
  courseId:      string;
  institutionId: string;
  status:        'active' | 'completed';
  startedAt:     number;
  heartbeat:     number;
  sessionId?:    string; // injected by the reader
}

export interface TelemetryPoint {
  t:       number;   // índice temporal (0-N)
  depth:   number;   // profundidad en mm
  rate:    number;   // frecuencia en cpm
  quality: number;   // calidad %
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEFAULT_TELEMETRY: LiveTelemetry = {
  depthMm: 0, ratePerMin: 0, forceKg: 0,
  compressionCount: 0, correctCompressionCount: 0,
  correctPct: 0, sessionScore: 0, decompressedFully: false,
  recoilPct: 100, pauseCount: 0, maxPauseSec: 0,
  sensorOk: true, calibrated: false, updatedAt: 0,
};

/** Devuelve true si la sesión tiene heartbeat reciente (< 60s) */
export function isSessionAlive(entry: LiveSessionEntry): boolean {
  return Date.now() - entry.heartbeat < 60_000;
}

// ── Suscripciones ─────────────────────────────────────────────────────────────

/**
 * Suscribirse a la telemetría en tiempo real de UNA sesión específica.
 * @returns función de cancelación (llamar en cleanup)
 */
export function subscribeTelemetry(
  sessionId: string,
  callback: (data: LiveTelemetry) => void,
): () => void {
  const dbRef: DatabaseReference = ref(rtdb, `telemetry/${sessionId}`);

  const handler = onValue(dbRef, (snapshot) => {
    const raw = snapshot.val();
    if (!raw) {
      callback({ ...DEFAULT_TELEMETRY });
      return;
    }
    callback({
      depthMm:                 raw.depthMm                 ?? 0,
      ratePerMin:              raw.ratePerMin              ?? 0,
      forceKg:                 raw.forceKg                 ?? 0,
      compressionCount:        raw.compressionCount        ?? 0,
      correctCompressionCount: raw.correctCompressionCount ?? 0,
      correctPct:              raw.correctPct              ?? 0,
      sessionScore:            raw.sessionScore            ?? 0,
      decompressedFully:       raw.decompressedFully       ?? false,
      recoilPct:               raw.recoilPct               ?? 100,
      pauseCount:              raw.pauseCount              ?? 0,
      maxPauseSec:             raw.maxPauseSec             ?? 0,
      sensorOk:                raw.sensorOk                ?? true,
      calibrated:              raw.calibrated              ?? false,
      updatedAt:               raw.updatedAt               ?? 0,
    });
  });

  return () => off(dbRef, 'value', handler);
}

/**
 * Suscribirse a todas las sesiones activas de un curso específico en RTDB.
 * @returns función de cancelación
 */
export function subscribeLiveSessions(
  institutionId: string,
  courseId: string,
  callback: (sessions: LiveSessionEntry[]) => void,
): () => void {
  const dbRef: DatabaseReference = ref(
    rtdb,
    `live_sessions/${institutionId}/${courseId}`,
  );

  const handler = onValue(dbRef, (snapshot) => {
    const raw = snapshot.val() as Record<string, Omit<LiveSessionEntry, 'sessionId'>> | null;
    if (!raw) {
      callback([]);
      return;
    }
    const entries: LiveSessionEntry[] = Object.entries(raw)
      .map(([sessionId, data]) => ({ ...data, sessionId }))
      .filter(isSessionAlive);
    callback(entries);
  });

  return () => off(dbRef, 'value', handler);
}

/**
 * Suscribirse a todas las sesiones activas de una institución (todos los cursos).
 * Útil para el dashboard de admin.
 * @returns función de cancelación
 */
export function subscribeAllLiveSessions(
  institutionId: string,
  callback: (sessions: LiveSessionEntry[]) => void,
): () => void {
  const dbRef: DatabaseReference = ref(rtdb, `live_sessions/${institutionId}`);

  const handler = onValue(dbRef, (snapshot) => {
    const raw = snapshot.val() as Record<string, Record<string, Omit<LiveSessionEntry, 'sessionId'>>> | null;
    if (!raw) {
      callback([]);
      return;
    }
    const all: LiveSessionEntry[] = [];
    for (const courseId of Object.keys(raw)) {
      const courseSessions = raw[courseId];
      for (const [sessionId, data] of Object.entries(courseSessions)) {
        const entry = { ...data, sessionId };
        if (isSessionAlive(entry)) all.push(entry);
      }
    }
    callback(all);
  });

  return () => off(dbRef, 'value', handler);
}
