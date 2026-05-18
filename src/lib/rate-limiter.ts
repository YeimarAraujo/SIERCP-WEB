/**
 * Rate limiter en memoria para proteger los endpoints críticos.
 *
 * Usa un sliding-window simple: por cada IP se lleva un array de timestamps.
 * Entradas mayores a `windowMs` se descartan antes de cada verificación.
 *
 * Uso:
 *   const { allowed, remaining } = rateLimiter.check(ip, { max: 5, windowMs: 60_000 });
 *   if (!allowed) return NextResponse.json({ error: '...' }, { status: 429 });
 */

interface Window {
  hits: number[];
}

/* Map global: sobrevive entre hot-reloads en desarrollo (módulo cacheado) */
const store = new Map<string, Window>();

/* Limpieza periódica para evitar fugas de memoria */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, win] of store.entries()) {
      /* Conserva sólo si hay hits recientes en la última hora */
      win.hits = win.hits.filter(t => now - t < 3_600_000);
      if (win.hits.length === 0) store.delete(key);
    }
  }, 300_000); // cada 5 minutos
}

export interface RateLimitOptions {
  /** Número máximo de peticiones permitidas en la ventana */
  max: number;
  /** Tamaño de la ventana en milisegundos */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Milisegundos hasta que el cliente pueda intentarlo de nuevo */
  retryAfterMs: number;
}

export const rateLimiter = {
  /**
   * Comprueba y registra una petición de `key` (normalmente la IP del cliente).
   * Retorna si la petición está permitida y cuántas quedan en la ventana.
   */
  check(key: string, opts: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    const windowStart = now - opts.windowMs;

    let win = store.get(key);
    if (!win) {
      win = { hits: [] };
      store.set(key, win);
    }

    /* Descarta hits fuera de la ventana deslizante */
    win.hits = win.hits.filter(t => t > windowStart);

    if (win.hits.length >= opts.max) {
      const oldest = win.hits[0];
      const retryAfterMs = oldest + opts.windowMs - now;
      return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) };
    }

    win.hits.push(now);
    return {
      allowed: true,
      remaining: opts.max - win.hits.length,
      retryAfterMs: 0,
    };
  },

  /** Elimina todos los registros de una clave (útil en tests) */
  reset(key: string) {
    store.delete(key);
  },
};

/* ── Extrae la IP real del cliente considerando proxies ──────────────────── */
export function getClientIp(req: Request): string {
  const headers = (req as any).headers as Headers;
  return (
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}
